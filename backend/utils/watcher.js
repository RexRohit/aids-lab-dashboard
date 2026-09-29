const chokidar = require('chokidar');
const path = require('path');
const excelService = require('../services/excelService');

function initWatcher(io) {
  const filePath = excelService.getFilePath();
  console.log(`[Watcher] Initializing Chokidar file watcher on: ${filePath}`);

  let debounceTimer = null;

  const watcher = chokidar.watch(filePath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 400,
      pollInterval: 100
    }
  });

  const handleFileChange = async (eventType) => {
    console.log(`[Watcher] Detected file event: ${eventType} on ${filePath}`);

    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      try {
        console.log('[Watcher] Re-reading Excel workbook and updating cache...');
        const updatedData = await excelService.readAuditWorkbook();

        console.log('[Watcher] Emitting "excel-updated" event to all connected clients.');
        io.emit('excel-updated', {
          timestamp: updatedData.summary.lastSynced,
          summary: updatedData.summary,
          message: 'Excel audit file was modified and successfully re-synced.'
        });
      } catch (err) {
        console.error('[Watcher] Error parsing updated Excel file:', err.message);
      }
    }, 300);
  };

  watcher.on('change', () => handleFileChange('change'));
  watcher.on('add', () => handleFileChange('add'));
  watcher.on('error', (err) => console.error('[Watcher] Chokidar watcher error:', err));

  return watcher;
}

module.exports = { initWatcher };
