'use strict';

const fs = require('fs');
const path = require('path');

function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    try {
      const event = require(path.join(eventsPath, file));
      if (!event.name || !event.execute) {
        console.warn(`[EVENTS] Skipping ${file}: missing name or execute`);
        continue;
      }
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      console.log(`[EVENTS] Registered: ${event.name}`);
    } catch (err) {
      console.error(`[EVENTS] Failed to load ${file}:`, err.message);
    }
  }
  console.log(`[EVENTS] ✅ Loaded ${files.length} events.`);
}

module.exports = { loadEvents };
