const { test, before, after, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('node:fs');
const { JSDOM } = require('../app_admin/node_modules/jsdom');
const Page = require('../app_api/models/page');
const User = require('../app_api/models/user');
const defaults = require('../data/site-pages.json');

process.env.JWT_SECRET = 'admin-tests-only';
const app = express();
app.use(express.json());
app.use('/api', require('../app_api/routes'));
let server;
let baseUrl;
const token = role => jwt.sign({ _id: '000000000000000000000001', role }, process.env.JWT_SECRET, { expiresIn: '1h' });
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
afterEach(() => mock.restoreAll());

test('admin endpoints and trip changes reject missing, invalid, expired, and customer credentials', async () => {
  const endpoints = [
    ['/admin/summary', 'GET'], ['/admin/users', 'GET'], ['/admin/images', 'GET'],
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
