import { BARRIERS, submitBarriers } from '../lib/store.js';
import { body, send, validDevice } from '../lib/http.js';

const ALLOWED = new Set(BARRIERS.map(b => b.id));

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  const { device, ids } = await body(req);
  if (!validDevice(device) || !Array.isArray(ids)) return send(res, 400, { error: 'Bad request' });
  const clean = [...new Set(ids)].filter(id => ALLOWED.has(id));
  if (!clean.length) return send(res, 400, { error: 'Pick at least one barrier' });
  try { send(res, 200, { ok: true, ...(await submitBarriers(device, clean)) }); }
  catch { send(res, 503, { error: 'Storage unavailable' }); }
}
