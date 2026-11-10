// Local test server only (excluded from deploy): node dev-server.js
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/')) {
    const mod = await import(path.join(root, u.pathname + '.js'));
    return mod.default(req, res);
  }
  let f = u.pathname === '/' ? '/index.html' : u.pathname;
  if (!path.extname(f)) f += '.html';
  fs.readFile(path.join(root, f), (e, d) => {
    if (e) { res.statusCode = 404; return res.end('404'); }
    res.setHeader('Content-Type', f.endsWith('.html') ? 'text/html' : 'text/plain');
    res.end(d);
  });
}).listen(process.env.PORT || 3000, () => console.log('dev on', process.env.PORT || 3000));
