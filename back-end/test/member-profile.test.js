const { test } = require("node:test");
const assert = require("node:assert/strict");
const Class = require("../models/class");
const User = require("../models/user");
const {
  getMissingMemberProfileFields,
  isGenderAllowed,
  normalizeMedicalProfile,
} = require("../utils/memberProfile");
const {
  PACKAGE_ACTIVATION_DAYS,
  getActivationExpiry,
  activatePackageOnFirstUse,
} = require("../utils/packageExpiry");

test("member profile requires gender, address and medical status", () => {
  assert.deepEqual(
    getMissingMemberProfileFields({ role_id: "Member" }),
    ["gender", "address", "has_medical_condition"]
  );
  assert.deepEqual(
    getMissingMemberProfileFields({
      role_id: "Member",
      gender: "female",
      address: "Bangkok",
      has_medical_condition: true,
    }),
    ["medical_condition_details"]
  );
  assert.deepEqual(
    getMissingMemberProfileFields({ role_id: "Instructor" }),
    []
  );
});

test("medical details are cleared when member selects no condition", () => {
  assert.deepEqual(
    normalizeMedicalProfile({
      address: "  Bangkok  ",
      has_medical_condition: false,
      medical_condition_details: "old value",
    }),
    {
      address: "Bangkok",
      has_medical_condition: false,
      medical_condition_details: null,
    }
  );
});

test("gender eligibility supports all and exact gender matches", () => {
  assert.equal(isGenderAllowed("male", "all"), true);
  assert.equal(isGenderAllowed("female", "female"), true);
  assert.equal(isGenderAllowed("male", "female"), false);
  assert.equal(isGenderAllowed(undefined, "female"), false);
});

test("class defaults to all genders and validates supported values", async () => {
  const validClass = new Class({
    title: "Yoga",
    start_time: new Date(),
    end_time: new Date(Date.now() + 60_000),
  });
  await validClass.validate();
  assert.equal(validClass.allowed_gender, "all");

  const invalidClass = new Class({
    title: "Yoga",
    start_time: new Date(),
    end_time: new Date(Date.now() + 60_000),
    allowed_gender: "unknown",
  });
  await assert.rejects(() => invalidClass.validate());
});

test("user gender schema accepts male/female only", async () => {
  await new User({ gender: "male" }).validate();
  await assert.rejects(() => new User({ gender: "unknown" }).validate());
});

test("package approval window is 30 days", () => {
  const approvedAt = new Date("2026-01-01T00:00:00.000Z");
  assert.equal(PACKAGE_ACTIVATION_DAYS, 30);
  assert.equal(
    getActivationExpiry(approvedAt).toISOString(),
    "2026-01-31T00:00:00.000Z"
  );
});

test("first use changes expiry to product duration only once", () => {
  const user = {
    first_used_date: null,
    product_duration: 14,
    sessions_expiry_date: new Date("2026-01-31T00:00:00.000Z"),
  };
  const firstUse = new Date("2026-01-10T00:00:00.000Z");
  assert.equal(activatePackageOnFirstUse(user, firstUse), true);
  assert.equal(user.first_used_date, firstUse);
  assert.equal(
    user.sessions_expiry_date.toISOString(),
    "2026-01-24T00:00:00.000Z"
  );

  assert.equal(
    activatePackageOnFirstUse(user, new Date("2026-01-11T00:00:00.000Z")),
    false
  );
  assert.equal(
    user.sessions_expiry_date.toISOString(),
    "2026-01-24T00:00:00.000Z"
  );
});
