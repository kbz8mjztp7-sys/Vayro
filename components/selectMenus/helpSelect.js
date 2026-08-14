'use strict';

const { baseEmbed } = require('../../utils/embeds');
const config = require('../../config/config');

async function handleHelpCategorySelect(interaction, client) {
  const categoryKey = interaction.values[0];
  const { categories } = require('../../commands/general/help');
  const category = categories[categoryKey];
  if (!category) return interaction.reply({ content: '❌ الفئة غير موجودة. / Category not found.', ephemeral: true });

  const embed = baseEmbed(config.colors.primary)
    .setTitle(`${category.label}`)
    .setDescription(
      category.commands.map(cmd =>
        `**${cmd.name}**\n> 📝 ${cmd.desc}\n> 🔒 ${cmd.perms}\n> 💡 \`${cmd.example}\``
      ).join('\n\n')
    );

  await interaction.update({ embeds: [embed] });
}

function register(registerSelectMenuHandler) {
  registerSelectMenuHandler('help_category', handleHelpCategorySelect);
}

module.exports = { register };
