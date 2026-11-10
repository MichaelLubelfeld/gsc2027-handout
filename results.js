import { getResults } from '../lib/store.js';
import { send, isAdmin } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'GET only' });
  const admin = isAdmin(req);
  try { send(res, 200, { ...(await getResults(admin)), admin }); }
  catch { send(res, 503, { error: 'Storage unavailable' }); }
}
