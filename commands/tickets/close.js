'use strict';

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { getTicketByChannel } = require('../../services/ticketService');
const { isSupport, isAdmin } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('قفل التذكرة / Close the current ticket'),

  async execute(interaction) {
    const ticket = await getTicketByChannel(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ استخدم داخل قناة تذكرة. / Use inside a ticket.', ephemeral: true });

    const member = interaction.member;
    const isCreator = ticket.creator_id === member.id;
    const isClaimant = ticket.claimed_by === member.id;
    const staffAllowed = isClaimant || (!ticket.claimed_by && isSupport(member)) || isAdmin(member);

    if (!isCreator && !staffAllowed) {
      return interaction.reply({ content: '❌ ليس لديك صلاحية إغلاق هذه التذكرة. / You cannot close this ticket.', ephemeral: true });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_close_confirm').setLabel('✅ تأكيد / Confirm').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('ticket_close_cancel').setLabel('❌ إلغاء / Cancel').setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
      content: '⚠️ هل أنت متأكد من إغلاق هذه التذكرة؟\nAre you sure you want to close this ticket?',
      components: [row],
      ephemeral: true,
    });
  },
};
