import { Client, DMChannel, Intents } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
  console.log('I am ready!');
});

client.on('message', (message) => {
  if (message.content.includes('!')) {
    message.member.setNickname(`[G] ${message.member.user.username}`);
  }

  console.log(message.content);
  console.log(message.member.user);
});

// collector.on('collect', (m) => {
//   console.log(`Collected ${m.content}`);
// });

client.login(process.env.TOKEN);
