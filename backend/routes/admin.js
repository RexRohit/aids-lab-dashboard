const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const excelService = require('../services/excelService');
const googleSheetsService = require('../services/googleSheetsService');

// Helper to broadcast Socket.IO events to all connected clients
function broadcastUpdate(req, updatedSummary, message = 'Audit data updated by administrator') {
  const io = req.app.get('io');
  if (io) {
    const payload = {
      timestamp: updatedSummary.lastSynced || new Date().toISOString(),
      summary: updatedSummary,
      message
    };
    io.emit('dashboard:updated', payload);
    console.log(`[Socket.IO] Broadcasted dashboard:updated event. Total: ${updatedSummary.totalComputers}, Working: ${updatedSummary.workingComputers}, Faulty: ${updatedSummary.faultyComputers}`);
  }
}

// All endpoints in this router require admin authentication
router.use(requireAdmin);

// GET /api/admin/status - Cloud & storage status check
router.get('/status', async (req, res) => {
  try {
    const sheetsTest = await googleSheetsService.testConnection();
    res.json({
      success: true,
      storage: {
        googleSheetsConfigured: googleSheetsService.isConfigured(),
        googleSheetsConnected: sheetsTest.connected,
        sheetId: googleSheetsService.sheetId || 'Not configured',
        spreadsheetTitle: sheetsTest.spreadsheetTitle || null,
        localExcelPath: excelService.getFilePath(),
        lastSynced: excelService.lastSynced
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/records - Fetch all records with raw columns for editing
router.get('/records', async (req, res) => {
  try {
    const { labId } = req.query;
    const data = await excelService.getData();

    let labsToReturn = data.labs;
    if (labId && labId !== 'all') {
      const searchId = labId.toLowerCase().replace('/', '-');
      labsToReturn = data.labs.filter(l => 
        l.id === searchId || 
        l.code.toLowerCase().replace('/', '-') === searchId
      );
    }

    res.json({
      success: true,
      labs: labsToReturn,
      summary: data.summary,
      googleSheetsConfigured: googleSheetsService.isConfigured()
    });
  } catch (err) {
    console.error('[Admin API] Error fetching records:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/records/:id - Update single record
router.put('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields = req.body;

    if (!updatedFields || typeof updatedFields !== 'object') {
      return res.status(400).json({ success: false, error: 'Updated record fields are required.' });
    }

    const result = await excelService.updateRecord(id, updatedFields);
    broadcastUpdate(req, result.summary, `Record ${updatedFields.systemName || id} updated`);

    res.json({
      success: true,
      message: 'Record updated successfully.',
      data: result
    });
  } catch (err) {
    console.error('[Admin API] Error updating record:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/records - Add new record to a laboratory
router.post('/records', async (req, res) => {
  try {
    const { labId, record } = req.body;

    if (!labId || !record) {
      return res.status(400).json({ success: false, error: 'labId and record object are required.' });
    }

    const result = await excelService.addRecord(labId, record);
    broadcastUpdate(req, result.summary, `New record added to lab ${labId}`);

    res.json({
      success: true,
      message: 'New equipment record added successfully.',
      data: result
    });
  } catch (err) {
    console.error('[Admin API] Error adding record:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/records/:id - Delete equipment record
router.delete('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await excelService.deleteRecord(id);
    broadcastUpdate(req, result.summary, `Equipment record ${id} removed`);

    res.json({
      success: true,
      message: 'Record deleted successfully.',
      data: result
    });
  } catch (err) {
    console.error('[Admin API] Error deleting record:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/labs/:id/info - Update laboratory information & specs
router.put('/labs/:id/info', async (req, res) => {
  try {
    const { id } = req.params;
    const labInfo = req.body;

    if (!labInfo || typeof labInfo !== 'object') {
      return res.status(400).json({ success: false, error: 'Laboratory information object is required.' });
    }

    const result = await excelService.updateLabInfo(id, labInfo);
    broadcastUpdate(req, result.summary, `Laboratory ${id} specifications updated`);

    res.json({
      success: true,
      message: 'Laboratory specifications updated successfully.',
      data: result
    });
  } catch (err) {
    console.error('[Admin API] Error updating lab info:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/save - Batch save modified records and lab info
router.post('/save', async (req, res) => {
  try {
    const { labId, records, labInfo } = req.body;

    if (!labId) {
      return res.status(400).json({ success: false, error: 'labId is required for saving.' });
    }

    const result = await excelService.batchSaveLab(labId, records, labInfo);
    broadcastUpdate(req, result.summary, `Lab ${labId} records saved by administrator`);

    res.json({
      success: true,
      message: `Changes saved and synced successfully for ${labId.toUpperCase()}`,
      data: result
    });
  } catch (err) {
    console.error('[Admin API] Error batch saving lab:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/sync-sheets - Force push current workbook data to Google Sheets
router.post('/sync-sheets', async (req, res) => {
  try {
    if (!googleSheetsService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Google Sheets is not configured. Add GOOGLE_SHEET_ID and service account credentials in environment variables.'
      });
    }

    const result = await excelService.persistFullWorkbook();
    broadcastUpdate(req, excelService.cachedData.summary, 'Full workbook synced to Google Sheets');

    res.json({
      success: true,
      message: 'Workbook successfully pushed and synced to Google Sheets.',
      data: result
    });
  } catch (err) {
    console.error('[Admin API] Error syncing to Google Sheets:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
