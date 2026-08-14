'use strict';

const cooldowns = new Map();

function checkCooldown(key, duration) {
  const now = Date.now();
  const expiry = cooldowns.get(key);
  if (expiry && now < expiry) {
    return Math.ceil((expiry - now) / 1000);
  }
  return 0;
}

function setCooldown(key, durationSeconds) {
  cooldowns.set(key, Date.now() + durationSeconds * 1000);
}

function clearCooldown(key) {
  cooldowns.delete(key);
}

function ticketCooldownKey(guildId, userId, type) {
  return `ticket:${guildId}:${userId}:${type}`;
}

function commandCooldownKey(commandName, userId) {
  return `cmd:${commandName}:${userId}`;
}

// Clean up expired cooldowns every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of cooldowns.entries()) {
    if (now >= expiry) cooldowns.delete(key);
  }
}, 5 * 60 * 1000);

module.exports = { checkCooldown, setCooldown, clearCooldown, ticketCooldownKey, commandCooldownKey };
