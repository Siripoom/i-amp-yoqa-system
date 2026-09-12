const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { Readable } = require("node:stream");

const { createAuthRouter } = require("../routes/authRoutes");
const authController = require("../controllers/authController");
const {
  createLineLoginHandler,
} = require("../controllers/authController");
const {
  createLineIdentityVerifier,
} = require("../services/lineIdentity");

const memberId = "507f1f77bcf86cd799439011";

function createMemberModel(seed = []) {
  const records = seed.map((record) => ({ ...record }));

  return class Member {
    constructor(data) {
      Object.assign(this, data);
      this._id ||= memberId;
      this.isNew = true;
    }

    static async findOne(query) {
      const record = records.find((candidate) =>
        Object.entries(query).every(([key, value]) => {
          if (value && typeof value === "object" && "$exists" in value) {
            return (candidate[key] !== undefined) === value.$exists;
          }
          return candidate[key] === value;
        })
      );
      if (!record) return null;
      const member = new Member(record);
      member.isNew = false;
      return member;
    }

    async save() {
      const duplicate = records.find(
        (record) =>
          record !== this &&
          this.line_user_id &&
          record.line_user_id === this.line_user_id
      );
      if (duplicate) {
        const error = new Error("duplicate line identity");
        error.code = 11000;
        throw error;
      }

      const index = records.findIndex(
        (record) => String(record._id) === String(this._id)
      );
      const stored = { ...this };
      delete stored.isNew;
      if (index >= 0) records[index] = stored;
      else records.push(stored);
      this.isNew = false;
      return this;
    }

    toObject() {
      const object = { ...this };
      delete object.isNew;
      return object;
    }

    static records() {
      return records;
    }
  };
}

async function startAuthApp({ MemberModel, verifyLineIdToken }) {
  const loginLine = createLineLoginHandler({
    MemberModel,
    verifyLineIdToken,
    signApplicationToken: () => "application-jwt",
  });
  const app = express();
  app.use(express.json());
  app.use(
    "/api/auth",
    createAuthRouter({ controller: { ...authController, loginLine } })
  );

  return {
    async postLine(body) {
      return new Promise((resolve, reject) => {
        const json = JSON.stringify(body);
        const req = Readable.from([Buffer.from(json)]);
        req.method = "POST";
        req.url = "/api/auth/line";
        req.headers = {
          "content-type": "application/json",
          "content-length": String(Buffer.byteLength(json)),
        };
        const headers = {};
        const res = {
          statusCode: 200,
          setHeader(name, value) {
            headers[name.toLowerCase()] = value;
          },
          getHeader(name) {
            return headers[name.toLowerCase()];
          },
          removeHeader(name) {
            delete headers[name.toLowerCase()];
          },
          end(payload) {
            resolve({
              status: this.statusCode,
              body: payload ? JSON.parse(String(payload)) : undefined,
            });
          },
        };
        app.handle(req, res, reject);
      });
    },
    close: async () => {},
  };
}

test("verified LINE identity creates a Member without using username as identity", async (t) => {
  const MemberModel = createMemberModel();
  const app = await startAuthApp({
    MemberModel,
    verifyLineIdToken: async (token) => {
      assert.equal(token, "valid-id-token");
      return { subject: "U-provider-scoped", displayName: "สมาชิก ทดสอบ" };
    },
  });
  t.after(app.close);

  const response = await app.postLine({ idToken: "valid-id-token" });

  assert.equal(response.status, 200);
  assert.equal(response.body.token, "application-jwt");
  assert.equal(response.body.data.line_user_id, "U-provider-scoped");
  assert.equal(response.body.data.username, undefined);
  assert.equal(MemberModel.records().length, 1);
});

test("legacy LINE-first Member is migrated by verified subject without merging others", async (t) => {
  const MemberModel = createMemberModel([
    {
      _id: memberId,
      username: "U-legacy",
      first_name: "ชื่อเดิม",
      role_id: "Member",
    },
  ]);
  const app = await startAuthApp({
    MemberModel,
    verifyLineIdToken: async () => ({
      subject: "U-legacy",
      displayName: "ชื่อใหม่จาก LINE",
    }),
  });
  t.after(app.close);

  const response = await app.postLine({ idToken: "valid-id-token" });

  assert.equal(response.status, 200);
  assert.equal(MemberModel.records().length, 1);
  assert.equal(MemberModel.records()[0].line_user_id, "U-legacy");
  assert.equal(MemberModel.records()[0].first_name, "ชื่อเดิม");
});

test("unverified browser profile cannot create a Member", async (t) => {
  const MemberModel = createMemberModel();
  let verificationCalls = 0;
  const app = await startAuthApp({
    MemberModel,
    verifyLineIdToken: async () => {
      verificationCalls += 1;
      throw Object.assign(new Error("Token rejected"), {
        code: "LINE_ID_TOKEN_INVALID",
        status: 401,
      });
    },
  });
  t.after(app.close);

  const profileOnly = await app.postLine({
    userId: "U-attacker-controlled",
    displayName: "Attacker",
  });
  const invalidToken = await app.postLine({ idToken: "invalid" });

  assert.equal(profileOnly.status, 400);
  assert.equal(profileOnly.body.code, "LINE_ID_TOKEN_REQUIRED");
  assert.equal(invalidToken.status, 401);
  assert.equal(invalidToken.body.code, "LINE_ID_TOKEN_INVALID");
  assert.equal(verificationCalls, 1);
  assert.equal(MemberModel.records().length, 0);
});

test("LINE verifier rejects a response for another channel", async () => {
  const verifier = createLineIdentityVerifier({
    channelId: "expected-channel",
    fetchImpl: async () => ({
      ok: true,
      async json() {
        return {
          sub: "U-provider-scoped",
          aud: "another-channel",
          exp: Math.floor(Date.now() / 1000) + 300,
          name: "Member",
        };
      },
    }),
  });

  await assert.rejects(
    () => verifier("wrong-audience-token"),
    (error) =>
      error.code === "LINE_ID_TOKEN_INVALID" && error.status === 401
  );
});
