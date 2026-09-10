const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");

const userId = "507f1f77bcf86cd799439011";
const classId = "507f1f77bcf86cd799439012";

function fixture({ userOverrides = {}, classOverrides = {} } = {}) {
  const events = [];
  const user = {
    _id: userId,
    role_id: "Member",
    first_name: "Member",
    nickname: "",
    gender: "female",
    address: "Bangkok",
    has_medical_condition: false,
    medical_condition_details: null,
    remaining_session: 2,
    sessions_expiry_date: new Date(Date.now() + 20 * 86_400_000),
    first_used_date: null,
    product_duration: 14,
    async save() { events.push("user-save"); },
    ...userOverrides,
  };
  const yogaClass = {
    _id: classId,
    allowed_gender: "female",
    participants: [],
    amount: 0,
    async save() { events.push("class-save"); },
    ...classOverrides,
  };
  class Reservation {
    constructor(data) { Object.assign(this, data); }
    async save() { events.push("reservation-save"); }
  }

  const filename = path.resolve(
    __dirname,
    "../controllers/reservationController.js"
  );
  const realRequire = createRequire(filename);
  const mod = { exports: {} };
  const localRequire = (name) => {
    if (name === "../models/reservation") return Reservation;
    if (name === "../models/class") return { findById: async () => yogaClass };
    if (name === "../models/user") return { findById: async () => user };
    if (name === "../models/order") return {};
    if (name === "jwt-decode") return {};
    return realRequire(name);
  };
  const context = {
    exports: mod.exports,
    module: mod,
    require: localRequire,
    console: { log() {}, error() {} },
    Date,
  };
  vm.runInNewContext(fs.readFileSync(filename, "utf8"), context, { filename });

  const req = {
    body: { class_id: classId, user_id: userId },
    user: { userId, role: "Member" },
  };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  return { controller: mod.exports, req, res, events, user, yogaClass };
}

test("incomplete member profile is rejected before booking mutations", async () => {
  const f = fixture({ userOverrides: { address: "" } });
  await f.controller.createReservation(f.req, f.res);
  assert.equal(f.res.statusCode, 422);
  assert.equal(f.res.body.code, "PROFILE_INCOMPLETE");
  assert.deepEqual(f.events, []);
  assert.equal(f.user.remaining_session, 2);
});

test("gender mismatch is rejected before booking mutations", async () => {
  const f = fixture({ classOverrides: { allowed_gender: "male" } });
  await f.controller.createReservation(f.req, f.res);
  assert.equal(f.res.statusCode, 403);
  assert.equal(f.res.body.code, "GENDER_NOT_ALLOWED");
  assert.deepEqual(f.events, []);
});

test("eligible first booking consumes a session and starts product duration", async () => {
  const f = fixture();
  await f.controller.createReservation(f.req, f.res);
  assert.equal(f.res.statusCode, 201);
  assert.equal(f.user.remaining_session, 1);
  assert.ok(f.user.first_used_date instanceof Date);
  const duration = Math.round(
    (f.user.sessions_expiry_date - f.user.first_used_date) / 86_400_000
  );
  assert.equal(duration, 14);
  assert.deepEqual(f.events, ["user-save", "class-save", "reservation-save"]);
});
