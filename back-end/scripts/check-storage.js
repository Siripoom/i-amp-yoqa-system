require("dotenv").config();
const assert = require("node:assert/strict");
const { S3Client, HeadBucketCommand } = require("@aws-sdk/client-s3");
const { configuration, objectStorage } = require("../services/objectStorage");

async function main() {
  const config = configuration(process.env);
  const client = new S3Client({ endpoint: config.endpoint, region: config.region, credentials: config.credentials, forcePathStyle: true });
  try {
    await client.send(new HeadBucketCommand({ Bucket: config.bucket }), { abortSignal: AbortSignal.timeout(15000) });
  } finally { client.destroy(); }
  console.log(`B2 bucket reachable: ${config.bucket}`);
  if (!process.argv.includes("--write")) {
    console.log("Read-only check passed. Run storage:smoke to verify upload, public download and deletion.");
    return;
  }

  // Synthetic test image only. This script never connects to MongoDB or creates orders/QR records.
  const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=", "base64");
  const file = { originalname: "storage-check.png", mimetype: "image/png", buffer: bytes };
  const uploaded = [];
  try {
    for (let i = 0; i < 2; i++) {
      const object = await objectStorage.upload(file, "diagnostics");
      uploaded.push(object);
      const response = await fetch(object.url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
      assert.equal(response.status, 200, "Public download must return HTTP 200");
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes, "Downloaded bytes must match the upload");
    }
    assert.notEqual(uploaded[0].key, uploaded[1].key);
    console.log("Upload and unauthenticated public download passed for two unique images.");
  } finally {
    for (const object of uploaded) {
      try {
        await objectStorage.remove(object);
        const response = await fetch(`${object.url}?storage-check=${Date.now()}`, { method: "HEAD", signal: AbortSignal.timeout(15000), cache: "no-store" });
        assert.equal(response.status, 404, "Deleted object must no longer be downloadable");
      } catch (error) {
        console.error("Test object cleanup could not be verified", { key: object.key, code: error.name });
        process.exitCode = 1;
      }
    }
  }
  if (!process.exitCode) console.log("Deletion verified; no test records were added to MongoDB.");
}

main().catch((error) => {
  console.error("Storage check failed", { code: error.code || error.name, message: error.code === "STORAGE_NOT_CONFIGURED" ? error.message : "Check B2 credentials, endpoint, bucket access and public download settings." });
  process.exitCode = 1;
});
