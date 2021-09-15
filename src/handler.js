export default class Handler {
  constructor(actions) {
    this.actions = actions;
  }

  incoming(message, ...additional) {
    const { type } = message;

    switch (type) {
      case 'EGT_HOLDER':
        this.actions.guildMemberJoin(message);
        break;
      case 'DEFAULT':
        this.actions.firstMessage(message);
        break;
      default:
        console.log('Received a message', message, additional);
    }
  }

  redisError(error) {
    console.error('REDIS ERROR:', error);
  }
}
