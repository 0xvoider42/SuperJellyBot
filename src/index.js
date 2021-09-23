import { Client, DMChannel, Intents, Interaction, Message } from 'discord.js';
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

console.log(sdkConfig);

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
});

const sdk = new SDK(sdkConfig);
const redis = Redis.createClient();
const getAsync = promisify(redis.get).bind(redis);
const setAsync = promisify(redis.set).bind(redis);
const isAddress = (str) => ethers.utils.isAddress(str);
const dao = await sdk.models.DAO.deserialize('0xaaa1f5fc9617195b5aa7fd1bd989d47f9e8d3f82');
console.log(dao.toObject());
const token = await dao.token();

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
    console.log(
      `Got a generic message, ${content}, on channel, ${channel.id}, from user, ${author}`
    );

    if (author.bot) return;

    if (messageCreate.content.startsWith('!')) {
      messageCreate.delete();
      this.guildMemberJoin(messageCreate, dmChannel);
      return;
    }

    const address = await content.toString();

    const checkedAddress = await isAddress(address);

    console.log('DAO', dao.ecosystem);

    const checkingEGT = await sdk.models.TokenHolder.deserialize(address, dao.ecosystem, token);

    if (checkedAddress == true) {
      console.log('THIS IS AN ADDRESS');
    }

    if (checkingEGT && isDM) {
      if (checkingEGT.lambda > 0) {
        console.log(checkingEGT.lambda);
        dmChannel.send('you got some EGT');
      }
      dmChannel.send(`You don't have EGT`);
    }
  }

  async guildMemberJoin({ author }, dmChannel) {
    const text = await dmChannel.send(
      `Hey Hey! I've heard that you want to verify your address as an EGT Holder.`
    );
    const filter = () => true;

    dmChannel
      .awaitMessages({ filter, max: 1, time: 5000 })
      .then((messages) => console.log('messages', messages));
  }
}

const ready = new Ready(client);
const handler = new Handler(ready);

client.on('ready', (...args) => console.log('Bot is ready!', ...args));

client.on('messageCreate', (...args) => handler.incoming(...args));

// Login to Discord with your client's token
client.login(process.env.TOKEN);
