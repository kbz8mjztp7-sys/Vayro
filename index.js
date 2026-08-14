'use strict';

// Load .env file in local dev (Replit uses Secrets directly)
try { require('dotenv').config(); } catch {}

const { startHealthServer } = require('./web/healthServer');
const { registerProcessHandlers } = require('./handlers/errorHandler');

// ── 1. Global error handlers ─────────────────────────────────────────────────
registerProcessHandlers();

// ── 2. Health server — MUST bind port before anything else ───────────────────
//    Replit detects the process as "running" once the port is open.
const server = startHealthServer();

// ── 3. Check required secrets — keep server alive even if missing ─────────────
const REQUIRED_VARS = ['DISCORD_TOKEN', 'CLIENT_ID', 'DATABASE_URL'];
const missing = REQUIRED_VARS.filter(k => !process.env[k]);

if (missing.length > 0) {
  console.error('\n[CONFIG ERROR] ══════════════════════════════════════════');
  console.error('[CONFIG ERROR] Missing required environment variables:\n');
  missing.forEach(k => console.error(`  ❌  ${k}  ← Add this in Replit → Tools → Secrets`));
  console.error('\n[CONFIG ERROR] Health server is running on port', process.env.PORT || 3000);
  console.error('[CONFIG ERROR] Add the missing secrets above, then click ▶ Run again.');
  console.error('[CONFIG ERROR] ══════════════════════════════════════════\n');
  // Do NOT exit — keep health server up so Replit preview stays green
} else {
  // All secrets present — boot the full bot
  bootBot().catch(err => {
    console.error('[BOOT] Fatal error:', err);
    process.exit(1);
  });
}

async function bootBot() {
  const { Client, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
  const fs = require('fs');
  const path = require('path');
  const config = require('./config/config');
  const { testConnection } = require('./database/database');
  const { runMigrations } = require('./database/migrations');
  const { loadCommands } = require('./handlers/commandHandler');
  const { loadEvents } = require('./handlers/eventHandler');
  const { loadComponents } = require('./handlers/componentHandler');
  const { setDiscordClient } = require('./web/healthServer');

  console.log('[BOOT] Vyro Management System starting...');

  // ── Database ──────────────────────────────────────────────────────────────
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error('[BOOT] ❌ Cannot connect to PostgreSQL. Check DATABASE_URL.');
    process.exit(1);
  }
  await runMigrations();

  // ── Discord client ────────────────────────────────────────────────────────
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
  });

  loadCommands(client);
  loadEvents(client);
  loadComponents(client);

  // ── Register slash commands ───────────────────────────────────────────────
  await registerSlashCommands(client, config, REST, Routes, fs, path);

  // ── Login ─────────────────────────────────────────────────────────────────
  console.log('[BOOT] Connecting to Discord...');
  await client.login(config.token);

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = (signal) => {
    console.log(`[SHUTDOWN] ${signal} received. Shutting down...`);
    client.destroy();
    server.close(() => process.exit(0));
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

async function registerSlashCommands(client, config, REST, Routes, fs, path) {
  try {
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    for (const cat of fs.readdirSync(commandsPath)) {
      const catPath = path.join(commandsPath, cat);
      if (!fs.statSync(catPath).isDirectory()) continue;
      for (const file of fs.readdirSync(catPath).filter(f => f.endsWith('.js'))) {
        try {
          const cmd = require(path.join(catPath, file));
          if (cmd.data) commands.push(cmd.data.toJSON());
        } catch {}
      }
    }

    const rest = new REST({ version: '10' }).setToken(config.token);
    const scope = config.bot.commandScope;

    if (scope === 'global') {
      const data = await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
      console.log(`[COMMANDS] ✅ Registered ${data.length} global slash commands.`);
    } else {
      if (!config.guildId) {
        console.warn('[COMMANDS] ⚠️  GUILD_ID not set — skipping guild command registration.');
        console.warn('[COMMANDS]    Set COMMAND_SCOPE=global in Secrets to use global commands.');
        return;
      }
      const data = await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      console.log(`[COMMANDS] ✅ Registered ${data.length} guild slash commands to ${config.guildId}.`);
    }
  } catch (err) {
    console.error('[COMMANDS] ❌ Command registration failed:', err.message);
    // Non-fatal — existing registered commands still work
  }
}
