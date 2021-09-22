import { Client, DMChannel, Intents, Interaction } from 'discord.js';
import { ethers } from 'ethers';
import { promisify } from 'util';
import { SDK } from '@elastic-dao/sdk';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import Handler from './handler.js';
import Redis from 'redis';
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
const redis = Redis.createClient();
const getAsync = promisify(redis.get).bind(redis);
const setAsync = promisify(redis.set).bind(redis);
const isAddress = ethers.utils.isAddress().toString();

const detectNewETHAddress = async (str) => {
  const address = detectETHAddress(str);

  if (address) {
    if (!(await getAsync(address))) {
      return address;
    }
  }

  return false;
};

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const registerAddress = async (user, address) => {
  const EGT_HOLDER = new Set(JSON.parse((await getAsync('EGTHolder')) || '[]'));
  EGT_HOLDER.add(address);
  await Promise.all([
    setAsync('EGTHolder', JSON.stringify(Array.from(EGT_HOLDER))),
    setAsync(address, user.id),
    setAsync(`${user.id}|address`, address),
  ]);
};

class Ready {
  constructor(client) {
    this.client = client;
  }

  async genMessage(messageCreate) {
    const { author, channel, content } = messageCreate;
    const isDM = messageCreate.channel.type == 'DM';
    const dmChannel = isDM ? channel : await author.createDM();
    console.log('Got a generic message', content, 'on channel', channel.id, 'from user', author);

    if (messageCreate.content.startsWith('!')) {
      messageCreate.delete();
      this.guildMemberJoin(messageCreate);
      return;
    }
  }

  async guildMemberJoin({ author }) {
    const dmChannel = await author.createDM();
    const text = await dmChannel.send(
      `Hey Hey! I've heard that you want to verify your address as an EGT Holder.`
    );

    const filter = (m) => m.content.includes('test');
    const collector = dmChannel.createMessageCollector(filter, { time: 15000 });

    collector.on('collect', (m) => console.log('collected item', m.content));
    collector.on('end', (collected) => {
      console.log('collected Items', collected.size);
    });

    // const filter = (m) => m.content.includes('test');

    // const collected = await dmChannel.awaitMessages({ filter, time: 30000 });

    // const collector = dmChannel.createMessageCollector({ filter, time: 30000 });

    // dmChannel
    //   .awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
    //   .then((collected) => console.log('The filter is working', collected.size))
    //   .catch((collected) =>
    //     console.log(`The time for collecting your address has expired, please repeat the process`)
    //   );

    await text;
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
