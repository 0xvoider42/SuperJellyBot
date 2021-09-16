import { Client, DMChannel, Intents } from 'discord.js';
import dotenv from 'dotenv';
import Handler from './handler.js';

dotenv.config();

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

class Ready {
  constructor(client) {
    this.client = client;
  }

  async genMessage(messageCreate) {
    const { author, channel, content } = messageCreate;
    const isDM = channel.constructor === DMChannel;
    const dmChannel = isDM ? channel : await author.createDM();
    console.log('Got a generic message', content, 'on channel', channel.id, 'from user', author);
    console.log(dmChannel);

    if (messageCreate.content.startsWith('!jellify')) {
      messageCreate.delete();
      this.guildMemberJoin(messageCreate);
      return;
    }
  }

  async guildMemberJoin({ author, channel: { guild } }) {
    const dmChannel = await author.createDM();
    const message = await dmChannel.send(
      `Hey Hey! I've heard that you want to verify your address as EGT Holder. To be sure react to this message with Thumbs UP emoji within next 5 minutes.`
    );

    // const EGTHodler = guild.client(author);

    console.log(guild.available);

    const timeoutPid = setTimeout(
      () => notEGTHodler(EGTHodler, 'Captcha Timeout', message),
      10000
    );

    const filter = (reaction) => reaction.emoji.name === '👍';
    const collected = await message
      .awaitReactions({ filter, time: 30000 })
      .then((collected) => console.log(`Collected ${collected.size} reactions`));

    if (collected.size === 1) {
      clearTimeout(timeoutPid);
    } else {
      return;
    }

    await dmChannel.send('please provide your Address on which you have EGT');
  }

  async notEGTHodler(EGTHodler, originalMessage) {
    console.log('giving up on this one', EGTHodler.username, EGTHodler.id);

    if (originalMessage) {
      await originalMessage.delete();
    }

    const dmChannel = await EGTHodler.createDM();
    await dmChannel.send('you have not provided your address, thus, I can not Jellify you.');
  }
}

const ready = new Ready(client);
const handler = new Handler(ready);

client.on('ready', (...args) => console.log('Bot is ready!', ...args));

client.on('messageCreate', (...args) => handler.incoming(...args));

// const subscription = (eventName) => {
//   return [
//     eventName,
//     (...args) => {
//       console.log('EVENT', Client.messageCreate, 'received:', ...args);
//     },
//   ];
// };

//client.on(...subscription('applicationCommandCreate'));

// Login to Discord with your client's token
client.login(process.env.TOKEN);

// Sending a question to the member, weather they have EGT or NO.
// If they do, ask for their address on which they have EGT.
// If they don't conclude the question.

// In case of receiving the address ===V
// The address has to be encrypted and stored.
// We need to check the address for EGT
// If EGT is present the Nickname of the member is changed and E || is added to it
// EGT balance needs to be checked several times a day, to confirm the EGT

// When the client is ready, run this code (only once)
