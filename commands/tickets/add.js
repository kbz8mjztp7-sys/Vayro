'use strict';

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { getTicketByChannel, addParticipant } = require('../../services/ticketService');
const { logTicketAction } = require('../../services/loggingService');
const { isSupport } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('إضافة شخص للتذكرة / Add a user to the ticket')
    .addUserOption(opt => opt.setName('user').setDescription('العضو / Member').setRequired(true)),

  async execute(interaction) {
    if (!isSupport(interaction.member)) {
      return interaction.reply({ content: '❌ الموظفون فقط. / Staff only.', ephemeral: true });
    }
    const ticket = await getTicketByChannel(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ استخدم داخل قناة تذكرة. / Use inside a ticket.', ephemeral: true });

    const target = interaction.options.getMember('user');
    if (!target) return interaction.reply({ content: '❌ العضو غير موجود. / Member not found.', ephemeral: true });
    if (target.user.bot) return interaction.reply({ content: '❌ لا يمكن إضافة بوت. / Cannot add bots.', ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    const added = await addParticipant(ticket.id, target.id, interaction.member.id);
    if (!added) return interaction.editReply({ content: `❌ <@${target.id}> موجود بالفعل في التذكرة. / Already in ticket.` });

    await interaction.channel.permissionOverwrites.edit(target.id, {
      ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
    });

    await logTicketAction('تمت إضافة مشارك / Participant Added', {
      ticketId: ticket.id, performer: interaction.member.id, target: target.id, channel: interaction.channel.id,
    });

    await interaction.editReply({ content: `✅ تمت إضافة <@${target.id}> للتذكرة. / Added <@${target.id}> to ticket.` });
    await interaction.channel.send(`➕ <@${interaction.member.id}> أضاف <@${target.id}> إلى التذكرة. / added <@${target.id}> to the ticket.`);
  },
};
