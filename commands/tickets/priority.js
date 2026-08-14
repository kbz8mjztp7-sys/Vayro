'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { getTicketByChannel, getTicketType, updateTicketField } = require('../../services/ticketService');
const { logTicketAction } = require('../../services/loggingService');
const { isSupport } = require('../../utils/permissions');
const { ticketEmbed } = require('../../utils/embeds');
const { buildTicketActionRows } = require('../../components/buttons/ticketButtons');
const { PRIORITY_LABELS } = require('../../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('priority')
    .setDescription('تغيير أولوية التذكرة / Change ticket priority')
    .addStringOption(opt =>
      opt.setName('level').setDescription('الأولوية / Priority level').setRequired(true)
        .addChoices(
          { name: '🟢 منخفض / Low', value: 'low' },
          { name: '🔵 عادي / Normal', value: 'normal' },
          { name: '🟠 عالي / High', value: 'high' },
          { name: '🔴 عاجل / Urgent', value: 'urgent' },
        )
    ),

  async execute(interaction) {
    if (!isSupport(interaction.member)) {
      return interaction.reply({ content: '❌ الموظفون فقط. / Staff only.', ephemeral: true });
    }
    const ticket = await getTicketByChannel(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ استخدم داخل قناة تذكرة. / Use inside a ticket.', ephemeral: true });

    const level = interaction.options.getString('level');
    await interaction.deferReply({ ephemeral: true });

    const updated = await updateTicketField(ticket.id, 'priority', level);
    const ticketType = getTicketType(ticket.ticket_type);

    if (ticket.opening_message_id) {
      const msg = await interaction.channel.messages.fetch(ticket.opening_message_id).catch(() => null);
      if (msg) await msg.edit({ embeds: [ticketEmbed(updated, ticketType)], components: buildTicketActionRows() }).catch(() => {});
    }

    await logTicketAction('تغيير الأولوية / Priority Changed', {
      ticketId: ticket.id, performer: interaction.member.id, channel: interaction.channel.id,
      details: { 'الأولوية / Priority': PRIORITY_LABELS[level] },
    });

    await interaction.editReply({ content: `✅ تم تغيير الأولوية إلى ${PRIORITY_LABELS[level]}. / Priority set to ${PRIORITY_LABELS[level]}.` });
    await interaction.channel.send(`🔖 <@${interaction.member.id}> غيّر الأولوية إلى ${PRIORITY_LABELS[level]}.`);
  },
};
