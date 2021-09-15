import { Client, Intents, DMChannel } from 'discord.js';
import { isAddress } from '@pie-dao/utils';
import dotenv from 'dotenv';
import Redis from 'redis';
import { Handler } from './handler';

dotenv.config();

const redis = Redis.createClient();
const getAsync = promisify(redis.get).bind(redis);
const setAsync = promisify(redis.set).bind(redis);

const myIntents = new Intents();
myIntents.add(Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS);

const detectETHAddress = (str) => str.split(' ').find(isAddress);
console.log('1');

const detectNewETHAddress = async (str) => {
  const address = detectETHAddress(str);

  if (address) {
    if (!(await getAsync(address))) {
      return address;
    }
  }

  return false;
};

console.log('2');

// Create a new client instance
const client = new Client({ intents: myIntents });

class BotActions {
  constructor(client) {
    this.client = client;
  }

  async firstMessage(message) {
    const { author, channel, content } = message;
    const isDM = channel.constructor === DMChannel;
    const dmChannel = isDM ? channel : await author.createDM();
    console.log(
      `Got a generic message', ${content}, 'on channel', ${channel.id}, 'from user', ${author}`
    );

    if (content.match(/^!have_EGT/)) {
      message.delete();
      this.guildMemberJoin(message);
      return;
    }

    if (content.match(/^!no_EGT/)) {
      message.delete();
      dmChannel.send(
        'Hope you are enjoying our server and will be an official member with EGT soon TM'
      );
      return;
    }

    const address = await detectNewETHAddress(content);

    if (address && isDM) {
      dmChannel.send('this is the message after you have registered as a member');
    }
  }

  async guildMemberJoin({ author, channel: { guild } }) {
    const userKey = `${guild.id} | ${author.id}`;
    const dmChannel = guild.member(author);
    const message = await dmChannel.send(
      `Hey Hey! Looks like you want to be an official EGT holder member and join the "[E]" clan. For that I will need you to verify that you are not a bot. Respond to this message with ThumbsUP emoji in next 5 min.`
    );

    const guildMember = guild.member(author);

    const timeoutPid = setTimeout(() => 30000);

    const filter = (reaction) => reaction.emoji.name === '+1';
    const collected = await message.awaitReactions(filter, { max: 1, time: 30000 });

    if (collected.size === 1) {
      clearTimeout(timeoutPid);
    } else {
      return;
    }

    const Nickname = await guild.nickname.fetch();
    const newNickName = Nickname.setNickname('E |' + Nickname);

    await guildMember.edit({ Nickname: [newNickName] }, `The real EGT Holder`);
    await dmChannel.send(
      `You've been verified as EGT holder. Your address has been encrypted and will be checked for EGT balance time to time.`
    );

    await Promise.all([
      setAsync(`${userKey}|dmChannelId`, dmChannel.id),
      setAsync(`dmChannelId|${dmChannel.id}`, userKey),
    ]);
  }
}

const actions = new BotActions(client);
const handler = new Handler(actions);

// When the client is ready, run this code (only once)
client.once('ready', (...args) => {
  console.log('Connected', ...args);
});

client.on('message', (...args) => handler.incoming(...args));

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
