require('dotenv').config();
const excelService = require('../services/excelService');
const googleSheetsService = require('../services/googleSheetsService');

async function main() {
  console.log('=======================================================');
  console.log(' AI&DS Laboratory Audit - Google Sheets Initial Sync');
  console.log('=======================================================');

  if (!googleSheetsService.isConfigured()) {
    console.error('ERROR: Google Sheets credentials are not configured in backend/.env');
    console.error('Please configure:');
    console.error('  GOOGLE_SHEET_ID=');
    console.error('  GOOGLE_SERVICE_ACCOUNT_EMAIL=');
    console.error('  GOOGLE_PRIVATE_KEY=');
    process.exit(1);
  }

  console.log('Testing Google Sheets API connection...');
  const test = await googleSheetsService.testConnection();
  if (!test.connected) {
    console.error(`ERROR: Failed to connect to Google Sheets: ${test.error || test.message}`);
    process.exit(1);
  }

  console.log(`✓ Connected to Spreadsheet: "${test.spreadsheetTitle}" (${test.sheetId})`);
  console.log('Loading local Excel audit workbook...');
  await excelService.readAuditWorkbook();

  console.log('Pushing all worksheets (Summary + 6 Labs) to Google Sheets...');
  const res = await excelService.persistFullWorkbook();

  console.log('✓ Successfully synchronized workbook with Google Sheets persistent cloud!');
  console.log('=======================================================');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error during sync:', err);
  process.exit(1);
});
