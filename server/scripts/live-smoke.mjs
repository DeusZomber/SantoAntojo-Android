// Non-mutating HTTPS smoke test of the deployed draft server.
// No tokens are sent and no publishing/scheduling endpoints are called.
import assert from 'node:assert/strict';

const base = 'https://santo-antojo-campaigns-test.onrender.com';
async function get(path) {
  const r = await fetch(base + path, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(120000)
  });
  const data = await r.json();
  return { status: r.status, data };
}
const health = await get('/health');
console.log('HTTPS /health:', health.status, health.data);
assert.equal(health.status, 200);
assert.equal(health.data.status, 'ok');
assert.equal(health.data.publishingEnabled, false);
assert.equal(health.data.connectedToMetricool, false);
const auth = await get('/api/v1/campaigns/capabilities');
console.log('HTTPS /api/v1/campaigns/capabilities (sin credencial):', auth.status, auth.data);
assert.equal(auth.status, 401,
  'El servidor todavia no tiene SANTO_CAMPAIGN_API_TOKEN configurado (503), o la ruta de acceso privado no esta correctamente protegida.');
console.log('PASS: HTTPS activo, acceso privado protegido, publicaciones deshabilitadas.');
