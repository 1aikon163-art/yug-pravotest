const appealsManager = require('./appeals-manager.js');

(async () => {
  console.log('🔄 [SyncDisk] Starting real-time sync with Yandex Disk...');
  try {
    await appealsManager.syncToYandexDisk();
    console.log('✅ [SyncDisk] Real-time sync complete!');
  } catch (err) {
    console.error('❌ [SyncDisk] Sync error:', err);
  }
})();
