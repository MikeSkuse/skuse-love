import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';

const bundled = await build({ entryPoints: ['src/worker/index.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const app = (await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`)).default;

test('shared IP accepts concurrent photo selections, counts failures and resets', async () => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('CREATE TABLE rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)');
  const DB = { prepare(sql) { return { bind(...args) { return { async first() { return sqlite.prepare(sql).get(...args); } }; } }; } };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => String(url).endsWith('/api/config')
    ? Response.json({ uploadKey: 'test', settings: { uploadEnabled: true } })
    : Response.json({ uploads: [{ job: { status: 'visible' } }] });
  const upload = (ip, valid = true) => {
    const form = new FormData();
    form.append('photo', new File([valid ? new Uint8Array([255,216,255,0,0,0,0,0,0,0,0,0]) : 'invalid image'], 'test.jpg', { type: 'image/jpeg' }));
    return app.request('http://localhost/api/photos', { method: 'POST', headers: { 'CF-Connecting-IP': ip }, body: form }, { DB });
  };
  try {
    const shared = await Promise.all(Array.from({ length: 30 }, () => upload('192.0.2.1')));
    assert.deepEqual(shared.map(r => r.status), Array(30).fill(201));
    assert.equal((await upload('192.0.2.1', false)).status, 400);
    assert.equal(sqlite.prepare('SELECT count FROM rate_limits WHERE key = ?').get('upload:192.0.2.1').count, 31);
    assert.equal((await upload('192.0.2.2')).status, 201);
    sqlite.prepare('UPDATE rate_limits SET count = 599 WHERE key = ?').run('upload:192.0.2.1');
    const boundary = await Promise.all([upload('192.0.2.1'), upload('192.0.2.1')]);
    assert.deepEqual(boundary.map(r => r.status).sort(), [201, 429]);
    sqlite.prepare('UPDATE rate_limits SET expires = 0 WHERE key = ?').run('upload:192.0.2.1');
    assert.equal((await upload('192.0.2.1')).status, 201);
  } finally { globalThis.fetch = originalFetch; sqlite.close(); }
});
