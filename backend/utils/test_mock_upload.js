const fs = require('fs');
const path = require('path');
const excelService = require('../services/excelService');
const googleSheetsService = require('../services/googleSheetsService');

async function runMockedTests() {
  console.log('===========================================================');
  console.log(' Running Mocked Safe Tests for Excel Upload Synchronization');
  console.log('===========================================================');

  const excelPath = excelService.getFilePath();
  const testBuffer = fs.readFileSync(excelPath);
  console.log(`✓ Loaded test Excel workbook buffer: ${testBuffer.length} bytes`);

  // 1. Test preview validation
  const preview = await excelService.validateAndPreviewExcel(testBuffer, 'test.xlsx');
  console.log(`✓ Preview validation passed: isValid=${preview.isValid}, detectedLabs=${preview.detectedLabsCount}, totalRecords=${preview.totalRecords}`);

  // 2. Test candidate parsing without cache mutation
  const originalCache = excelService.cachedData;
  const candidate = await excelService.parseAuditWorkbookBuffer(testBuffer);
  console.log(`✓ Standalone buffer parsing passed: ${candidate.summary.totalComputers} total computers (${candidate.summary.workingComputers} working, ${candidate.summary.faultyComputers} faulty)`);
  if (excelService.cachedData !== originalCache) {
    throw new Error('FAILED: parseAuditWorkbookBuffer mutated excelService.cachedData!');
  }
  console.log('✓ Verified: parseAuditWorkbookBuffer did NOT mutate excelService.cachedData');

  // 3. Test non-destructive range generation
  const existingTitles = [
    'Summary Sheet',
    'SWL(202)',
    'ARVR(234)',
    'DSL(235)',
    'AIL (236)',
    'OSL(238)',
    'PL(239)',
    'Sheet2'
  ];

  let capturedBatchUpdates = null;
  let capturedBatchClears = null;

  // Mock getSheetsClient
  const mockSheetsClient = {
    spreadsheets: {
      get: async () => ({
        data: {
          sheets: existingTitles.map(t => ({ properties: { title: t } }))
        }
      }),
      values: {
        batchUpdate: async (payload) => {
          capturedBatchUpdates = payload.requestBody.data;
          return { data: { totalUpdatedRows: 175 } };
        },
        batchClear: async (payload) => {
          capturedBatchClears = payload.requestBody.ranges;
          return { data: {} };
        }
      }
    }
  };

  const origGetSheetsClient = googleSheetsService.getSheetsClient.bind(googleSheetsService);
  const origIsConfigured = googleSheetsService.isConfigured.bind(googleSheetsService);

  googleSheetsService.getSheetsClient = async () => mockSheetsClient;
  googleSheetsService.isConfigured = () => true;

  try {
    const updateResult = await googleSheetsService.updateAuditSheetsNonDestructive(candidate.labs);
    console.log(`✓ updateAuditSheetsNonDestructive executed cleanly: ${updateResult.updatedRangesCount} ranges prepared`);

    // Verify ranges
    const ranges = capturedBatchUpdates.map(u => u.range);
    console.log('Captured batch update ranges:');
    ranges.forEach(r => console.log('   ->', r));

    // Assert Summary Sheet range
    const summaryRange = ranges.find(r => r.includes('Summary Sheet'));
    if (!summaryRange || !summaryRange.includes('A5:K')) {
      throw new Error(`Summary Sheet range invalid: ${summaryRange}`);
    }
    console.log('✓ Summary Sheet range preserved rows 1-4:', summaryRange);

    // Assert Sheet2 is never touched
    const touchedSheet2 = ranges.some(r => r.includes('Sheet2'));
    if (touchedSheet2) {
      throw new Error('FAILED: Sheet2 was included in update ranges!');
    }
    console.log('✓ Sheet2 was completely protected and untouched');

    // Assert lab ranges start at row 7
    candidate.labs.forEach(lab => {
      const labRange = ranges.find(r => r.includes(lab.sheetName) || (lab.room && r.includes(lab.room)));
      if (!labRange || !labRange.includes('!A7:M')) {
        throw new Error(`Lab ${lab.code} range does not start at row 7: ${labRange}`);
      }
    });
    console.log('✓ All lab equipment ranges correctly start at Row 7 (preserving rows 1-6)');

    // 4. Test Read-Back Verification Mismatch handling
    console.log('\n--- Testing Read-Back Verification Mismatch Protection ---');
    // Mock readAllSheets returning 100 instead of expected total
    googleSheetsService.readAllSheets = async () => ({
      'Summary Sheet': [],
      'SWL(202)': [
        ['Header 1'], [], [], [], [],
        ['Sr NO', 'Central', 'Dept', 'Lab', 'Supplier', 'Type', 'Particulars'],
        ['1', 'C1', 'D1', 'L1', 'Supp', 'PC', 'Sys1', 'Mon1', 'YES', 'CPU1', 'YES', '2026', 'OK']
      ]
    });

    let mismatchCaught = false;
    try {
      await excelService.importUploadedExcel(testBuffer, 'test.xlsx');
    } catch (err) {
      if (err.message.includes('Cloud synchronization verification failed')) {
        mismatchCaught = true;
        console.log('✓ Mismatch correctly caught and rejected:', err.message);
      } else {
        throw err;
      }
    }

    if (!mismatchCaught) {
      throw new Error('FAILED: Mismatched upload was NOT rejected!');
    }

    // 5. Test Concurrency Mutex
    console.log('\n--- Testing Concurrency Mutex Lock ---');
    excelService.isSyncingOrUploading = true;
    let mutexCaught = false;
    try {
      await excelService.importUploadedExcel(testBuffer, 'concurrent.xlsx');
    } catch (err) {
      if (err.message.includes('already active')) {
        mutexCaught = true;
        console.log('✓ Concurrency collision rejected:', err.message);
      }
    }
    excelService.isSyncingOrUploading = false;
    if (!mutexCaught) {
      throw new Error('FAILED: Concurrent upload was NOT blocked by mutex!');
    }

    console.log('\n===========================================================');
    console.log(' ALL TESTS PASSED! Fix is completely verified and non-destructive.');
    console.log('===========================================================');
  } finally {
    googleSheetsService.getSheetsClient = origGetSheetsClient;
    googleSheetsService.isConfigured = origIsConfigured;
  }
}

runMockedTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
