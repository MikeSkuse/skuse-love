import { test } from 'node:test';
import assert from 'node:assert/strict';
import { uploadToWeddingWall } from '../src/worker/wedding-wall.ts';

const file = new File(['image'], 'guest.png', { type: 'image/png' });
const config = { uploadKey: 'guest-key', settings: { uploadEnabled: true, uploadKeyRequired: true } };
const json = (body, status = 200) => Response.json(body, { status });

test('forwards the file and guest key and maps WeddingWall moderation statuses', async () => {
  for (const status of ['pending', 'visible']) {
    let calls = 0;
    const result = await uploadToWeddingWall(file, async (url, options) => {
      calls++;
      if (calls === 1) { assert.equal(url, 'https://wall.skuse.pics/api/config'); return json(config); }
      assert.equal(url, 'https://wall.skuse.pics/api/upload');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.get('x-upload-key'), 'guest-key');
      const sent = options.body.get('photos');
      assert.equal(sent.name, file.name);
      assert.equal(await sent.text(), 'image');
      return json({ uploads: [{ job: { status } }] });
    });
    assert.deepEqual(result, { ok: true, status });
    assert.equal(calls, 2);
  }
});

test('handles disabled uploads, per-file failure and network errors', async () => {
  assert.equal((await uploadToWeddingWall(file, async () => json({ settings: { uploadEnabled: false } }))).status, 403);
  let calls = 0;
  const rejected = await uploadToWeddingWall(file, async () => ++calls === 1 ? json(config) : json({ uploads: [{ job: { status: 'failed' } }] }));
  assert.equal(rejected.status, 503);
  assert.equal((await uploadToWeddingWall(file, async () => { throw new Error('offline'); })).status, 503);
});


test('forwards original, display, and thumbnail to WeddingWall', async () => {
  const thumbnail = new File(['thumbnail'], 'thumbnail.jpg', { type: 'image/jpeg' });
  const display = new File(['display'], 'display.jpg', { type: 'image/jpeg' });
  let calls = 0;
  const result = await uploadToWeddingWall(file, async (_url, options) => {
    if (++calls === 1) return json(config);
    assert.equal(await options.body.get('photos').text(), 'image');
    assert.equal(await options.body.get('displayPhotos').text(), 'display');
    assert.equal(await options.body.get('thumbPhotos').text(), 'thumbnail');
    assert.equal(options.body.get('uploaderName'), 'Alex');
    assert.equal(options.body.get('caption'), 'A lovely day');
    return json({ uploads: [{ job: { status: 'visible' } }] });
  }, thumbnail, display, { uploaderName: 'Alex', caption: 'A lovely day' });
  assert.equal(result.ok, true);
});
