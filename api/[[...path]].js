// Vercel Serverless Function (Node.js)
// Routes all non-static requests to the TanStack Start server entry.

import serverEntry from '../dist/server/index.js';

function getHeader(req, name) {
  // Vercel/Node lowercases headers.
  return req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
}

async function readBody(req) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  try {
    const proto = getHeader(req, 'x-forwarded-proto') || 'https';
    const host = getHeader(req, 'x-forwarded-host') || getHeader(req, 'host') || 'localhost';
    const url = `${proto}://${host}${req.url || '/'}`;

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers || {})) {
      if (typeof v === 'string') headers.set(k, v);
      else if (Array.isArray(v)) headers.set(k, v.join(','));
    }

    let body;
    const method = (req.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      body = await readBody(req);
    }

    const request = new Request(url, {
      method,
      headers,
      body: body ? body : undefined,
    });

    const env = {};
    const ctx = { waitUntil() {} };

    const response = await serverEntry.fetch(request, env, ctx);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      // Some headers are managed by Vercel; but setting is usually fine.
      if (key.toLowerCase() === 'transfer-encoding') return;
      res.setHeader(key, value);
    });

    const arrayBuffer = await response.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end(`Server error: ${e?.message || String(e)}`);
  }
}
