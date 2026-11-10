import { LENSES, submitClinic } from '../lib/store.js';
import { body, send, validDevice } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  const { device, text, lens } = await body(req);
  if (!validDevice(device) || typeof text !== 'string') return send(res, 400, { error: 'Bad request' });
  const t = text.replace(/\s+/g, ' ').trim().slice(0, 280);
  if (t.length < 5) return send(res, 400, { error: 'Add a few more words' });
  const l = LENSES.includes(lens) ? lens : 'Not sure';
  try {
    const r = await submitClinic(device, t, l);
    if (r.limited) return send(res, 429, { error: 'Limit of 3 barriers per device' });
    send(res, 200, { ok: true });
  } catch { send(res, 503, { error: 'Storage unavailable' }); }
}
