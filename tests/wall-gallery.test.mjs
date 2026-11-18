import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { latestWallPhotos, wallPhoto } from '../src/worker/wall-gallery.ts';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec('CREATE TABLE media (id TEXT, created_at TEXT, status TEXT, thumb_path TEXT, display_path TEXT)');
const insert = sqlite.prepare('INSERT INTO media VALUES (?, ?, ?, ?, ?)');
for (let i = 1; i <= 7; i++) insert.run(`visible${i}`, `2026-11-${String(i).padStart(2, '0')}`, 'visible', `thumb/${i}`, `display/${i}`);
insert.run('pending', '2026-12-01', 'pending', 'thumb/pending', null);
insert.run('hidden', '2026-12-02', 'hidden', 'thumb/hidden', null);
const db = { prepare(sql) { let args = []; return { bind(...values) { args = values; return this; }, async all() { return { results: sqlite.prepare(sql).all(...args) }; }, async first() { return sqlite.prepare(sql).get(...args) || null; } }; } };
const bucket = { async get(key) { return { key }; } };

test('returns the five newest visible photos', async () => {
  assert.deepEqual((await latestWallPhotos(db)).map(row => row.id), ['visible7', 'visible6', 'visible5', 'visible4', 'visible3']);
});

test('serves a thumbnail only while the photo remains visible', async () => {
  assert.deepEqual(await wallPhoto(db, bucket, 'visible7'), { key: 'thumb/7' });
  assert.equal(await wallPhoto(db, bucket, 'pending'), null);
  sqlite.prepare('UPDATE media SET status = ? WHERE id = ?').run('hidden', 'visible7');
  assert.equal(await wallPhoto(db, bucket, 'visible7'), null);
  assert.equal(await wallPhoto(db, bucket, 'missing'), null);
});
