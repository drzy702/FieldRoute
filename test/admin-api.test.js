const { test, before, beforeEach, after, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('node:fs');
const { JSDOM } = require('../app_admin/node_modules/jsdom');
const Page = require('../app_api/models/page');
const User = require('../app_api/models/user');
const Booking = require('../app_api/models/booking');
const defaults = require('../data/site-pages.json');

process.env.JWT_SECRET = 'admin-tests-only';
const app = express();
app.use(express.json());
app.use('/api', require('../app_api/routes'));
let server;
let baseUrl;
const adminId = '000000000000000000000001';
const customerId = '000000000000000000000002';
const token = role => jwt.sign({ _id: role === 'admin' ? adminId : customerId, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
let accounts;
let bookedUsers;
const request = (path, options = {}, role) => fetch(baseUrl + path, {
  ...options,
  headers: { 'Content-Type': 'application/json', ...(role ? { Authorization: `Bearer ${token(role)}` } : {}), ...options.headers },
});

before(async () => {
  server = await new Promise(resolve => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => new Promise(resolve => server.close(resolve)));
beforeEach(() => {
  accounts = new Map([
    [adminId, new User({ _id: adminId, name: 'Admin', email: 'admin@example.com', role: 'admin' })],
    [customerId, new User({ _id: customerId, name: 'Customer', email: 'customer@example.com', role: 'customer' })],
  ]);
  bookedUsers = new Set();
  mock.method(User, 'findById', id => {
    const user = accounts.get(String(id)) || null;
    return {
      select: () => ({ lean: async () => user ? { _id: user._id, name: user.name, email: user.email, role: user.role } : null }),
      then: (resolve, reject) => Promise.resolve(user).then(resolve, reject),
    };
  });
  mock.method(User, 'exists', async query => [...accounts.values()].find(user =>
    new RegExp(query.email.$regex, query.email.$options).test(user.email) && String(user._id) !== String(query._id?.$ne)
  ) || null);
  mock.method(User, 'countDocuments', async query => [...accounts.values()].filter(user => user.role === query.role).length);
  mock.method(User.prototype, 'save', async function () { accounts.set(String(this._id), this); return this; });
  mock.method(User, 'deleteOne', async query => ({ deletedCount: accounts.delete(String(query._id)) ? 1 : 0 }));
  mock.method(Booking, 'exists', async query => bookedUsers.has(String(query.user)) ? { _id: 'booking' } : null);
});
afterEach(() => mock.restoreAll());

test('admin endpoints and trip changes reject missing, invalid, expired, and customer credentials', async () => {
  const endpoints = [
    ['/admin/summary', 'GET'], ['/admin/users', 'GET'], ['/admin/images', 'GET'],
    ['/admin/users', 'POST'], [`/admin/users/${customerId}`, 'GET'],
    [`/admin/users/${customerId}`, 'PUT'], [`/admin/users/${customerId}`, 'DELETE'],
    ['/pages/rooms', 'PUT'], ['/trips', 'POST'], ['/trips/TEST', 'PUT'], ['/trips/TEST', 'DELETE'],
  ];
  for (const [path, method] of endpoints) {
    assert.equal((await request(path, { method })).status, 401, `${method} ${path} signed out`);
    assert.equal((await request(path, { method }, 'customer')).status, 403, `${method} ${path} customer`);
  }
  for (const badToken of ['invalid', jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: -1 })]) {
    assert.equal((await request('/admin/users', { headers: { Authorization: `Bearer ${badToken}` } })).status, 401);
  }
  // A rejected JWT must not continue into the protected handler.
  assert.equal((await request('/admin/images', {}, 'admin')).status, 200);
});

test('user CRUD hashes the initial password and exposes only account profile fields', async () => {
  const input = { name: ' New User ', email: 'NEW@example.com', role: 'customer', password: 'temporary-password' };
  let response = await request('/admin/users', { method: 'POST', body: JSON.stringify(input) }, 'admin');
  assert.equal(response.status, 201);
  const created = await response.json();
  assert.deepEqual(Object.keys(created).sort(), ['_id', 'email', 'name', 'role']);
  assert.equal(created.name, 'New User');
  assert.equal(created.email, 'new@example.com');
  assert.equal(accounts.get(created._id).validPassword(input.password), true);
  assert.notEqual(accounts.get(created._id).hash, input.password);
  response = await request(`/admin/users/${created._id}`, {}, 'admin');
  assert.deepEqual(await response.json(), created);
  response = await request(`/admin/users/${created._id}`, { method: 'PUT', body: JSON.stringify({ name: 'Updated', email: 'updated@example.com', role: 'admin' }) }, 'admin');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).role, 'admin');
  assert.equal(accounts.get(created._id).validPassword(input.password), true);
  response = await request(`/admin/users/${created._id}`, { method: 'DELETE' }, 'admin');
  assert.equal(response.status, 204);
  assert.equal((await request(`/admin/users/${created._id}`, {}, 'admin')).status, 404);
});

test('browser preflight requests can discover user CRUD methods without credentials', async () => {
  const collection = await request('/admin/users', { method: 'OPTIONS' });
  const user = await request(`/admin/users/${customerId}`, { method: 'OPTIONS' });
  assert.equal(collection.status, 200);
  assert.match(collection.headers.get('allow'), /POST/);
  assert.equal(user.status, 200);
  assert.match(user.headers.get('allow'), /PUT/);
  assert.match(user.headers.get('allow'), /DELETE/);
});

test('user writes reject invalid fields, duplicate emails, bad IDs, and missing accounts', async () => {
  const input = { name: 'New User', email: 'new@example.com', role: 'customer', password: 'temporary-password' };
  for (const invalid of [{ ...input, name: ' ' }, { ...input, email: 'invalid' }, { ...input, role: 'owner' }, { ...input, password: 'short' }, { ...input, hash: 'injected' }]) {
    assert.equal((await request('/admin/users', { method: 'POST', body: JSON.stringify(invalid) }, 'admin')).status, 400);
  }
  assert.equal((await request('/admin/users', { method: 'POST', body: JSON.stringify({ ...input, email: 'CUSTOMER@example.com' }) }, 'admin')).status, 409);
  const updated = { name: 'Customer', email: 'ADMIN@example.com', role: 'customer' };
  assert.equal((await request(`/admin/users/${customerId}`, { method: 'PUT', body: JSON.stringify(updated) }, 'admin')).status, 409);
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const options = { method, ...(method === 'PUT' ? { body: JSON.stringify({ ...updated, email: 'unused@example.com' }) } : {}) };
    assert.equal((await request('/admin/users/bad-id', options, 'admin')).status, 400);
    assert.equal((await request('/admin/users/000000000000000000000099', options, 'admin')).status, 404);
  }
});

