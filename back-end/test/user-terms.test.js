const { test } = require("node:test");
const assert = require("node:assert/strict");
const UserTerms = require("../models/userTerms");

test("current /term UI payload validates without optional other-contact fields", () => {
  const terms = new UserTerms({
    userId: "507f1f77bcf86cd799439011",
    fullName: "Test Member",
    privacyConsents: {
      registration: true,
      monitoring: true,
      planning: true,
      communication: true,
      publicity: false,
    },
    termsAccepted: true,
    acceptedAt: new Date(),
  });

  assert.equal(terms.validateSync(), undefined);
  assert.equal(String(terms.userId), "507f1f77bcf86cd799439011");
});
