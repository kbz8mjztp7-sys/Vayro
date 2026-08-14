'use strict';

const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;
    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        const command = require(path.join(categoryPath, file));
        if (!command.data || !command.execute) {
          console.warn(`[CMD] Skipping ${file}: missing data or execute`);
          continue;
        }
        client.commands.set(command.data.name, command);
        console.log(`[CMD] Loaded: /${command.data.name}`);
      } catch (err) {
        console.error(`[CMD] Failed to load ${file}:`, err.message);
      }
    }
  }
  console.log(`[CMD] ✅ Loaded ${client.commands.size} commands.`);
}

module.exports = { loadCommands };
