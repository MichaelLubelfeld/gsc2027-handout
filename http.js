export async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch { return {}; }
}

export function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

export const validDevice = d => typeof d === 'string' && /^[a-z0-9]{8,40}$/i.test(d);

// Facilitator key comes from the ADMIN_KEY env var. Locally (no ADMIN_KEY, not on Vercel) any key works.
export function isAdmin(req) {
  const given = req.headers['x-admin-key'];
  if (!given) return false;
  const key = process.env.ADMIN_KEY;
  if (!key) return !process.env.VERCEL;
  return given === key;
}
