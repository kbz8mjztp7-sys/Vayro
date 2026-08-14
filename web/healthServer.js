'use strict';

const express = require('express');
const config = require('../config/config');

let client = null;
const startTime = Date.now();

function setDiscordClient(discordClient) {
  client = discordClient;
}

function createHealthServer() {
  const app = express();
  app.disable('x-powered-by');

  const healthData = () => ({
    name: 'Vyro Management System',
    version: '1.0.0',
    status: 'online',
    discord: client ? (client.isReady() ? 'connected' : 'connecting') : 'not_initialized',
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    uptime_human: formatUptime(Date.now() - startTime),
    timestamp: new Date().toISOString(),
    guilds: client?.isReady() ? client.guilds.cache.size : 0,
  });

  app.get('/', (_req, res) => res.json(healthData()));
  app.get('/health', (_req, res) => res.json(healthData()));

  app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

  return app;
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(' ');
}

function startHealthServer() {
  const app = createHealthServer();
  const port = config.bot.port;
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`[HEALTH] ✅ Health server listening on 0.0.0.0:${port}`);
  });
  server.on('error', (err) => {
    console.error('[HEALTH] Server error:', err.message);
  });
  return server;
}

module.exports = { startHealthServer, setDiscordClient };
