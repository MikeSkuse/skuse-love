import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({ entryPoints: ['src/worker/index.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { default: app } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
function database() {
  const claims = new Map();
  return {
    prepare(sql) {
      let args = [];
      return {
        bind(...values) { args = values; return this; },
        async first() { if (sql.includes('rate_limits')) return { count: 1 }; throw Error(sql); },
        async run() { if (sql.includes('INSERT INTO prize_claims')) { if (!claims.has(args[0])) claims.set(args[0], { game: args[1], guest_name: args[2], created_at: '2026-11-29 15:00:00' }); return {}; } throw Error(sql); },
        async all() { if (sql.includes('FROM prize_claims')) return { results: [...claims.values()] }; throw Error(sql); },
      };
    },
  };
}

test('prize claims validate, record once on retry, and require admin access to read', async () => {
  const env = { DB: database(), ADMIN_TOKEN: 'test-token' };
  const id = '3f1c79fd-6aae-4952-b993-856e599b6a04';
  const post = body => app.request('/api/prize-claims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, env);
  assert.equal((await post({ id, game: 'bingo', name: '  ' })).status, 400);
  assert.equal((await post({ id, game: 'other', name: 'Anna' })).status, 400);
  assert.equal((await post({ id, game: 'bingo', name: ' Anna ' })).status, 200);
  assert.equal((await post({ id, game: 'bingo', name: 'Anna' })).status, 200);
  const quizId = '28e3c75b-0813-4eea-9b6d-09b9705cb65d';
  assert.equal((await post({ id: quizId, game: 'quiz', name: 'Mike' })).status, 200);
  assert.equal((await app.request('/api/admin/prize-claims', {}, env)).status, 401);
  const response = await app.request('/api/admin/prize-claims', { headers: { Authorization: 'Bearer test-token' } }, env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), [{ game: 'bingo', guest_name: 'Anna', created_at: '2026-11-29 15:00:00' }, { game: 'quiz', guest_name: 'Mike', created_at: '2026-11-29 15:00:00' }]);
});
