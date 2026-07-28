const { useMultiFileAuthState, fetchLatestWaWebVersion } = require('@whiskeysockets/baileys');
const { restoreSession, backupSession, getAuthDir } = require('./supabaseSession');

async function loadSession(sessionId) {
  await restoreSession(sessionId);

  const { state, saveCreds } = await useMultiFileAuthState(getAuthDir(sessionId));
  const { version } = await fetchLatestWaWebVersion();

  const wrappedSaveCreds = async () => {
    await saveCreds();
    await backupSession(sessionId);
  };

  return { state, saveCreds: wrappedSaveCreds, version };
}

module.exports = { loadSession };