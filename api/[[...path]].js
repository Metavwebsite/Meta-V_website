// Vercel Serverless Function (Node.js)
// Routes all non-static requests to the TanStack Start server entry.

import serverEntry from '../dist/server/index.js';
import fs from 'node:fs/promises';
import path from 'node:path';

function getHeader(req, name) {
  // Vercel/Node lowercases headers.
  return req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.map':
      return 'application/json; charset=utf-8';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml; charset=utf-8';
    case '.webp':
      return 'image/webp';
    case '.avif':
      return 'image/avif';
    case '.woff2':
      return 'font/woff2';
    default:
      return 'application/octet-stream';
  }
}

async function tryServeClientAsset(req, res, pathname) {
  if (!pathname.startsWith('/assets/')) return false;

  const rel = pathname.slice('/assets/'.length);
  // Prevent path traversal.
  if (!rel || rel.includes('..') || rel.includes('\\') || rel.startsWith('/')) return false;

  const assetPath = path.resolve(process.cwd(), 'dist', 'client', 'assets', rel);

  try {
    const data = await fs.readFile(assetPath);
    res.statusCode = 200;
    res.setHeader('content-type', contentTypeFor(assetPath));
    // Hashed assets are safe to cache long-term.
    res.setHeader('cache-control', 'public, max-age=31536000, immutable');
    res.end(data);
    return true;
  } catch {
    return false;
  }
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

    const pathname = new URL(url).pathname;
    if (await tryServeClientAsset(req, res, pathname)) {
      return;
    }

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
