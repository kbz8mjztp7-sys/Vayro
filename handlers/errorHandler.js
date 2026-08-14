'use strict';

const { errorEmbed } = require('../utils/embeds');

const replied = new WeakSet();

async function safeReply(interaction, options) {
  if (replied.has(interaction)) return;
  replied.add(interaction);
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ ...options, ephemeral: true });
    } else {
      await interaction.reply({ ...options, ephemeral: true });
    }
  } catch (e) {
    // Interaction expired or already replied - ignore
  }
}

async function handleInteractionError(interaction, error) {
  console.error('[ERROR] Interaction error:', error);
  const embed = errorEmbed(
    'حدث خطأ / An Error Occurred',
    `\`\`\`${String(error.message).substring(0, 500)}\`\`\``
  );
  await safeReply(interaction, { embeds: [embed] });
}

function registerProcessHandlers() {
  process.on('unhandledRejection', (reason) => {
    console.error('[ERROR] Unhandled rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[ERROR] Uncaught exception:', err);
    if (err.code !== 'ECONNRESET' && err.code !== 'ENOTFOUND') {
      process.exit(1);
    }
  });
}

module.exports = { safeReply, handleInteractionError, registerProcessHandlers };
