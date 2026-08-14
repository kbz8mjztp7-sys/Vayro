'use strict';

const { buildTicketModal } = require('../modals/ticketModal');

async function handleTicketTypeSelect(interaction, client) {
  const typeId = interaction.values[0];
  const modal = buildTicketModal(typeId);
  if (!modal) return interaction.reply({ content: '❌ نوع التذكرة غير موجود. / Ticket type not found.', ephemeral: true });
  await interaction.showModal(modal);
}

function register(registerSelectMenuHandler) {
  registerSelectMenuHandler('ticket_type_select', handleTicketTypeSelect);
}

module.exports = { register };
