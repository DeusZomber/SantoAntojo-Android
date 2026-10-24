import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/app.mjs';

const TOKEN = 'local-testing-token-not-a-real-secret-000';
async function withServer(run, token = TOKEN) {
  const server = createServer({ accessToken: token });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await run(base); } finally { await new Promise(resolve => server.close(resolve)); }
}
const api = (base, path, options = {}, authorized = true) => fetch(base + path, {
  ...options, headers: { ...(authorized ? { Authorization: `Bearer ${TOKEN}` } : {}), 'Content-Type': 'application/json', ...(options.headers || {}) }
});

test('health confirms publish disabled', async () => withServer(async base => {
  const data = await (await api(base, '/health', {}, false)).json();
  assert.equal(data.status, 'ok'); assert.equal(data.publishingEnabled, false);
}));
test('private routes require authorization', async () => withServer(async base => {
  const res = await api(base, '/api/v1/campaigns/capabilities', {}, false);
  assert.equal(res.status, 401);
}));
test('missing token blocks all private operations', async () => withServer(async base => {
  const res = await api(base, '/api/v1/campaigns/capabilities');
  assert.equal(res.status, 503);
}, ''));
test('draft generates separate IG and FB copies without sending', async () => withServer(async base => {
  const res = await api(base, '/api/v1/campaigns/preview', { method:'POST', body: JSON.stringify({ product: 'fresas con crema y Raffaello', priceMx: 80 }) });
  const data = await res.json();
  assert.equal(res.status, 200); assert.equal(data.published, false); assert.equal(data.scheduled, false);
  assert.deepEqual(data.channels.map(x => x.platform), ['instagram','facebook']);
  assert.match(data.channels[0].copy, /80 MXN/);
}));
test('invalid channels and price are rejected', async () => withServer(async base => {
  for (const input of [{product:'fresas',platforms:['tiktok']},{product:'fresas',priceMx:-1},{platforms:['instagram']}]) {
    const res = await api(base, '/api/v1/campaigns/preview', {method:'POST',body:JSON.stringify(input)});
    assert.equal(res.status, 400);
  }
}));
test('publish, schedule, approve explicitly forbidden', async () => withServer(async base => {
  for (const path of ['publish','schedule','approve']) {
    const res = await api(base, `/api/v1/campaigns/${path}`, { method:'POST', body:'{}' });
    assert.equal(res.status, 403);
  }
}));
test('oversized request fails', async () => withServer(async base => {
  const res = await api(base, '/api/v1/campaigns/preview', { method:'POST', body:JSON.stringify({product:'x'.repeat(9000)}) });
  assert.equal(res.status, 413);
}));
