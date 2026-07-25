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
  }
};