export default class Handler {
  constructor(actions) {
    this.actions = actions;
  }

  incoming(messageCreate, ...additional) {
    console.log(messageCreate, ...additional);
    const { type } = messageCreate;

    switch (type) {
      case 'EGT_HOLDER':
        this.actions.guildMemberJoin(messageCreate);
        break;
      case 'DEFAULT':
        this.actions.genMessage(messageCreate);
        break;
      default:
        console.log('Received a message', messageCreate, additional);
    }
  }

  redisError(error) {
    console.error('REDIS ERROR:', error);
  }
}
