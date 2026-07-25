const botState = require('../state');

module.exports = {
  '!autoviewstatus': async (sock, sender, args, ctx) => {
    if (!ctx.isOwner) return;
    const arg = (args[0] || '').toLowerCase();

    if (arg === 'on') {
      botState.autoViewStatus = true;
      await sock.sendMessage(sender, { text: '✅ Auto-view status turned ON' });
    } else if (arg === 'off') {
      botState.autoViewStatus = false;
      await sock.sendMessage(sender, { text: '❌ Auto-view status turned OFF' });
    } else {
      await sock.sendMessage(sender, {
        text: `Usage: !autoviewstatus on|off\nCurrently: ${botState.autoViewStatus ? 'ON' : 'OFF'}`
      });
    }
  },

  '!autolikestatus': async (sock, sender, args, ctx) => {
    if (!ctx.isOwner) return;
    const arg = (args[0] || '').toLowerCase();

    if (arg === 'on') {
      botState.autoLikeStatus = true;
      await sock.sendMessage(sender, { text: `✅ Auto-like status turned ON (${botState.autoLikeEmojis.join(' ')})` });
    } else if (arg === 'off') {
      botState.autoLikeStatus = false;
      await sock.sendMessage(sender, { text: '❌ Auto-like status turned OFF' });
    } else {
      await sock.sendMessage(sender, {
        text: `Usage: !autolikestatus on|off\nCurrently: ${botState.autoLikeStatus ? 'ON' : 'OFF'} (${botState.autoLikeEmojis.join(' ')})`
      });
    }
  }
};