#!/usr/bin/env node
/**
 * fallcompass-api · HTTP wrapper for the sovereign LLM cascade
 * @ai-native-solutions/fallcompass-api
 *
 * Endpoints:
 *   GET  /health          · liveness
 *   GET  /providers       · adapter metadata + default order
 *   GET  /probe           · which providers are reachable
 *   POST /chat            · run the cascade
 *   POST /call/:provider  · call a single named provider
 *   POST /keys/:provider  · save a BYOK key (process env)
 *   DELETE /keys/:provider · clear a BYOK key
 */

import express from 'express';
import fc from '@ai-native-solutions/fallcompass-sdk';

const PORT = Number(process.env.PORT || 8790);
const HOST = process.env.HOST || '0.0.0.0';
const AUTH_TOKEN = process.env.FALLCOMPASS_AUTH_TOKEN;

// Seed keys from env
for (const p of Object.keys(fc.PROVIDERS)) {
  const env = process.env['FALLCOMPASS_' + p.toUpperCase() + '_KEY']
           || process.env[p.toUpperCase() + '_API_KEY'];
  if (env) fc.setKey(p, env);
}

const app = express();
app.use(express.json({ limit: '1mb' }));

// CORS + optional bearer auth
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  if (AUTH_TOKEN) {
    const h = req.headers.authorization || '';
    if (h !== 'Bearer ' + AUTH_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  }
  next();
});

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'fallcompass-api', version: fc.VERSION, providers: Object.keys(fc.PROVIDERS).length });
});

app.get('/providers', (req, res) => {
  res.json({ providers: fc.listProviders(), default_order: fc.DEFAULT_ORDER, version: fc.VERSION });
});

app.get('/probe', async (req, res) => {
  try {
    const subset = req.query.providers ? String(req.query.providers).split(',').map(s => s.trim()).filter(Boolean) : undefined;
    const r = await fc.probe(subset);
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/chat', async (req, res) => {
  try {
    const r = await fc.chat(req.body || {});
    res.json(r);
  } catch (e) {
    res.status(502).json({ error: e.message, attempts: e.attempts || [] });
  }
});

app.post('/call/:provider', async (req, res) => {
  try {
    const r = await fc.callProvider(req.params.provider, req.body || {});
    res.json(r);
  } catch (e) { res.status(502).json({ error: e.message }); }
});

app.post('/keys/:provider', (req, res) => {
  try {
    const key = req.body?.key;
    if (!key) return res.status(400).json({ error: 'body.key required' });
    fc.setKey(req.params.provider, key);
    res.json({ ok: true, provider: req.params.provider });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/keys/:provider', (req, res) => {
  try {
    fc.clearKey(req.params.provider);
    res.json({ ok: true, provider: req.params.provider });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/', (req, res) => {
  res.type('text/plain').send(
`fallcompass-api v${fc.VERSION}
sovereign LLM cascade · 8 providers · first success wins

GET    /health                · liveness
GET    /providers             · adapter metadata + default order
GET    /probe                 · which providers are reachable
POST   /chat                  · run the cascade  (body: { messages, preferredOrder?, model?, maxTokens? })
POST   /call/:provider        · call one adapter (body: { messages, model?, maxTokens? })
POST   /keys/:provider        · save BYOK key   (body: { key })
DELETE /keys/:provider        · clear BYOK key

MIT · ai-nativesolutions.com
`);
});

const server = app.listen(PORT, HOST, () => {
  console.log('fallcompass-api v' + fc.VERSION + ' · listening on http://' + HOST + ':' + PORT);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));

export default app;
