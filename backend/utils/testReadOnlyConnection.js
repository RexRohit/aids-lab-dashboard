require('dotenv').config();
const googleSheetsService = require('../services/googleSheetsService');

async function testReadOnly() {
  console.log('===========================================================');
  console.log(' Google Sheets API - Read-Only Connectivity Test');
  console.log('===========================================================');

  const keyPath = googleSheetsService.getKeyFilePath();
  console.log('GOOGLE_APPLICATION_CREDENTIALS set:', keyPath ? 'YES' : 'NO');
  console.log('Spreadsheet ID:', process.env.GOOGLE_SHEET_ID || 'MISSING');
  console.log('Checking configuration status...');

  if (!googleSheetsService.isConfigured()) {
    console.error('❌ Service is not configured. Please verify GOOGLE_SHEET_ID and GOOGLE_APPLICATION_CREDENTIALS.');
    process.exit(1);
  }

  console.log('Attempting read-only connection with Google Sheets API...');
  const result = await googleSheetsService.testConnection();

  if (result.connected) {
    console.log('✓ AUTHENTICATION SUCCEEDED!');
    console.log(`✓ SPREADSHEET ACCESSED: "${result.spreadsheetTitle}"`);
    console.log(`✓ SPREADSHEET ID: ${result.sheetId}`);
    console.log(`✓ WORKSHEETS FOUND (${result.sheets.length}):`, result.sheets.join(', '));
    console.log('✓ READ-ONLY TEST COMPLETED: Zero records were modified.');
    console.log('===========================================================');
    process.exit(0);
  } else {
    console.error('❌ CONNECTION FAILED:', result.message || result.error);
    console.log('===========================================================');
    process.exit(1);
  }
}

testReadOnly().catch(err => {
  console.error('❌ Fatal error during read-only test:', err.message);
  process.exit(1);
});
