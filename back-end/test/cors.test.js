const { test } = require("node:test");
const assert = require("node:assert/strict");
const { app } = require("../server");

const preflight = (origin) =>
  new Promise((resolve, reject) => {
    const headers = {};
    const req = {
      method: "OPTIONS",
      url: "/api/auth/login",
      headers: {
        origin,
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    };
    const res = {
      statusCode: 200,
      setHeader(name, value) { headers[name.toLowerCase()] = value; },
      getHeader(name) { return headers[name.toLowerCase()]; },
      removeHeader(name) { delete headers[name.toLowerCase()]; },
      end() { resolve({ statusCode: this.statusCode, headers }); },
    };
    app.handle(req, res, reject);
  });

test("production frontend receives CORS headers on login preflight", async () => {
  const response = await preflight("https://i-ked-yoqa-system.vercel.app");
  assert.equal(response.statusCode, 204);
  assert.equal(
    response.headers["access-control-allow-origin"],
    "https://i-ked-yoqa-system.vercel.app"
  );
  assert.match(response.headers["access-control-allow-methods"], /POST/);
  assert.match(response.headers["access-control-allow-headers"], /Content-Type/i);
});
