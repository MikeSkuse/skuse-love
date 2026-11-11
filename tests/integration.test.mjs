import { test } from 'node:test';
import assert from 'node:assert/strict';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8787';
const token = process.env.TEST_ADMIN_TOKEN || 'local-test-admin-token';
const admin = { Authorization: `Bearer ${token}` };
const json = { 'Content-Type': 'application/json' };
const request = (path, options) => fetch(`${base}${path}`, options);

test('seating lookup and moderated photo lifecycle', async () => {
  let response = await request('/api/admin/photos');
  assert.equal(response.status, 401, 'admin routes reject anonymous requests');
  response = await request('/api/admin/photos', { headers: { Authorization: 'Bearer wrong' } });
  assert.equal(response.status, 401, 'admin routes reject incorrect tokens');

  response = await request('/api/seating', { method: 'POST', headers: json, body: JSON.stringify({ name: '  mike skuse  ' }) });
  assert.deepEqual(await response.json(), { table_number: 'TopTable' });
  response = await request('/api/seating', { method: 'POST', headers: json, body: JSON.stringify({ name: 'Darlene Gibson' }) });
  assert.deepEqual(await response.json(), { table_number: '1' });
  response = await request('/api/seating', { method: 'POST', headers: json, body: JSON.stringify({ name: 'Unknown Guest' }) });
  assert.equal(response.status, 404);
  response = await request('/api/seating', { method: 'POST', headers: json, body: JSON.stringify({ name: ' ' }) });
  assert.equal(response.status, 400);

  const bad = new FormData(); bad.append('photo', new Blob(['not an image'], { type: 'image/png' }), 'fake.png');
  response = await request('/api/photos', { method: 'POST', body: bad });
  assert.equal(response.status, 400, 'invalid image bytes are rejected');
  const photo = new FormData();
  photo.append('photo', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aWQAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'test.png');
  response = await request('/api/photos', { method: 'POST', body: photo });
  assert.equal(response.status, 201);
  response = await request('/api/admin/photos', { headers: admin });
  const pending = await response.json();
  assert.ok(pending.length > 0);
  const photoId = pending[0].id;
  response = await request(`/api/photos/${photoId}`);
  assert.equal(response.status, 404, 'pending images are private');
  response = await request(`/api/admin/photos/${photoId}`, { method: 'POST', headers: { ...admin, ...json }, body: JSON.stringify({ status: 'approved' }) });
  assert.equal(response.status, 200);
  response = await request(`/api/photos/${photoId}`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  response = await request('/api/photos');
  assert.ok((await response.json()).some(p => p.id === photoId));
});
