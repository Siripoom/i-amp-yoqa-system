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
  const reservations = [];
  class Reservation {
    constructor(data) { Object.assign(this, { _id: `reservation-${reservations.length}`, status: "Reserved" }, data); reservations.push(this); }
    async save() { events.push("reservation-save"); }
    static async findOne() { return null; }
    static findById(id) {
      const reservation = reservations.find((entry) => entry._id === id);
      const query = {
        populate() { return query; },
        then(resolve, reject) {
          if (reservation) {
            reservation.user_id = user;
            reservation.class_id = yogaClass;
          }
          return Promise.resolve(reservation).then(resolve, reject);
        },
      };
      return query;
    }
    static find(filter) {
      assert.equal(filter.status, "Reserved");
      assert.equal(filter.class_id, classId);
      return {
        session() { return this; },
        async populate() {
          return reservations.filter((entry) => entry.status === "Reserved" && entry._id !== filter._id.$ne)
            .map((entry) => ({ ...entry, user_id: typeof entry.user_id === "object" ? entry.user_id : user }));
        },
      };
    }
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
  return { controller: mod.exports, req, res, events, user, yogaClass, reservations };
}

test("incomplete member profile is rejected before booking mutations", async () => {
  const f = fixture({ userOverrides: { address: "" } });
  await f.controller.createReservation(f.req, f.res);
  assert.equal(f.res.statusCode, 422);
  assert.equal(f.res.body.code, "PROFILE_INCOMPLETE");
  assert.deepEqual(f.events, []);
  assert.equal(f.user.remaining_session, 2);
});

test("admin can book a member with an incomplete profile for an all-gender class", async () => {
  const f = fixture({
    userOverrides: { gender: undefined, address: "", has_medical_condition: undefined },
    classOverrides: { allowed_gender: "all" },
  });
  f.req.user.role = "Admin";
  await f.controller.adminCreateReservation(f.req, f.res);
  assert.equal(f.res.statusCode, 201);
  assert.equal(f.user.remaining_session, 1);
  assert.deepEqual(f.events, ["user-save", "class-save", "reservation-save"]);
});

test("admin cannot book a member without gender for a gender-restricted class", async () => {
  const f = fixture({ userOverrides: { gender: undefined } });
  f.req.user.role = "Admin";
  await f.controller.adminCreateReservation(f.req, f.res);
  assert.equal(f.res.statusCode, 403);
  assert.equal(f.res.body.code, "GENDER_NOT_ALLOWED");
  assert.deepEqual(f.events, []);
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

for (const method of ["cancelReservation", "cancelReservationById"]) {
  test(`${method} removes a booked name after profile changes and preserves namesakes`, async () => {
    const f = fixture({ userOverrides: { nickname: "Old" } });
    await f.controller.createReservation(f.req, f.res);
    assert.equal(f.res.statusCode, 201);
    f.reservations.push({ _id: "other", status: "Reserved", user_id: { first_name: "Member", nickname: "Old" } });
    f.yogaClass.participants.push("Old Member");
    f.yogaClass.amount++;
    f.user.nickname = "New";
    f.req.params = { reservation_id: f.reservations[0]._id };
    f.req.user.role = method === "cancelReservationById" ? "Admin" : "Member";
    await f.controller[method](f.req, f.res);
    assert.equal(f.res.statusCode, 200);
    assert.deepEqual(Array.from(f.yogaClass.participants), ["Old Member"]);
    assert.equal(f.yogaClass.amount, 1);
    assert.equal(f.user.remaining_session, 2);
    assert.equal(f.reservations[0].status, "Cancelled");
    await f.controller[method](f.req, f.res);
    assert.equal(f.res.statusCode, 200);
    assert.equal(f.user.remaining_session, 2);
    assert.equal(f.yogaClass.amount, 1);
  });
}
