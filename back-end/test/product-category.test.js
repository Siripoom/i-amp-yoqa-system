const { test } = require("node:test");
const assert = require("node:assert/strict");
const Product = require("../models/product");

const productData = { sessions: 1, price: 1000, duration: 30 };

test("products accept the two promotion categories", async () => {
  for (const category of ["private_yoga", "extend_your_days"]) {
    const product = new Product({ ...productData, category });
    await product.validate();
    assert.equal(product.toObject().category, category);
  }
});

test("legacy products without a category remain valid", async () => {
  const product = new Product(productData);
  await product.validate();
  assert.equal(product.category, null);
});

test("unknown promotion categories are rejected", async () => {
  const product = new Product({ ...productData, category: "unknown" });
  await assert.rejects(product.validate(), /category/);
});
