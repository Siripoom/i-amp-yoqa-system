const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const { StorageChanges, respondStorageError } = require("../services/storageChanges");
const { StorageError } = require("../services/objectStorage");

const id = "507f1f77bcf86cd799439011";
const oldUrl = "https://bucket.example.com/assets/old.png";
const file = { originalname: "test.png", mimetype: "image/png", buffer: Buffer.from("test") };
const specs = [
  ["heroImage", "HeroImage", "heroImage", "heroImages", {}],
  ["sliderImage", "SliderImage", "sliderImage", "slider_images", { title: "test" }],
  ["master", "Master", "master", "masters", { mastername: "test" }],
  ["product", "Product", "product", "products", { sessions: 2, price: 100, duration: 30 }],
  ["goods", "Goods", "goods", "goods", { goods: "test", code: "TEST", price: 100, stock: 2 }],
  ["order", "Order", "order", "orders", { user_id: id, product_id: id, order_type: "product", quantity: 1, total_sessions: 2, total_duration: 30 }],
  ["class", "ClassCatalog", "classCatalog", "class", { classname: "test" }],
  ["qrCode", "PaymentQRCode", "paymentQrCode", "payment_qrcodes", {}],
];

// Execute real controllers and Mongoose validation; stub persistence/storage so
// no test can touch the user's MongoDB, payment records, or B2 bucket.
function fixture(spec, options = {}) {
  const [stem, entity, modelFile, prefix, body] = spec;
  const RealModel = require(`../models/${modelFile}`);
  const events = [];
  let persisted = { ...body, _id: id, image: stem === "goods" ? [oldUrl] : oldUrl };
  let serial = 0;
  const uploaded = [];
  const deleted = [];
  function Model(data) {
    const doc = new RealModel(data);
    doc.save = async () => {
      await doc.validate();
      if (options.saveFails) throw new Error("database write failed");
      persisted = doc.toObject();
      events.push("save");
      return doc;
    };
    return doc;
  }
  Model.findById = async () => options.missing ? null : new Model(persisted);
  Model.create = async (data) => new Model(data).save();
  Model.updateMany = async () => {};
  Model.findByIdAndUpdate = async (_id, update) => {
    if (options.disappears) return null;
    const data = { ...persisted, ...(update.$set || update) };
    for (const key of Object.keys(update.$unset || {})) delete data[key];
    return new Model(data).save();
  };
  Model.findByIdAndDelete = async () => {
    if (options.saveFails) throw new Error("database delete failed");
    events.push("delete-record");
    persisted = null;
  };
  const storage = {
    async upload(_file, folder) {
      events.push("upload");
      if (options.uploadFails || (options.partialFailure && serial === 1)) throw new StorageError("STORAGE_UNAVAILABLE", "Storage unavailable");
      const result = { key: `${folder}/${++serial}.png`, url: `https://bucket.example.com/assets/${folder}/${serial}.png`, versionId: `v${serial}` };
      uploaded.push(result);
      return result;
    },
    async cleanup(items) {
      for (const item of items) {
        const url = typeof item === "string" ? item : item.url;
        events.push(`delete-file:${url}`);
        deleted.push(url);
      }
    },
  };
  const filename = path.resolve(__dirname, `../controllers/${stem}Controller.js`);
  const realRequire = createRequire(filename);
  const mod = { exports: {} };
  const localRequire = (name) => {
    if (name === `../models/${modelFile}`) return Model;
    if (name === "../services/storageChanges") return { StorageChanges: class extends StorageChanges { constructor() { super(storage); } }, respondStorageError };
    if (name === "dotenv") return { config() {} };
    if (name === "./incomeController") return { createIncomeFromOrder: async () => { events.push("income"); } };
    if (stem === "order" && name === "../models/user") return { findById: async () => ({ _id: id, first_name: "Test", last_name: "User", phone: "000", address: "test", save: async () => {} }) };
    if (stem === "order" && name === "../models/product") return { findById: async () => ({ _id: id, sessions: 2, duration: 30, price: 100 }) };
    if (stem === "order" && name === "../models/receipt") return class { static async countDocuments() { return 0; } async save() { events.push("receipt"); throw new Error("test receipt failure after order commit"); } };
    if (name === "qrcode") return { toDataURL: async () => "data:image/png;base64,AA==" };
    return realRequire(name);
  };
  const context = { exports: mod.exports, module: mod, require: localRequire, console: { log() {}, error() {}, warn() {} }, Buffer, process: { env: {} } };
  vm.runInNewContext(fs.readFileSync(filename, "utf8"), context, { filename });
  const req = { body: { ...body }, params: { id }, ...(stem === "goods" ? { files: [file, file] } : { file }) };
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; } };
  return { controller: mod.exports, req, res, events, uploaded, deleted, stored: () => persisted, prefix, entity };
}

