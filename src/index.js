import { Client, DMChannel, Intents } from 'discord.js';
import { ethers } from 'ethers';
import { SDK } from '@elastic-dao/sdk';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import Handler from './handler.js';
import RedisAdapter from './RedisAdapter.js';

dotenv.config();

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const sdkConfig = {
  customFetch: fetch,
  env: { factoryAddress: process.env.FACTORY_ADDRESS },
  ipfsGateways: [
    'https://elasticdao01.mypinata.cloud',
    'https://elasticdao02.mypinata.cloud',
    'https://gateway.pinata.cloud',
    'https://cloudflare-ipfs.com',
    'https://ipfs.fleek.co',
    'https://ipfs.io',
  ],
  live: true,
  // multicall: true,
  provider: new ethers.providers.JsonRpcProvider(process.env.RPC_URL),
  storageAdapter: new RedisAdapter(),
};

const sdk = new SDK(sdkConfig);

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

    if (messageCreate.content.startsWith('!')) {
      messageCreate.delete();
      this.guildMemberJoin(messageCreate);
      return;
    }

    if (messageCreate.author.id === bot) {
      return;
    }
  }

  async checkEGTHolder({ sdk, author, channel: { guild } }) {
    const dmChannel = await author.createDM();
    const checkEGTAddress = await sdk.models.TokenHolder();
  }

  async guildMemberJoin({ author, channel: { guild } }) {
    const dmChannel = await author.createDM();
    const message = await dmChannel.send(
      `Hey Hey! I've heard that you want to verify your address as EGT Holder.` +
        `\n To be sure react to this message with Thumbs UP emoji within next 5 minutes.`
    );

    await message;
    // this is how to get a username
    console.log(author.username);

    //await dmChannel.send('please provide your Address on which you have EGT');
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
