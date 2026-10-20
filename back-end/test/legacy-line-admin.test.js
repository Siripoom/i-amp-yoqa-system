const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLegacyLineAdminHandlers } = require('../controllers/legacyLineAdminController');
const id = '507f1f77bcf86cd799439011';
const actor = '507f1f77bcf86cd799439012';
const line = `U${'a'.repeat(32)}`;
function setup(overrides = {}, options = {}) {
  const member = { _id: id, username: line, role_id: 'Member', email: 'member@example.com', password: 'hash', remaining_session: 12, ...overrides };
  const reviews = [];
  let updates = 0;
  const model = {
    findById: () => ({ select: async () => options.missing ? null : member }),
    exists: async () => options.conflict || false,
    findOneAndUpdate: (filter, update) => ({ select: async () => {
      assert.equal(filter.username, line);
      assert.equal(filter.role_id, 'Member');
      assert.deepEqual(filter.deleted, { $ne: true });
      assert.deepEqual(filter.line_user_id, { $in: [null, ''] });
      if (options.stale) return null;
      assert.deepEqual(Object.keys(update.$set), ['line_user_id']);
      Object.assign(member, update.$set);
      reviews.push(update.$push.line_identity_reviews);
      updates++;
      return member;
    } }),
  };
  const handlers = createLegacyLineAdminHandlers(model);
  async function approve(body = {}, role = 'Admin') {
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; } };
    await handlers.approve({ params: { memberId: id }, user: { role, userId: actor }, body: { expectedLineUserId: line, confirmed: true, note: 'Confirmed member code and phone in person', ...body } }, res);
    return res;
  }
  return { approve, member, reviews, updates: () => updates };
}

test('manual review links an email/password legacy member without changing membership; retry is idempotent', async () => {
  const ctx = setup();
  const response = await ctx.approve();
  assert.equal(response.statusCode, 200);
  assert.equal(ctx.member.line_user_id, line);
  assert.equal(ctx.member.email, 'member@example.com');
  assert.equal(ctx.member.password, 'hash');
  assert.equal(ctx.member.remaining_session, 12);
  assert.equal(ctx.reviews[0].actor_id, actor);
  assert.ok(ctx.reviews[0].reviewed_at instanceof Date);
  assert.match(ctx.reviews[0].note, /Confirmed/);
  const retry = await ctx.approve();
  assert.equal(retry.body.alreadyLinked, true);
  assert.equal(ctx.updates(), 1);
});
for (const role of ['Member', 'Instructor', 'Accounting', undefined]) {
  test(`review rejects unauthorized role ${role}`, async () => {
    const ctx = setup();
    const response = await ctx.approve({}, role === undefined ? null : role);
    assert.equal(response.statusCode, 403);
    assert.equal(ctx.updates(), 0);
  });
}
test('SuperAdmin can approve', async () => assert.equal((await setup().approve({}, 'SuperAdmin')).statusCode, 200));
for (const body of [{ confirmed: false }, { note: 'a' }, { note: 'x'.repeat(501) }, { expectedLineUserId: 'arbitrary' }]) {
  test(`requires explicit valid review ${JSON.stringify(body).slice(0,60)}`, async () => {
    const ctx = setup(); assert.equal((await ctx.approve(body)).statusCode, 400); assert.equal(ctx.updates(), 0);
  });
}
for (const [overrides, options, status, code] of [
  [{ deleted: true }, {}, 422, 'LINE_LEGACY_ACCOUNT_NOT_ELIGIBLE'],
  [{ role_id: 'Admin' }, {}, 422, 'LINE_LEGACY_ACCOUNT_NOT_ELIGIBLE'],
  [{ username: 'ordinary' }, {}, 422, 'LINE_LEGACY_ACCOUNT_NOT_ELIGIBLE'],
  [{ username: `U${'b'.repeat(32)}` }, {}, 409, 'LINE_REVIEW_STALE'],
  [{ line_user_id: `U${'b'.repeat(32)}` }, {}, 409, 'LINE_REVIEW_STALE'],
  [{}, { conflict: true }, 409, 'LINE_IDENTITY_CONFLICT'],
  [{}, { missing: true }, 404, 'LINE_LEGACY_ACCOUNT_NOT_FOUND'],
  [{}, { stale: true }, 409, 'LINE_REVIEW_STALE'],
]) test(`rejects ${JSON.stringify(overrides)} ${JSON.stringify(options)}`, async () => {
  const ctx = setup(overrides, options);
  const res = await ctx.approve();
  assert.equal(res.statusCode, status); assert.equal(res.body.code, code); assert.equal(ctx.updates(), 0);
});

test('directory limits data and paging, escapes search, and enforces roles', async () => {
  let calls = 0;
  const chain = {
    select(fields) { assert.ok(!fields.includes('password')); assert.ok(!fields.includes('resetPassword')); return this; },
    sort() { return this; }, skip(n) { assert.equal(n, 20); return this; }, limit(n) { assert.equal(n, 20); return this; },
    lean: async () => [],
  };
  const handlers = createLegacyLineAdminHandlers({
    find(query) { calls++; assert.equal(query.deleted.$ne, true); assert.equal(query.role_id, 'Member'); assert.ok(query.$or[0].first_name.test('a.*')); assert.ok(!query.$or[0].first_name.test('abc')); return chain; },
    countDocuments: async () => 22,
  });
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
  await handlers.list({ user: { role: 'Accounting' }, query: {} }, res);
  assert.equal(res.statusCode, 403); assert.equal(calls, 0);
  res.statusCode = 200;
  await handlers.list({ user: { role: 'Admin' }, query: { search: 'a.*', page: '2' } }, res);
  assert.equal(res.statusCode, 200); assert.equal(res.body.total, 22); assert.equal(res.body.pageSize, 20);
  await handlers.list({ user: { role: 'Admin' }, query: { page: '-1' } }, res);
  assert.equal(res.statusCode, 400);
});

test('registered admin LINE routes enforce authentication and role checks', async (t) => {
  const express = require('express');
  const { Readable } = require('node:stream');
  const jwt = require('jsonwebtoken');
  const { createAuthRouter } = require('../routes/authRoutes');
  t.mock.method(console, 'log', () => {});
  t.mock.method(jwt, 'verify', token => ({ userId: actor, role: token }));
  const app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRouter());
  function request(method, url, role) {
    return new Promise((resolve, reject) => {
      const req = Readable.from([]);
      req.method = method; req.url = url;
      req.headers = role ? { authorization: `Bearer ${role}` } : {};
      const headers = {};
      const res = {
        statusCode: 200,
        setHeader(key, value) { headers[key.toLowerCase()] = value; },
        getHeader(key) { return headers[key.toLowerCase()]; },
        removeHeader(key) { delete headers[key.toLowerCase()]; },
        end(body) { resolve({ status: this.statusCode, body: JSON.parse(String(body)) }); },
      };
      app.handle(req, res, reject);
    });
  }
  assert.equal((await request('GET', '/api/auth/line/legacy-members')).status, 401);
  assert.equal((await request('GET', '/api/auth/line/legacy-members', 'Member')).status, 403);
  assert.equal((await request('POST', `/api/auth/line/legacy-members/${id}/approve`, 'Accounting')).status, 403);
  assert.equal((await request('GET', '/api/auth/line/legacy-members?page=-1', 'Admin')).status, 400);
  assert.equal((await request('POST', `/api/auth/line/legacy-members/${id}/approve`, 'SuperAdmin')).status, 400);
});
