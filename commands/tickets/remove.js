'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { getTicketByChannel, removeParticipant } = require('../../services/ticketService');
const { logTicketAction } = require('../../services/loggingService');
const { isSupport, isAdmin } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('إزالة شخص من التذكرة / Remove a user from the ticket')
    .addUserOption(opt => opt.setName('user').setDescription('العضو / Member').setRequired(true)),

  async execute(interaction) {
    if (!isSupport(interaction.member)) {
      return interaction.reply({ content: '❌ الموظفون فقط. / Staff only.', ephemeral: true });
    }
    const ticket = await getTicketByChannel(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ استخدم داخل قناة تذكرة. / Use inside a ticket.', ephemeral: true });

    const target = interaction.options.getMember('user');
    if (!target) return interaction.reply({ content: '❌ العضو غير موجود. / Member not found.', ephemeral: true });

    // Prevent removing protected users
    if (target.id === ticket.creator_id) return interaction.reply({ content: '❌ لا يمكن إزالة صاحب التذكرة. / Cannot remove ticket creator.', ephemeral: true });
    if (target.id === ticket.claimed_by) return interaction.reply({ content: '❌ لا يمكن إزالة الموظف المُستلِم. / Cannot remove claiming staff.', ephemeral: true });
    if (target.user.bot) return interaction.reply({ content: '❌ لا يمكن إزالة البوت. / Cannot remove bot.', ephemeral: true });
    if (isAdmin(target)) return interaction.reply({ content: '❌ لا يمكن إزالة مدير. / Cannot remove admin.', ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    await removeParticipant(ticket.id, target.id, interaction.member.id);
    await interaction.channel.permissionOverwrites.delete(target.id).catch(() => {});

    await logTicketAction('تمت إزالة مشارك / Participant Removed', {
      ticketId: ticket.id, performer: interaction.member.id, target: target.id, channel: interaction.channel.id,
    });

    await interaction.editReply({ content: `✅ تمت إزالة <@${target.id}> من التذكرة. / Removed <@${target.id}> from ticket.` });
    await interaction.channel.send(`➖ <@${interaction.member.id}> أزال <@${target.id}> من التذكرة. / removed <@${target.id}> from the ticket.`);
  },
};
