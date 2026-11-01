import { DurableObject } from 'cloudflare:workers';

const PROJECTS = ['experiments', 'pocket-liquid-hourglass', 'bubble-wrap', 'sticker-peel', 'molten-glass', 'jelly-cube', 'zipper', 'light-switch-wall', 'scratch-card', 'wax-seal', 'pocket-thunderstorm', 'gummy-squish', 'little-spider'];
const ORIGIN = 'https://experiments.fazleyrabbi.xyz';
const SOURCE = 'experiments-cloudflare-2026-10-10-v1';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class VisitLedger extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS totals (project TEXT PRIMARY KEY, visits INTEGER NOT NULL DEFAULT 0, baseline INTEGER NOT NULL DEFAULT 0, seeded INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS events (project TEXT NOT NULL, id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(project, id));
      CREATE TABLE IF NOT EXISTS rate_limits (bucket TEXT PRIMARY KEY, hits INTEGER NOT NULL);
    `);
    for (const project of PROJECTS) this.sql.exec('INSERT OR IGNORE INTO totals(project) VALUES (?)', project);
  }

  total(project) {
    const row = this.sql.exec('SELECT visits, baseline, seeded FROM totals WHERE project = ?', project).one();
    return { views: row.visits + row.baseline, backupVisits: row.visits, baselineKnown: !!row.seeded };
  }

  hit(project, id, ipHash) {
    return this.ctx.storage.transactionSync(() => {
      if (this.sql.exec('SELECT id FROM events WHERE project = ? AND id = ?', project, id).toArray().length) return this.total(project);
      const minute = Math.floor(Date.now() / 60000);
      const bucket = `${minute}:${ipHash}`;
      this.sql.exec('DELETE FROM rate_limits WHERE bucket < ?', `${minute - 2}:`);
      const used = this.sql.exec('SELECT hits FROM rate_limits WHERE bucket = ?', bucket).toArray()[0]?.hits || 0;
      if (used >= 60) return { limited: true };
      this.sql.exec('INSERT INTO rate_limits(bucket, hits) VALUES (?, 1) ON CONFLICT(bucket) DO UPDATE SET hits = hits + 1', bucket);
      this.sql.exec('INSERT INTO events(project, id, created_at) VALUES (?, ?, ?)', project, id, new Date().toISOString());
      this.sql.exec('UPDATE totals SET visits = visits + 1 WHERE project = ?', project);
      return this.total(project);
    });
  }

  snapshot() {
    return {
      schemaVersion: 1, source: SOURCE, exportedAt: new Date().toISOString(),
      // Only visits collected here are imported. Baselines never enter this export.
      projects: this.sql.exec('SELECT project, visits AS total FROM totals ORDER BY project').toArray()
    };
  }

  seed(project, baseline) {
    return this.ctx.storage.transactionSync(() => {
      const row = this.sql.exec('SELECT baseline, seeded FROM totals WHERE project = ?', project).one();
      // The VPS may receive legacy visits too. Accept newer baselines, never
      // let an older sync request reduce an already displayed total.
      if (row.seeded && baseline < row.baseline) return { conflict: true };
      this.sql.exec('UPDATE totals SET baseline = ?, seeded = 1 WHERE project = ?', baseline, project);
      return this.total(project);
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff' };
    if (origin === ORIGIN) {
      headers['Access-Control-Allow-Origin'] = ORIGIN;
      headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
    }
    const json = (body, status = 200) => Response.json(body, { status, headers });
    if (request.method === 'OPTIONS') return new Response(null, { status: origin === ORIGIN ? 204 : 403, headers });
    const ledger = env.VISITS.getByName(SOURCE);
    try {
      if (url.pathname.startsWith('/admin/')) {
        if (!env.ADMIN_TOKEN || request.headers.get('Authorization') !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: 'Unauthorized' }, 401);
        if (url.pathname === '/admin/export' && request.method === 'GET') return json(await ledger.snapshot());
        if (url.pathname === '/admin/baseline' && request.method === 'POST') {
          const body = await request.json();
          if (!PROJECTS.includes(body.project) || !Number.isSafeInteger(body.baseline) || body.baseline < 0) return json({ error: 'Invalid baseline' }, 400);
          const result = await ledger.seed(body.project, body.baseline);
          return json(result, result.conflict ? 409 : 200);
        }
        return json({ error: 'Not found' }, 404);
      }
      const project = url.searchParams.get('project');
      if (!PROJECTS.includes(project)) return json({ error: 'Unknown experiment' }, 400);
      if (url.pathname === '/api/get' && request.method === 'GET') return json(await ledger.total(project));
      if (url.pathname !== '/api/hit' || request.method !== 'POST') return json({ error: 'Not found' }, 404);
      if (origin !== ORIGIN) return json({ error: 'Origin not allowed' }, 403);
      if (Number(request.headers.get('Content-Length') || 0) > 1024) return json({ error: 'Request too large' }, 413);
      const body = await request.json();
      if (!uuid.test(body.id || '')) return json({ error: 'Invalid visit ID' }, 400);
      const agent = request.headers.get('User-Agent') || '';
      if (/bot|spider|crawler|preview|lighthouse|headless|playwright|puppeteer|selenium|curl|wget|uptime/i.test(agent)) return json(await ledger.total(project));
      // Persist only a short-lived IP hash for basic rate limiting; no raw IPs.
      const salt = `${env.ADMIN_TOKEN}:${Math.floor(Date.now() / 86400000)}:`;
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + (request.headers.get('CF-Connecting-IP') || 'unknown')));
      const ipHash = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
      const result = await ledger.hit(project, body.id, ipHash);
      return json(result, result.limited ? 429 : 200);
    } catch {
      return json({ error: 'Counter unavailable' }, 503);
    }
  }
};
