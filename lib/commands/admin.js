module.exports = {
  '!say': async (sock, sender, args, ctx) => {
    if (!ctx.isOwner) return;
    await sock.sendMessage(sender, { text: args.join(' ') });
  }
};