for (const spec of specs) {
  const [stem, entity] = spec;
  const create = `create${entity}`, update = `update${entity}`, remove = `${["product", "goods"].includes(stem) ? "permanentDelete" : "delete"}${entity}`;

  test(`${entity}: create saves B2 URLs`, async () => {
    const f = fixture(spec);
    await f.controller[create](f.req, f.res);
    assert.equal(f.res.statusCode, 201, JSON.stringify(f.res.body));
    assert.ok(f.uploaded.every(x => x.key.startsWith(`${f.prefix}/`)));
    assert.equal(f.deleted.length, 0);
    assert.deepEqual([f.stored().image].flat(), f.uploaded.map(x => x.url));
    assert.ok(f.events.indexOf("upload") < f.events.indexOf("save"));
  });

  test(`${entity}: replacing image saves before deleting old file`, async () => {
    const f = fixture(spec);
    await f.controller[update](f.req, f.res);
    assert.equal(f.res.statusCode, 200, JSON.stringify(f.res.body));
    assert.deepEqual(f.deleted, [oldUrl]);
    assert.ok(f.events.indexOf("save") < f.events.indexOf(`delete-file:${oldUrl}`));
    assert.deepEqual([f.stored().image].flat(), f.uploaded.map(x => x.url));
  });

  test(`${entity}: metadata-only update retains image without storage calls`, async () => {
    const f = fixture(spec);
    delete f.req.file; delete f.req.files;
    await f.controller[update](f.req, f.res);
    assert.equal(f.res.statusCode, 200, JSON.stringify(f.res.body));
    assert.equal(f.uploaded.length, 0);
    assert.equal(f.deleted.length, 0);
    assert.deepEqual([f.stored().image].flat(), [oldUrl]);
  });

  for (const operation of [create, update]) {
    test(`${entity}: ${operation} storage failure does not save or delete`, async () => {
      const f = fixture(spec, { uploadFails: true });
      await f.controller[operation](f.req, f.res);
      assert.equal(f.res.statusCode, 503);
      assert.equal(f.res.body.code, "STORAGE_UNAVAILABLE");
      assert.ok(!f.events.includes("save"));
      assert.equal(f.deleted.length, 0);
      assert.deepEqual([f.stored().image].flat(), [oldUrl]);
    });

    test(`${entity}: ${operation} DB failure cleans new images only`, async () => {
      const f = fixture(spec, { saveFails: true });
      await f.controller[operation](f.req, f.res);
      assert.equal(f.res.statusCode, 500);
      assert.ok(f.uploaded.length > 0);
      assert.deepEqual(f.deleted, f.uploaded.map(x => x.url));
      assert.deepEqual([f.stored().image].flat(), [oldUrl]);
    });
  }

  test(`${entity}: hard deletion saves DB deletion before file cleanup`, async () => {
    const f = fixture(spec);
    await f.controller[remove](f.req, f.res);
    assert.equal(f.res.statusCode, 200);
    assert.equal(f.stored(), null);
    assert.deepEqual(f.deleted, [oldUrl]);
    assert.ok(f.events.indexOf("delete-record") < f.events.indexOf(`delete-file:${oldUrl}`));
  });

  test(`${entity}: failed DB deletion preserves image`, async () => {
    const f = fixture(spec, { saveFails: true });
    await f.controller[remove](f.req, f.res);
    assert.equal(f.res.statusCode, 500);
    assert.equal(f.deleted.length, 0);
  });

  test(`${entity}: missing record returns 404 without uploading`, async () => {
    const f = fixture(spec, { missing: true });
    await f.controller[update](f.req, f.res);
    assert.equal(f.res.statusCode, 404);
    assert.equal(f.uploaded.length, 0);
  });
}

test("Goods: partial failure cleans new files while retaining old array", async () => {
  const f = fixture(specs[4], { partialFailure: true });
  await f.controller.updateGoods(f.req, f.res);
  assert.equal(f.res.statusCode, 503);
  assert.deepEqual(f.deleted, f.uploaded.map(x => x.url));
  assert.deepEqual([f.stored().image].flat(), [oldUrl]);
});

for (const index of [2, 3, 4, 5, 6]) {
  test(`${specs[index][1]}: invalid create fails before uploading`, async () => {
    const f = fixture(specs[index]);
    f.req.body = {};
    await f.controller[`create${f.entity}`](f.req, f.res);
    assert.ok(f.res.statusCode >= 400);
    assert.equal(f.uploaded.length, 0);
  });
}

for (const index of [3, 4]) {
  test(`${specs[index][1]}: soft delete retains files`, async () => {
    const f = fixture(specs[index]);
    await f.controller[`delete${f.entity}`](f.req, f.res);
    assert.equal(f.res.statusCode, 200);
    assert.equal(f.stored().isDeleted, true);
    assert.equal(f.deleted.length, 0);
  });
}

test("Goods: concurrent disappearance rolls back uploaded images", async () => {
  const f = fixture(specs[4], { disappears: true });
  await f.controller.updateGoods(f.req, f.res);
  assert.equal(f.res.statusCode, 404);
  assert.deepEqual(f.deleted, f.uploaded.map(x => x.url));
});

test("Goods: removing promotion with replacement images retains valid update shape", async () => {
  const f = fixture(specs[4]);
  f.req.body.removePromotion = "true";
  f.req.body.promotion = "null";
  await f.controller.updateGoods(f.req, f.res);
  assert.equal(f.res.statusCode, 200);
  assert.equal(f.stored().promotion, undefined);
});
