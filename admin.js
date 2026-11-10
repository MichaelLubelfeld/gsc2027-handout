import { setShown, resetAll } from '../lib/store.js';
import { body, send, isAdmin } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  if (!isAdmin(req)) return send(res, 401, { error: 'Wrong facilitator key' });
  const { action, id, shown } = await body(req);
  try {
    if (action === 'check') return send(res, 200, { ok: true });
    if (action === 'show') {
      const ok = await setShown(String(id), shown);
      return send(res, ok ? 200 : 404, { ok });
    }
    if (action === 'reset') return send(res, 200, { ok: true, deleted: await resetAll() });
    send(res, 400, { error: 'Unknown action' });
  } catch { send(res, 503, { error: 'Storage unavailable' }); }
}
