// Storage: Upstash Redis over REST (Vercel Marketplace -> "Upstash for Redis").
// With no credentials set, falls back to in-memory storage (local testing only).

export { BARRIERS, LENSES } from './barriers.js';
import { BARRIERS } from './barriers.js';

const P = 'gsc27:';

const RURL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
export const usingMemory = !(RURL && TOKEN);

async function pipeline(cmds) {
  if (usingMemory) return cmds.map(mem);
  const r = await fetch(`${RURL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds)
  });
  if (!r.ok) throw new Error(`Redis ${r.status}`);
  const out = await r.json();
  return out.map(x => { if (x.error) throw new Error(x.error); return x.result; });
}

// ---- minimal in-memory Redis for local testing ----
const M = globalThis.__gscMem || (globalThis.__gscMem = new Map());
function mem([cmd, key, ...a]) {
  switch (cmd) {
    case 'GET': return M.get(key) ?? null;
    case 'SET': M.set(key, a[0]); return 'OK';
    case 'INCR': { const v = Number(M.get(key) || 0) + 1; M.set(key, String(v)); return v; }
    case 'EXPIRE': return 1;
    case 'HINCRBY': { const h = M.get(key) || {}; h[a[0]] = Number(h[a[0]] || 0) + Number(a[1]); M.set(key, h); return h[a[0]]; }
    case 'HSET': { const h = M.get(key) || {}; h[a[0]] = a[1]; M.set(key, h); return 1; }
    case 'HGET': return (M.get(key) || {})[a[0]] ?? null;
    case 'HGETALL': return Object.entries(M.get(key) || {}).flat().map(String);
    case 'DEL': { let n = 0; for (const k of [key, ...a]) if (M.delete(k)) n++; return n; }
    case 'KEYS': return [...M.keys()].filter(k => k.startsWith(key.replace('*', '')));
    default: throw new Error('mem: unsupported ' + cmd);
  }
}

const toObj = arr => { const o = {}; for (let i = 0; i < (arr || []).length; i += 2) o[arr[i]] = arr[i + 1]; return o; };

// One barrier vote per device; resubmitting replaces that device's earlier vote.
export async function submitBarriers(device, ids) {
  const [prevRaw] = await pipeline([['GET', P + 'vote:' + device]]);
  const prev = prevRaw ? JSON.parse(prevRaw) : null;
  const cmds = [];
  if (prev) prev.forEach(id => cmds.push(['HINCRBY', P + 'barriers', id, -1]));
  else cmds.push(['INCR', P + 'respondents']);
  ids.forEach(id => cmds.push(['HINCRBY', P + 'barriers', id, 1]));
  cmds.push(['SET', P + 'vote:' + device, JSON.stringify(ids)]);
  await pipeline(cmds);
  return { updated: !!prev };
}

// Up to 3 clinic barriers per device. Hidden from the projector until a facilitator shows it.
export async function submitClinic(device, text, lens) {
  const [n] = await pipeline([['INCR', P + 'clinicCount:' + device], ['EXPIRE', P + 'clinicCount:' + device, 7200]]);
  if (n > 3) return { limited: true };
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await pipeline([['HSET', P + 'clinic', id, JSON.stringify({ id, text, lens, ts: Date.now(), shown: false })]]);
  return { id };
}

export async function getResults(includeHidden) {
  const [b, r, c] = await pipeline([['HGETALL', P + 'barriers'], ['GET', P + 'respondents'], ['HGETALL', P + 'clinic']]);
  const counts = toObj(b);
  const barriers = BARRIERS
    .map(x => ({ ...x, count: Math.max(0, Number(counts[x.id] || 0)) }))
    .sort((a, z) => z.count - a.count);
  let clinic = Object.values(toObj(c)).map(s => JSON.parse(s)).sort((a, z) => a.ts - z.ts);
  const totalClinic = clinic.length;
  if (!includeHidden) clinic = clinic.filter(e => e.shown);
  return { respondents: Number(r || 0), barriers, clinic, totalClinic };
}

export async function setShown(id, shown) {
  const [raw] = await pipeline([['HGET', P + 'clinic', id]]);
  if (!raw) return false;
  const e = JSON.parse(raw); e.shown = !!shown;
  await pipeline([['HSET', P + 'clinic', id, JSON.stringify(e)]]);
  return true;
}

export async function resetAll() {
  const [keys] = await pipeline([['KEYS', P + '*']]);
  if (keys && keys.length) await pipeline([['DEL', ...keys]]);
  return keys ? keys.length : 0;
}
