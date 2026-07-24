const { useMultiFileAuthState, fetchLatestWaWebVersion } = require('@whiskeysockets/baileys');
const { restoreSession, backupSession } = require('./supabaseSession');

async function loadSession() {
  await restoreSession();

  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestWaWebVersion();

  const wrappedSaveCreds = async () => {
    await saveCreds();
    await backupSession();
  };

  return { state, saveCreds: wrappedSaveCreds, version };
}

module.exports = { loadSession };