'use strict';

const { InteractionType } = require('discord.js');
const { handleInteractionError } = require('../handlers/errorHandler');
const { handleButton, handleModal, handleSelectMenu } = require('../handlers/componentHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
          await interaction.reply({ content: '❌ هذا الأمر غير موجود / Command not found.', ephemeral: true });
          return;
        }
        await command.execute(interaction, client);
      } else if (interaction.isButton()) {
        await handleButton(interaction, client);
      } else if (interaction.isModalSubmit()) {
        await handleModal(interaction, client);
      } else if (interaction.isStringSelectMenu() || interaction.isUserSelectMenu()) {
        await handleSelectMenu(interaction, client);
      }
    } catch (err) {
      await handleInteractionError(interaction, err);
    }
  },
};
