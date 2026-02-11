const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType } = require("discord.js");
const config = require("./config.json");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Estrutura de filas
const filas = {
  "1v1": [],
  "2v2": [],
  "3v3": [],
  "4v4": []
};

client.once("ready", () => {
  console.log(`✅ Bot profissional iniciado como ${client.user.tag}`);
});

// Atualiza embed da fila
async function atualizarEmbed(interaction, tipoFila) {
  const filaAtual = filas[tipoFila];

  const embed = new EmbedBuilder()
    .setTitle(`📋 Fila: ${tipoFila}`)
    .setColor("#00aaff")
    .setDescription(
      filaAtual.length === 0
        ? "Nenhum participante na fila."
        : filaAtual.map((id, i) => `${i + 1}. <@${id}>`).join("\n")
    )
    .setFooter({ text: `Total na fila: ${filaAtual.length}/${config.filaMax[tipoFila]}` });

  await interaction.update({ embeds: [embed] });
}

// Checa se a fila encheu
async function checarFila(interaction, tipoFila) {
  const filaAtual = filas[tipoFila];

  if (filaAtual.length >= config.filaMax[tipoFila]) {
    await interaction.channel.send(`🎉 A fila ${tipoFila} está cheia! Criando canal de estudo...`);
    if (config.categoryId) {
      const channel = await interaction.guild.channels.create({
        name: `fila-${tipoFila}`,
        type: ChannelType.GuildText,
        parent: config.categoryId,
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone, deny: ['SendMessages'] }
        ]
      });
      await channel.send(`💡 Canal automático criado para ${tipoFila}`);
    }
    filas[tipoFila] = []; // reset da fila
  }
}

// Interação de botões
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const userId = interaction.user.id;
  const tipoFila = interaction.customId.split("_")[0]; // ex: 1v1_entrar

  if (interaction.customId.endsWith("entrar")) {
    if (!filas[tipoFila].includes(userId)) filas[tipoFila].push(userId);
  } else if (interaction.customId.endsWith("sair")) {
    filas[tipoFila] = filas[tipoFila].filter(id => id !== userId);
  }

  await atualizarEmbed(interaction, tipoFila);
  await checarFila(interaction, tipoFila);
});

// Comando inicial
client.on("messageCreate", async message => {
  if (!message.content.startsWith("!fila")) return;

  for (const tipoFila of ["1v1", "2v2", "3v3", "4v4"]) {
    const embed = new EmbedBuilder()
      .setTitle(`📋 Fila: ${tipoFila}`)
      .setColor("#00aaff")
      .setDescription("Clique nos botões para entrar ou sair da fila")
      .setFooter({ text: `Sistema educacional profissional` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${tipoFila}_entrar`)
        .setLabel("Entrar")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`${tipoFila}_sair`)
        .setLabel("Sair")
        .setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.login(config.token);
