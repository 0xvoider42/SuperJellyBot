import { Client, DMChannel, Intents } from 'discord.js';
import { ethers } from 'ethers';
import { SDK } from '@elastic-dao/sdk';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import Handler from './handler.js';
import RedisAdapter from './RedisAdapter.js';

dotenv.config();

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

    if (messageCreate.content.startsWith('!')) {
      messageCreate.delete();
      this.guildMemberJoin(messageCreate);
      return;
    }

    if (messageCreate.author.id === bot) {
      return;
    }
    const address = await sdk.models.TokenHolder.isTokenHolder(content);
    if (address && isDM) {
      return address;
    }
  }

  async checkEGTHolder({ sdk, author, channel: { guild } }) {
    const dmChannel = await author.createDM();
    const checkEGTAddress = await sdk.models.TokenHolder.isTokenHolder();
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

// Login to Discord with your client's token
client.login(process.env.TOKEN);
