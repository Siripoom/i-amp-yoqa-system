const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createObjectStorage, StorageError, configuration } = require("../services/objectStorage");
const { StorageChanges } = require("../services/storageChanges");

const env = { B2_ENDPOINT: "https://s3.us-west-004.backblazeb2.com", B2_REGION: "us-west-004", B2_BUCKET_NAME: "test-assets", B2_KEY_ID: "test-id", B2_APPLICATION_KEY: "test-secret" };
const file = { originalname: "รูป QR.png", mimetype: "image/png", buffer: Buffer.from("test image") };
const quiet = { error() {} };
function setup(send, overrides = {}) {
  const calls = [];
  const storage = createObjectStorage({ env: { ...env, ...overrides }, logger: quiet, makeClient: () => ({ async send(command) { calls.push(command); return send ? send(command) : { VersionId: "version-1" }; } }) });
  return { storage, calls };
}

test("missing B2 config does not fail until upload", async () => {
  const s = createObjectStorage({ env: {} });
  await s.remove("https://old.supabase.co/storage/v1/object/public/store/x.png");
  await assert.rejects(s.upload(file, "heroImages"), { code: "STORAGE_NOT_CONFIGURED" });
});

test("invalid config never exposes credentials", () => {
  assert.throws(() => configuration({ ...env, B2_ENDPOINT: "http://test-id:test-secret@example.com" }), (e) => e.code === "STORAGE_NOT_CONFIGURED" && !e.message.includes("test-secret"));
});

test("uploads preserve content and MIME, use unique keys, return public URLs", async () => {
  const { storage, calls } = setup();
  const a = await storage.upload(file, "payment_qrcodes");
  const b = await storage.upload(file, "payment_qrcodes");
  assert.notEqual(a.key, b.key);
  assert.match(a.key, /^payment_qrcodes\/[a-f0-9-]+\.png$/);
  assert.equal(a.versionId, "version-1");
  assert.equal(a.url, `${env.B2_ENDPOINT}/${env.B2_BUCKET_NAME}/${a.key}`);
  assert.equal(calls[0].input.Body, file.buffer);
  assert.equal(calls[0].input.ContentType, "image/png");
  assert.equal(calls[0].input.ContentLength, file.buffer.length);
  assert.equal(calls[0].input.ACL, undefined);
});

test("custom public URL and encoded keys resolve only within owned prefix", async () => {
  const { storage } = setup(null, { B2_PUBLIC_BASE_URL: "https://images.example.com/assets/" });
  assert.match((await storage.upload(file, "masters")).url, /^https:\/\/images.example.com\/assets\/masters\//);
  assert.equal(storage.keyFromUrl("https://images.example.com/assets/masters/a%20b.png?q=1"), "masters/a b.png");
  for (const url of ["https://images.example.com.evil/assets/x", "https://images.example.com/assets-other/x", "https://other.supabase.co/storage/v1/object/public/store/masters/x", "https://images.example.com/assets/a/%2e%2e%2fsecret", "https://images.example.com/assets/%", "https://user:pass@images.example.com/assets/x"]) assert.equal(storage.keyFromUrl(url), null);
});

for (const name of ["AccessDenied", "NoSuchBucket", "ENOTFOUND", "TimeoutError"]) {
  test(`${name} becomes a safe storage error`, async () => {
    const { storage } = setup(() => { const e = new Error("test-secret"); e.name = name; throw e; });
    await assert.rejects(storage.upload(file, "orders"), (e) => e instanceof StorageError && e.code === "STORAGE_UNAVAILABLE" && !e.message.includes("test-secret"));
  });
}

test("delete targets exact version instead of leaving a delete marker", async () => {
  const { storage, calls } = setup();
  await storage.remove(`${env.B2_ENDPOINT}/${env.B2_BUCKET_NAME}/heroImages/a.png`);
  assert.deepEqual(calls.map(c => c.constructor.name), ["HeadObjectCommand", "DeleteObjectCommand"]);
  assert.equal(calls[1].input.VersionId, "version-1");
  assert.equal(calls[1].input.Key, "heroImages/a.png");
});

test("foreign and legacy URLs never result in deletion calls", async () => {
  const { storage, calls } = setup();
  await storage.remove("https://old.supabase.co/storage/v1/object/public/store/heroImages/a.png");
  await storage.remove(`${env.B2_ENDPOINT}/another-bucket/heroImages/a.png`);
  assert.equal(calls.length, 0);
});

test("missing object deletion is idempotent", async () => {
  const { storage } = setup(() => { const e = new Error(); e.name = "NotFound"; throw e; });
  await storage.remove(`${env.B2_ENDPOINT}/${env.B2_BUCKET_NAME}/a.png`);
});

test("replacement removes old file only after commit", async () => {
  const { storage, calls } = setup();
  const changes = new StorageChanges(storage);
  const old = `${env.B2_ENDPOINT}/${env.B2_BUCKET_NAME}/old.png`;
  await changes.upload(file, "products", old);
  assert.equal(calls.length, 1);
  changes.commit();
  await changes.finish();
  assert.equal(calls.at(-1).input.Key, "old.png");
});

test("failed save rolls back new version, leaving old image untouched", async () => {
  const { storage, calls } = setup();
  const changes = new StorageChanges(storage);
  await changes.upload(file, "products", `${env.B2_ENDPOINT}/${env.B2_BUCKET_NAME}/old.png`);
  await changes.finish();
  assert.deepEqual(calls.map(c => c.constructor.name), ["PutObjectCommand", "DeleteObjectCommand"]);
  assert.equal(calls[1].input.Key, calls[0].input.Key);
  assert.equal(calls[1].input.VersionId, "version-1");
});

test("partial multi-upload cleans all successful new objects", async () => {
  let puts = 0;
  const { storage, calls } = setup(command => {
    if (command.constructor.name === "PutObjectCommand" && ++puts === 2) throw new Error("network");
    return { VersionId: "v1" };
  });
  const changes = new StorageChanges(storage);
  await assert.rejects(changes.uploadMany([file, file, file], "goods", ["old-url"]));
  await changes.finish();
  assert.equal(calls.filter(c => c.constructor.name === "DeleteObjectCommand").length, 1);
  assert.equal(calls.at(-1).input.Key, calls[0].input.Key);
});

test("cleanup failure cannot roll back a committed record", async () => {
  const { storage } = setup(() => { throw new Error("AccessDenied"); });
  const changes = new StorageChanges(storage);
  changes.removeAfterCommit(`${env.B2_ENDPOINT}/${env.B2_BUCKET_NAME}/old.png`);
  changes.commit();
  await changes.finish();
  assert.equal(changes.committed, true);
});
