const express = require('express');
const router = express.Router();
const excelService = require('../services/excelService');

// GET /api/summary - Dashboard KPIs, Lab summaries, Recent Issues
router.get('/summary', async (req, res) => {
  try {
    const summary = await excelService.getSummary();
    res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    console.error('[API] Error fetching summary:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/labs - List of all labs
router.get('/labs', async (req, res) => {
  try {
    const labs = await excelService.getLabs();
    res.json({
      success: true,
      count: labs.length,
      data: labs
    });
  } catch (err) {
    console.error('[API] Error fetching labs:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/labs/:id - Details of a single lab
router.get('/labs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lab = await excelService.getLabById(id);
    if (!lab) {
      return res.status(404).json({ success: false, message: `Laboratory '${id}' not found` });
    }
    res.json({
      success: true,
      data: lab
    });
  } catch (err) {
    console.error('[API] Error fetching lab:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/equipment - All equipment table with filtering and sorting
router.get('/equipment', async (req, res) => {
  try {
    const result = await excelService.getEquipment(req.query);
    res.json({
      success: true,
      total: result.total,
      data: result.items
    });
  } catch (err) {
    console.error('[API] Error fetching equipment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/refresh - Force re-parse Excel file and emit event
router.post('/refresh', async (req, res) => {
  try {
    const updatedData = await excelService.readAuditWorkbook();
    const io = req.app.get('io');
    if (io) {
      io.emit('excel-updated', {
        timestamp: updatedData.summary.lastSynced,
        summary: updatedData.summary,
        message: 'Manual sync triggered'
      });
    }
    res.json({
      success: true,
      message: 'Workbook manually re-synced',
      data: updatedData.summary
    });
  } catch (err) {
    console.error('[API] Error refreshing workbook:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
