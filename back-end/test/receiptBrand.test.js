const test = require("node:test");
const assert = require("node:assert/strict");
const { companyInfo } = require("../config/brand");
const {
  currentCompanyInfo,
  presentReceipt,
  presentReceipts,
} = require("../utils/receiptBrand");

test("current receipt branding uses IKED YOGA contact details", () => {
  assert.deepEqual(currentCompanyInfo(), {
    name: "IKED YOGA",
    address:
      "77 ม.8 ตำบลสำโรงใต้ อำเภอพระประแดง จังหวัดสมุทรปราการ 10130",
    phone: "064-598-1555",
  });
  assert.notStrictEqual(currentCompanyInfo(), companyInfo);
});

test("legacy receipt snapshots are presented with the current brand", () => {
  const legacy = {
    receiptNumber: "R-OLD",
    companyInfo: { name: "I AMP YOQA", address: "old", phone: "old" },
  };

  assert.deepEqual(presentReceipt(legacy), {
    receiptNumber: "R-OLD",
    companyInfo: currentCompanyInfo(),
  });
  assert.equal(legacy.companyInfo.name, "I AMP YOQA");
});

test("receipt presentation accepts Mongoose-style documents and arrays", () => {
  const document = {
    toObject: () => ({ receiptNumber: "R-DOC", companyInfo: { name: "old" } }),
  };

  assert.deepEqual(presentReceipts([document]), [
    { receiptNumber: "R-DOC", companyInfo: currentCompanyInfo() },
  ]);
});
