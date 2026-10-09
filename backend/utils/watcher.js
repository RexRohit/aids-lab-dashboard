const chokidar = require('chokidar');
const path = require('path');
const excelService = require('../services/excelService');

let isWatcherPaused = false;

function pauseWatcher() {
  isWatcherPaused = true;
  console.log('[Watcher] File watcher paused for programmatic write operation.');
}

function resumeWatcher(delayMs = 1500) {
  setTimeout(() => {
    isWatcherPaused = false;
    console.log('[Watcher] File watcher resumed.');
  }, delayMs);
}

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
    if (isWatcherPaused || excelService.isSyncingOrUploading) {
      console.log(`[Watcher] Ignoring file event "${eventType}" on ${filePath} (watcher paused or sync/upload in flight).`);
      return;
    }

    console.log(`[Watcher] Detected file event: ${eventType} on ${filePath}`);

    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      if (isWatcherPaused || excelService.isSyncingOrUploading) {
        console.log(`[Watcher] Debounced action cancelled (watcher paused or sync/upload in flight).`);
        return;
      }

      try {
        console.log('[Watcher] Re-reading Excel workbook and updating cache...');
        const updatedData = await excelService.readAuditWorkbook();

        console.log('[Watcher] Emitting "dashboard:updated" and "excel-updated" events to all connected clients.');
        const payload = {
          timestamp: updatedData.summary.lastSynced,
          summary: updatedData.summary,
          message: 'Excel audit file was modified and successfully re-synced.'
        };
        io.emit('dashboard:updated', payload);
        io.emit('excel-updated', payload);
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

module.exports = { initWatcher, pauseWatcher, resumeWatcher };
