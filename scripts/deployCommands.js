'use strict';

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const scope = process.env.COMMAND_SCOPE || 'guild';

if (!token || !clientId) {
  console.error('[DEPLOY] ❌ DISCORD_TOKEN and CLIENT_ID are required.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, '..', 'commands');
const categories = fs.readdirSync(commandsPath);

for (const cat of categories) {
  const catPath = path.join(commandsPath, cat);
  if (!fs.statSync(catPath).isDirectory()) continue;
  const files = fs.readdirSync(catPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    try {
      const cmd = require(path.join(catPath, file));
      if (cmd.data) {
        commands.push(cmd.data.toJSON());
        console.log(`[DEPLOY] Queued: /${cmd.data.name}`);
      }
    } catch (err) {
      console.error(`[DEPLOY] Failed to load ${file}:`, err.message);
    }
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`[DEPLOY] Registering ${commands.length} slash commands (scope: ${scope})...`);

    let data;
    if (scope === 'global') {
      data = await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(`[DEPLOY] ✅ Registered ${data.length} global commands.`);
    } else {
      if (!guildId) {
        console.error('[DEPLOY] ❌ GUILD_ID is required for guild-scoped deployment.');
        process.exit(1);
      }
      data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`[DEPLOY] ✅ Registered ${data.length} guild commands to ${guildId}.`);
    }
  } catch (err) {
    console.error('[DEPLOY] ❌ Deployment failed:', err.message);
    process.exit(1);
  }
})();
