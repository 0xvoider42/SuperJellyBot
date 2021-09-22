import { Client, DMChannel, Intents } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('message', async (message) => {
  const { author, content, channel } = message;
  const isDM = message.channel.type == 'DM';
  const dmChannel = isDM ? channel : await author.createDM();
  const text = await dmChannel.send('this is the DM');
});

// collector.on('collect', (m) => {
//   console.log(`Collected ${m.content}`);
// });

client.login(process.env.TOKEN);
