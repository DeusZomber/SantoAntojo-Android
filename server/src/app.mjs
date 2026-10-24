import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';

const PLATFORMS = new Set(['instagram', 'facebook']);
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const send = (res, status, data) => {
  res.writeHead(status, JSON_HEADERS);
  res.end(JSON.stringify(data));
};
const safeEqual = (a, b) => {
  const aa = Buffer.from(a || '');
  const bb = Buffer.from(b || '');
  return aa.length === bb.length && timingSafeEqual(aa, bb);
};
const clean = (value, max = 100) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
const parseBody = async (req) => {
  let size = 0; let raw = '';
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8192) throw new Error('payload_too_large');
    raw += chunk.toString('utf8');
  }
  try { return JSON.parse(raw); } catch { throw new Error('invalid_json'); }
};
const preview = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'invalid_payload' };
  const product = clean(input.product, 80);
  const description = clean(input.description, 160);
  const offer = clean(input.offer, 80);
  const platforms = input.platforms ?? ['instagram', 'facebook'];
  if (!product || !Array.isArray(platforms) || platforms.length === 0 || platforms.some(p => !PLATFORMS.has(p)) || new Set(platforms).size !== platforms.length)
    return { error: 'invalid_campaign' };
  if (input.priceMx !== undefined && (!Number.isSafeInteger(input.priceMx) || input.priceMx < 0 || input.priceMx > 100000))
    return { error: 'invalid_price' };
  const cost = input.priceMx !== undefined ? ` por $${input.priceMx} MXN` : '';
  const desc = description ? ` ${description}` : '';
  const promotion = offer ? ` ${offer}` : '';
  const templates = {
    instagram: `🍓 ¡Se antoja ${product}!${desc}${promotion}${cost}. Descúbrelo en Santo Antojo. #SantoAntojo`,
    facebook: `En Santo Antojo tenemos ${product}${cost}.${desc}${promotion} Escríbenos para conocer la disponibilidad.`
  };
  return {
    mode: 'simulation',
    status: 'pending_explicit_approval',
    approvalRequired: true,
    published: false,
    scheduled: false,
    aiGenerated: false,
    channels: platforms.map(platform => ({ platform, copy: templates[platform], status: 'draft_only' })),
    warning: 'Borradores simulados. Nada se envía a Metricool ni a redes sociales.'
  };
};
export const createServer = ({ accessToken = process.env.SANTO_CAMPAIGN_API_TOKEN } = {}) => http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');

  // Backwards-compatible safe endpoints for Santo Antojo Android 1.6.
  // We explicitly disable all Meta publishing and paid AI calls in this stage.
  if (url.pathname.startsWith('/v1/')) {
    if (!accessToken || accessToken.length < 24)
      return send(res, 503, { error: 'server_not_configured' });
    if (!safeEqual(req.headers.authorization, `Bearer ${accessToken}`))
      return send(res, 401, { error: 'Vincula este celular con el código privado del servidor.' });
    if (req.method === 'GET' && url.pathname === '/v1/status')
      return send(res, 200, {
        aiReady: false, metaReady: false, targets: [], dailyLimit: 3,
        publishingEnabled: false, mode: 'safe-stage', storagePersistent: false
      });
    if (req.method === 'GET' && url.pathname === '/v1/campaigns')
      return send(res, 200, { campaigns: [] });
    if (req.method === 'POST' && url.pathname === '/v1/campaigns')
      return send(res, 503, { error: 'El backend de IA 1.6 todavía requiere activar OPENAI_API_KEY y almacenamiento persistente.' });
    if (req.method === 'POST' && url.pathname === '/v1/connections/meta')
      return send(res, 503, { error: 'Falta conectar una aplicación Meta autorizada para publicar.' });
    if (req.method === 'POST' && url.pathname.startsWith('/v1/campaigns/') && url.pathname.endsWith('/publish'))
      return send(res, 403, { error: 'Publicación bloqueada por seguridad. No se envió nada.' });
    if (req.method === 'POST' && url.pathname.startsWith('/v1/campaigns/') && url.pathname.endsWith('/review'))
      return send(res, 409, { error: 'No hay cuentas conectadas para revisión.' });
    return send(res, 404, { error: 'Campaña no encontrada o ruta no disponible.' });
  }
  
  if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { status: 'ok', service: 'santo-antojo-campaigns', mode: 'draft-only', publishingEnabled: false, connectedToMetricool: false });
  if (url.pathname.startsWith('/api/')) {
    if (!accessToken || accessToken.length < 24) return send(res, 503, { error: 'server_not_configured' });
    if (!safeEqual(req.headers.authorization, `Bearer ${accessToken}`)) return send(res, 401, { error: 'unauthorized' });
    if (req.method === 'GET' && url.pathname === '/api/v1/campaigns/capabilities')
      return send(res, 200, { platforms: [...PLATFORMS], simulatedPreviews: true, canPublish: false, canSchedule: false, requiresApproval: true });
    if (req.method === 'POST' && url.pathname === '/api/v1/campaigns/preview') {
      try {
        const result = preview(await parseBody(req));
        return result.error ? send(res, 400, result) : send(res, 200, result);
      } catch (error) {
        return send(res, error.message === 'payload_too_large' ? 413 : 400, { error: error.message === 'payload_too_large' ? 'payload_too_large' : 'invalid_json' });
      }
    }
    if (req.method === 'POST' && /\/api\/v1\/campaigns\/(publish|schedule|approve)/.test(url.pathname))
      return send(res, 403, { error: 'external_actions_disabled', message: 'No se puede publicar ni programar desde este servidor de pruebas.' });
  }
  return send(res, 404, { error: 'not_found' });
});

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const port = Number(process.env.PORT || 3000);
  createServer().listen(port, '0.0.0.0', () => console.log(`Santo Antojo draft server listening on ${port}`));
}