test('the last admin, your own account, and users with bookings are protected', async () => {
  assert.equal((await request(`/admin/users/${adminId}`, { method: 'DELETE' }, 'admin')).status, 409);
  const demotion = { name: 'Admin', email: 'admin@example.com', role: 'customer' };
  assert.equal((await request(`/admin/users/${adminId}`, { method: 'PUT', body: JSON.stringify(demotion) }, 'admin')).status, 409);
  accounts.set('000000000000000000000003', new User({ _id: '000000000000000000000003', name: 'Other admin', email: 'other@example.com', role: 'admin' }));
  assert.equal((await request(`/admin/users/${adminId}`, { method: 'DELETE' }, 'admin')).status, 409);
  assert.equal((await request(`/admin/users/${adminId}`, { method: 'PUT', body: JSON.stringify(demotion) }, 'admin')).status, 409);
  bookedUsers.add(customerId);
  assert.equal((await request(`/admin/users/${customerId}`, { method: 'DELETE' }, 'admin')).status, 409);
  assert.equal(accounts.has(customerId), true);
});

test('old signed tokens lose admin access after demotion and all protected access after deletion', async () => {
  const oldToken = token('admin');
  accounts.get(adminId).role = 'customer';
  assert.equal((await request('/admin/images', { headers: { Authorization: `Bearer ${oldToken}` } })).status, 403);
  accounts.delete(adminId);
  assert.equal((await request('/admin/images', { headers: { Authorization: `Bearer ${oldToken}` } })).status, 401);
  assert.equal((await request('/bookings', { method: 'POST', body: JSON.stringify({ tripCode: 'TEST' }), headers: { Authorization: `Bearer ${oldToken}` } })).status, 401);
});

