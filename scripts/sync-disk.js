const fs = require('fs');
const path = require('path');
const appealsManager = require('./appeals-manager.js');
const YandexDiskRegistry = require('./yandex-disk-sync.js');

(async () => {
  console.log('🔄 [SyncDisk] Starting real-time sync with Yandex Disk...');
  try {
    // 1. Sync main Excel and CSV registry
    await appealsManager.syncToYandexDisk();

    // 2. Sync all signed DOCX assignments into Поручения_2026/
    const ydisk = new YandexDiskRegistry();
    const dbPath = path.join(__dirname, '..', 'data', 'appeals.json');
    if (fs.existsSync(dbPath)) {
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      const assignments = (db.appeals || []).filter(a => a.caseId && a.caseId.startsWith('СПР-'));
      for (const a of assignments) {
        await ydisk.saveAssignmentDocx(a);
      }
      console.log(`📑 [SyncDisk] Synced ${assignments.length} assignment DOCX files to Поручения_2026/ on Yandex Disk.`);
    }

    console.log('✅ [SyncDisk] Real-time sync complete!');
  } catch (err) {
    console.error('❌ [SyncDisk] Sync error:', err);
  }
})();
