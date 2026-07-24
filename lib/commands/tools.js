const { sendReaction } = require('../commandHelpers');

const REACTIONS = ['hug', 'pat', 'kiss', 'cry', 'dance', 'slap', 'cuddle', 'wink', 'highfive', 'kill'];

const commands = {};
for (const type of REACTIONS) {
  commands['!' + type] = async (sock, sender) => sendReaction(sock, sender, type);
}

module.exports = commands;