test('concurrent admins cannot demote each other and leave no remaining admin', async () => {
  const otherId = '000000000000000000000003';
  accounts.set(otherId, new User({ _id: otherId, name: 'Other', email: 'other@example.com', role: 'admin' }));
  const otherToken = jwt.sign({ _id: otherId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const responses = await Promise.all([
    request(`/admin/users/${otherId}`, { method: 'PUT', body: JSON.stringify({ name: 'Other', email: 'other@example.com', role: 'customer' }) }, 'admin'),
    request(`/admin/users/${adminId}`, { method: 'PUT', headers: { Authorization: `Bearer ${otherToken}` }, body: JSON.stringify({ name: 'Admin', email: 'admin@example.com', role: 'customer' }) }),
  ]);
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 403]);
  assert.equal([...accounts.values()].filter(user => user.role === 'admin').length, 1);
});

test('user listing requests only public account fields', async () => {
  let projection;
  mock.method(User, 'find', () => ({ select(fields) {
    projection = fields;
    return { sort: () => ({ lean: async () => [{ _id: 'test', name: 'Test', email: 'test@example.com', role: 'customer' }] }) };
  } }));
  const response = await request('/admin/users', {}, 'admin');
  assert.equal(response.status, 200);
  assert.equal(projection, 'name email role');
  assert.deepEqual(Object.keys((await response.json())[0]).sort(), ['_id', 'email', 'name', 'role']);
});

test('all page defaults address the existing customer content', () => {
  for (const [slug, page] of Object.entries(defaults)) {
    const document = new JSDOM(fs.readFileSync(`public/${slug}.html`, 'utf8')).window.document;
    for (const field of page.fields) {
      assert.equal(document.querySelectorAll(field.selector).length, 1, `${slug}: ${field.label}`);
      if (field.type === 'image') assert.ok(fs.existsSync(`public/images/${field.value}`));
    }
  }
});

test('public page reads combine original fields with saved values', async () => {
  mock.method(Page, 'findOne', () => ({ lean: async () => ({ values: { 'field-1': 'Updated rooms' }, updatedAt: new Date('2026-01-01') }) }));
  const response = await request('/pages/rooms');
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.fields[0].value, 'Updated rooms');
  assert.equal(result.fields[1].value, defaults.rooms.fields[1].value);
  assert.equal(result.fields.length, defaults.rooms.fields.length);
  assert.equal((await request('/pages/not-a-page')).status, 404);
});

test('page saves validate every field and reject unknown fields and missing images', async () => {
  const values = Object.fromEntries(defaults.rooms.fields.map(field => [field.key, field.value]));
  for (const invalid of [null, {}, [], { ...values, unknown: 'value' }, { ...values, 'field-1': '' }, { ...values, 'field-2': '../secret.jpg' }, { ...values, 'field-2': 'missing.jpg' }]) {
    assert.equal((await request('/pages/rooms', { method: 'PUT', body: JSON.stringify({ values: invalid }) }, 'admin')).status, 400);
  }
  let saved;
  mock.method(Page, 'findOneAndUpdate', (filter, update, options) => {
    saved = { filter, update, options };
    return { lean: async () => ({ values: update.$set.values }) };
  });
  const response = await request('/pages/rooms', { method: 'PUT', body: JSON.stringify({ values }) }, 'admin');
  assert.equal(response.status, 200);
  assert.equal(saved.filter.slug, 'rooms');
  assert.deepEqual(saved.update.$set.values, values);
  assert.equal(saved.options.runValidators, true);
});
