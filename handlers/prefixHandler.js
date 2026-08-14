'use strict';

const { isModerator } = require('../utils/permissions');
const { logModAction } = require('../services/loggingService');

// ── Prefix aliases ─────────────────────────────────────────────────────────
const ALIASES = {
  '+بنعالي': 'ban',
  '+b':       'ban',
  '+ub':      'unban',
};

// ── Helpers ────────────────────────────────────────────────────────────────
function getMentionedId(text) {
  const mentionMatch = text?.match(/^<@!?(\d{17,20})>$/);
  if (mentionMatch) return mentionMatch[1];
  if (/^\d{17,20}$/.test(text)) return text;
  return null;
}

// Returns args array from the text AFTER the alias has already been removed
function splitArgs(afterAlias) {
  return afterAlias.trim().split(/\s+/).filter(Boolean);
}

// Tries to resolve target user ID from:
//   1. Reply to a message
//   2. First arg (mention or raw ID)
async function resolveTarget(message, args) {
  // Priority 1 — replying to a message
  if (message.reference?.messageId) {
    try {
      const ref = await message.channel.messages.fetch(message.reference.messageId);
      if (ref?.author && !ref.author.bot) {
        return { userId: ref.author.id, remainingArgs: args };
      }
    } catch {}
  }

  // Priority 2 — first arg is a mention or ID
  const userId = getMentionedId(args[0]);
  if (userId) return { userId, remainingArgs: args.slice(1) };

  return { userId: null, remainingArgs: args };
}

// ── Handlers ───────────────────────────────────────────────────────────────
const handlers = {

  async ban(message, args) {
    if (!isModerator(message.member)) {
      return message.reply('❌ المشرفون فقط. / Moderators only.');
    }

    const { userId, remainingArgs } = await resolveTarget(message, args);

    if (!userId) {
      return message.reply(
        '❌ **الاستخدام:**\n' +
        '• `+b @عضو` أو `+b ID_العضو`\n' +
        '• `+بنعالي @عضو [السبب]`\n' +
        '• أو **رُد على رسالة العضو** واكتب `+b`'
      );
    }

    const reasonRaw = remainingArgs.join(' ').trim();
    const reason    = reasonRaw || 'لم يُحدد / Not specified';

    try {
      const targetMember = message.guild.members.cache.get(userId);
      if (targetMember) {
        const dm = reasonRaw
          ? `🔨 تم حظرك من **${message.guild.name}**.\nالسبب: ${reasonRaw}`
          : `🔨 تم حظرك من **${message.guild.name}**.`;
        await targetMember.send(dm).catch(() => {});
      }

      await message.guild.members.ban(userId, { reason, deleteMessageSeconds: 0 });
      await logModAction('حظر عضو / Member Banned', {
        type: 'ban', moderator: message.member.id, target: userId, reason,
      });

      const reply = reasonRaw
        ? `✅ تم حظر <@${userId}>.\nالسبب: ${reasonRaw}`
        : `✅ تم حظر <@${userId}>.`;
      await message.reply(reply);
    } catch (err) {
      await message.reply(`❌ فشل الحظر: ${err.message}`);
    }
  },

  async unban(message, args) {
    if (!isModerator(message.member)) {
      return message.reply('❌ المشرفون فقط. / Moderators only.');
    }

    const { userId, remainingArgs } = await resolveTarget(message, args);

    if (!userId) {
      return message.reply(
        '❌ **الاستخدام:**\n' +
        '• `+ub ID_العضو [السبب]`'
      );
    }

    const reasonRaw = remainingArgs.join(' ').trim();
    const reason    = reasonRaw || 'لم يُحدد / Not specified';

    try {
      await message.guild.members.unban(userId, reason);
      await logModAction('رفع الحظر / Member Unbanned', {
        type: 'unban', moderator: message.member.id, target: userId, reason,
      });
      const reply = reasonRaw
        ? `✅ تم رفع الحظر عن <@${userId}>.\nالسبب: ${reasonRaw}`
        : `✅ تم رفع الحظر عن <@${userId}>.`;
      await message.reply(reply);
    } catch {
      await message.reply('❌ المستخدم غير محظور أو المعرف غير صالح.');
    }
  },
};

// ── Main export ────────────────────────────────────────────────────────────
async function handlePrefix(message) {
  const content = message.content.trim();

  // Match longest alias first (so +بنعالي beats +b if both start the same way)
  const alias = Object.keys(ALIASES)
    .sort((a, b) => b.length - a.length)
    .find(a =>
      content.toLowerCase().startsWith(a.toLowerCase()) &&
      (content.length === a.length || /\s/.test(content[a.length]))
    );

  if (!alias) return false;

  const handlerKey = ALIASES[alias];
  const handler    = handlers[handlerKey];
  if (!handler) return false;

  // ✅ FIX: slice alias out first, then split — no double-shift
  const args = splitArgs(content.slice(alias.length));
  await handler(message, args);
  return true;
}

module.exports = { handlePrefix };
