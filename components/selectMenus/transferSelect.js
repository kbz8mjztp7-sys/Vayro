'use strict';

// Transfer via user select menu (future enhancement)
async function handleTransferSelect(interaction, client) {
  // Placeholder: the /transfer command uses a user option
  // This handles any future select menu transfers
  await interaction.reply({ content: '💡 استخدم الأمر `/transfer staff:@user` لتحويل التذكرة. / Use `/transfer staff:@user`.', ephemeral: true });
}

function register(registerSelectMenuHandler) {
  registerSelectMenuHandler('ticket_transfer_select', handleTransferSelect);
}

module.exports = { register };
