const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleSheetsService {
  constructor() {
    this.sheetsClient = null;
    this.authClient = null;
    this.sheetId = process.env.GOOGLE_SHEET_ID || '';
    this.isInitialized = false;
  }

  /**
   * Check if Google Sheets credentials and Sheet ID are provided.
   * Supports:
   * 1. GOOGLE_APPLICATION_CREDENTIALS pointing to local JSON file
   * 2. GOOGLE_SERVICE_ACCOUNT_KEY (raw JSON string)
   * 3. GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY
   */
  isConfigured() {
    const sheetId = process.env.GOOGLE_SHEET_ID || this.sheetId;
    if (!sheetId) return false;

    // 1. Check local key file path via GOOGLE_APPLICATION_CREDENTIALS
    const keyFilePath = this.getKeyFilePath();
    if (keyFilePath && fs.existsSync(keyFilePath)) {
      return true;
    }

    // 2. Check JSON string key or explicit email + private key
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    return Boolean((clientEmail && privateKey) || keyJson);
  }

  /**
   * Resolve key file path from GOOGLE_APPLICATION_CREDENTIALS
   */
  getKeyFilePath() {
    let keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!keyFilePath) return null;

    keyFilePath = keyFilePath.trim();
    // Strip surrounding quotes if present
    if (
      (keyFilePath.startsWith('"') && keyFilePath.endsWith('"')) ||
      (keyFilePath.startsWith("'") && keyFilePath.endsWith("'"))
    ) {
      keyFilePath = keyFilePath.slice(1, -1).trim();
    }

    if (!path.isAbsolute(keyFilePath)) {
      keyFilePath = path.resolve(process.cwd(), keyFilePath);
    }

    return keyFilePath;
  }

  /**
   * Initialize Google Auth client using official GoogleAuth
   */
  async getAuthClient() {
    if (this.authClient) return this.authClient;

    const sheetId = process.env.GOOGLE_SHEET_ID || this.sheetId;
    if (!sheetId) {
      throw new Error('GOOGLE_SHEET_ID environment variable is missing.');
    }
    this.sheetId = sheetId;

    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    let auth = null;

    // Option 1: Authenticate using Service Account JSON file (GOOGLE_APPLICATION_CREDENTIALS)
    const keyFilePath = this.getKeyFilePath();
    if (keyFilePath) {
      if (!fs.existsSync(keyFilePath)) {
        throw new Error(`Service account file not found at path: ${keyFilePath}`);
      }

      auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes
      });
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      // Option 2: JSON Key string in environment variable (raw JSON or base64 encoded)
      try {
        let keyStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim();
        if ((keyStr.startsWith('"') && keyStr.endsWith('"')) || (keyStr.startsWith("'") && keyStr.endsWith("'"))) {
          keyStr = keyStr.slice(1, -1).trim();
        }
        if (!keyStr.startsWith('{')) {
          try {
            const decoded = Buffer.from(keyStr, 'base64').toString('utf8');
            if (decoded.trim().startsWith('{')) {
              keyStr = decoded.trim();
            }
          } catch (_) {}
        }
        const credentials = JSON.parse(keyStr);
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes
        });
      } catch (err) {
        throw new Error(`Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON: ${err.message}`);
      }
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      // Option 3: Separate email and private key environment variables
      let formattedPrivateKey = process.env.GOOGLE_PRIVATE_KEY.trim();
      if ((formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) || (formattedPrivateKey.startsWith("'") && formattedPrivateKey.endsWith("'"))) {
        formattedPrivateKey = formattedPrivateKey.slice(1, -1);
      }
      formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL.trim(),
          private_key: formattedPrivateKey
        },
        scopes
      });
    } else {
      // Option 4: Default Application Credentials fallback
      auth = new google.auth.GoogleAuth({ scopes });
    }

    const client = await auth.getClient();
    this.authClient = client;
    this.sheetsClient = google.sheets({ version: 'v4', auth: client });
    return this.authClient;
  }

  async getSheetsClient() {
    if (!this.sheetsClient) {
      await this.getAuthClient();
    }
    return this.sheetsClient;
  }

  /**
   * Test read-only connectivity to Google Sheets without changing any spreadsheet records.
   */
  async testConnection() {
    if (!this.isConfigured()) {
      return {
        connected: false,
        configured: false,
        message: 'Google Sheets credentials are not configured in environment variables.'
      };
    }

    try {
      const sheets = await this.getSheetsClient();
      // Read-only metadata fetch: verifies credentials and permissions without modifying anything
      const res = await sheets.spreadsheets.get({
        spreadsheetId: this.sheetId
      });

      const sheetTitles = (res.data.sheets || []).map(s => s.properties.title);
      return {
        connected: true,
        configured: true,
        spreadsheetTitle: res.data.properties.title,
        sheetId: this.sheetId,
        sheets: sheetTitles,
        message: `Successfully connected to Google Sheet "${res.data.properties.title}". Read-only access verified.`
      };
    } catch (err) {
      console.error('[GoogleSheets] Connection test error:', err.message);
      return {
        connected: false,
        configured: true,
        sheetId: this.sheetId,
        error: err.message,
        message: `Failed to connect to Google Sheets: ${err.message}`
      };
    }
  }

  /**
   * Read-only inspection of the spreadsheet structure and sheet names
   */
  async testReadOnlyAccess() {
    return this.testConnection();
  }

  /**
   * Resolve closest matching existing sheet tab name (handles e.g. "SWL(202)" vs "SWL - Room 202")
   */
  async resolveSheetTitle(targetTitle) {
    try {
      const sheets = await this.getSheetsClient();
      const meta = await sheets.spreadsheets.get({ spreadsheetId: this.sheetId });
      const existingTitles = (meta.data.sheets || []).map(s => s.properties.title);

      // 1. Exact match
      const exact = existingTitles.find(t => t.toLowerCase() === targetTitle.toLowerCase());
      if (exact) return exact;

      // 2. Normalized alphanumeric match
      const cleanTarget = targetTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = existingTitles.find(t => {
        const cleanExisting = t.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanExisting === cleanTarget || cleanExisting.includes(cleanTarget) || cleanTarget.includes(cleanExisting);
      });
      if (match) return match;

      return targetTitle;
    } catch (e) {
      return targetTitle;
    }
  }

  /**
   * Ensure a sheet/tab exists in the Google Sheet. If not, create it.
   */
  async ensureSheetExists(title) {
    const resolvedTitle = await this.resolveSheetTitle(title);
    const sheets = await this.getSheetsClient();
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: this.sheetId
    });

    const existingSheets = meta.data.sheets || [];
    const exists = existingSheets.some(s => s.properties.title === resolvedTitle);

    if (!exists) {
      console.log(`[GoogleSheets] Sheet tab "${resolvedTitle}" does not exist. Creating it...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.sheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: resolvedTitle
                }
              }
            }
          ]
        }
      });
    }

    return resolvedTitle;
  }

  /**
   * Read raw values of all sheets from Google Sheets
   */
  async readAllSheets() {
    const sheets = await this.getSheetsClient();
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: this.sheetId
    });

    const sheetTitles = (meta.data.sheets || []).map(s => s.properties.title);
    const result = {};

    for (const title of sheetTitles) {
      try {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: this.sheetId,
          range: `'${title}'!A1:Z1000`
        });
        result[title] = res.data.values || [];
      } catch (err) {
        console.error(`[GoogleSheets] Failed reading sheet "${title}":`, err.message);
        result[title] = [];
      }
    }

    return result;
  }

  /**
   * Write raw 2D array of values to a specific sheet tab
   */
  async writeSheetValues(sheetTitle, values) {
    const sheets = await this.getSheetsClient();
    const resolvedTitle = await this.ensureSheetExists(sheetTitle);

    // Clear existing values
    await sheets.spreadsheets.values.clear({
      spreadsheetId: this.sheetId,
      range: `'${resolvedTitle}'!A1:Z1000`
    });

    if (values && values.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: this.sheetId,
        range: `'${resolvedTitle}'!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: values
        }
      });
    }

    console.log(`[GoogleSheets] Successfully updated sheet tab "${resolvedTitle}" with ${values.length} rows.`);
  }

  /**
   * Build 2D array for a lab sheet matching the exact audit sheet structure
   */
  buildLabSheetRows(lab) {
    const rows = [];
    const labNameUpper = (lab.name || `${lab.code} Laboratory`).toUpperCase();

    // Row 1: Title
    rows.push([
      `SNJB'S LATE SAU. K. B. JAIN COLLEGE OF ENGINEERING - ${labNameUpper} (ROOM ${lab.room || ''})`
    ]);

    // Row 2: Empty
    rows.push([]);

    // Row 3: Metadata Key-Values
    rows.push([
      'Laboratory Name:',
      lab.name || '',
      '',
      'Room Number:',
      lab.room || '',
      '',
      'Lab In-Charge:',
      lab.inCharge || 'Not Specified'
    ]);

    // Row 4: Department & Assistant
    rows.push([
      'Department:',
      'AI & DS',
      '',
      'Lab Cost:',
      lab.cost || 'N/A',
      '',
      'Lab Assistant:',
      lab.assistant || 'Not Specified'
    ]);

    // Row 5: Empty
    rows.push([]);

    // Row 6: Table Headers
    const headers = [
      'Sr NO',
      'Central Dead Stock Sr No',
      'Departmental Dead Stock Sr No',
      'Lab Dead Stock Sr No',
      'Supplier Name',
      'Items Types',
      'Particulars (Monitor/Keyboard/Mouse/CPU)',
      'Monitor (s/n)',
      'Working/ Not Working',
      'CPU (s/n)',
      'Working/ Not Working',
      'Purchase Date',
      'Remark by auditor/ Lab incharge'
    ];
    rows.push(headers);

    // Row 7+: Systems
    const systems = lab.systems || [];
    systems.forEach((item, index) => {
      rows.push([
        item.srNo ?? (index + 1),
        item.centralDeadStockNo || '',
        item.deptDeadStockNo || '',
        item.labDeadStockNo || '',
        item.supplier || '',
        item.itemType || 'Desktop PC',
        item.systemName || item.monitorSerial || `System ${index + 1}`,
        item.monitorSerial || '',
        item.monitorStatus || (item.status === 'Working' ? 'YES' : 'NO'),
        item.cpuSerial || '',
        item.cpuStatus || (item.status === 'Working' ? 'YES' : 'NO'),
        item.purchaseDate || '',
        item.remarks || ''
      ]);
    });

    // Row spacer
    rows.push([]);

    // Specifications & Laboratory Info section
    rows.push([`LABORATORY INFORMATION & SPECIFICATIONS - ${labNameUpper}`]);
    rows.push(['Area of Laboratory:', lab.area || 'N/A']);
    rows.push(['Operating System:', lab.os || 'N/A']);
    rows.push(['Programming Tools:', lab.tools || 'N/A']);
    rows.push(['Browsers:', lab.browsers || 'N/A']);
    rows.push(['Misc Software:', lab.misc || 'N/A']);
    rows.push(['Hardware Configuration:', lab.hardware || 'N/A']);

    return rows;
  }

  /**
   * Build Summary sheet rows
   */
  buildSummarySheetRows(labs) {
    const rows = [];
    rows.push(["SNJB'S LATE SAU. KANTABAI BHAVARLALJI JAIN COLLEGE OF ENGINEERING, CHANDWAD"]);
    rows.push(["ARTIFICIAL INTELLIGENCE AND DATA SCIENCE DEPARTMENT - LAB AUDIT REPORT 2026-27"]);
    rows.push([]);
    rows.push([
      'Sr. No.',
      'Lab Name',
      'Code',
      'Room',
      'Lab In-Charge',
      'Lab Assistant',
      'Dept Dead Stock',
      'Lab Dead Stock',
      'Available',
      'Working',
      'Not Working'
    ]);

    labs.forEach((lab, idx) => {
      rows.push([
        idx + 1,
        lab.name,
        lab.code,
        lab.room,
        lab.inCharge,
        lab.assistant,
        20,
        20,
        lab.totalCount || (lab.systems ? lab.systems.length : 0),
        lab.workingCount || 0,
        lab.faultyCount || 0
      ]);
    });

    return rows;
  }

  /**
   * Resolve existing worksheet tab for a given lab object
   */
  findLabWorksheetTab(lab, existingTitles) {
    if (lab.sheetName && existingTitles.includes(lab.sheetName)) {
      return lab.sheetName;
    }
    const roomStr = String(lab.room || '').trim();
    if (roomStr) {
      const matchByRoom = existingTitles.find(t => 
        t.includes(roomStr) && 
        !t.toLowerCase().includes('summary') && 
        t.toLowerCase() !== 'sheet2'
      );
      if (matchByRoom) return matchByRoom;
    }
    const cleanCode = (lab.code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanCode) {
      const matchByCode = existingTitles.find(t => {
        if (t.toLowerCase().includes('summary') || t.toLowerCase() === 'sheet2') return false;
        const cleanT = t.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanT.includes(cleanCode) || cleanCode.includes(cleanT);
      });
      if (matchByCode) return matchByCode;
    }
    return null;
  }

  /**
   * Non-destructive, atomic update of Google Sheets data.
   * - Preserves title, metadata, and primary headers (Rows 1-6) on all lab sheets.
   * - Preserves title and header rows (Rows 1-4) on Summary Sheet.
   * - Updates ONLY the equipment rows starting from Row 7 onwards.
   * - Updates Summary Sheet rows A5:K{4 + labs.length}.
   * - Uses batchUpdate to perform ALL sheet updates in a single atomic Google Sheets API request.
   * - Clears only trailing rows (if any) via batchClear to prevent ghost records.
   * - NEVER touches or modifies Sheet2.
   */
  async updateAuditSheetsNonDestructive(labs = []) {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets is not configured in environment variables.');
    }

    const sheets = await this.getSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: this.sheetId });
    const existingTitles = (meta.data.sheets || []).map(s => s.properties.title);

    const valueDataEntries = [];
    const clearRanges = [];

    // 1. Summary Sheet update (Rows 5 to 4 + labs.length)
    const summaryTitle = existingTitles.find(t => t.toLowerCase().includes('summary')) || 'Summary Sheet';
    const summaryRows = [];

    labs.forEach((lab, idx) => {
      const tabTitle = this.findLabWorksheetTab(lab, existingTitles) || lab.sheetName || `${lab.code}(${lab.room})`;
      summaryRows.push([
        idx + 1,
        tabTitle,
        lab.code || '',
        lab.room || '',
        lab.inCharge || 'Not Specified',
        lab.assistant || 'Not Specified',
        '20',
        '20',
        String(lab.totalCount || (lab.systems ? lab.systems.length : 0)),
        String(lab.workingCount || 0),
        String(lab.faultyCount || 0)
      ]);
    });

    if (summaryRows.length > 0) {
      valueDataEntries.push({
        range: `'${summaryTitle}'!A5:K${4 + summaryRows.length}`,
        values: summaryRows
      });
    }

    // 2. Individual Lab Sheets update
    for (const lab of labs) {
      const targetTitle = this.findLabWorksheetTab(lab, existingTitles);
      if (!targetTitle) {
        console.warn(`[GoogleSheets] Could not resolve existing sheet for lab ${lab.code} (${lab.room}). Skipping.`);
        continue;
      }

      const systems = lab.systems || [];
      const labRows = systems.map((item, index) => [
        item.srNo ?? (index + 1),
        item.centralDeadStockNo || '-',
        item.deptDeadStockNo || '-',
        item.labDeadStockNo || '-',
        item.supplier || 'Not Specified',
        item.itemType || 'Desktop PC',
        item.systemName || item.monitorSerial || `System ${index + 1}`,
        item.monitorSerial || '-',
        item.monitorStatus || (item.status === 'Working' ? 'YES' : 'NO'),
        item.cpuSerial || '-',
        item.cpuStatus || (item.status === 'Working' ? 'YES' : 'NO'),
        item.purchaseDate || '-',
        item.remarks || ''
      ]);

      if (labRows.length > 0) {
        const startRow = 7;
        const endRow = startRow + labRows.length - 1;
        valueDataEntries.push({
          range: `'${targetTitle}'!A${startRow}:M${endRow}`,
          values: labRows
        });

        // Clear trailing rows if existing content had more rows (up to row 100)
        const trailingStart = endRow + 1;
        if (trailingStart <= 100) {
          clearRanges.push(`'${targetTitle}'!A${trailingStart}:M100`);
        }
      }
    }

    console.log(`[GoogleSheets] Executing atomic batchUpdate for ${valueDataEntries.length} ranges across Google Sheet (${this.sheetId})...`);

    // Execute atomic batch update for all values
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: this.sheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: valueDataEntries
      }
    });

    // If any trailing ranges need clearing, clear them in a single batch
    if (clearRanges.length > 0) {
      try {
        await sheets.spreadsheets.values.batchClear({
          spreadsheetId: this.sheetId,
          requestBody: {
            ranges: clearRanges
          }
        });
      } catch (clearErr) {
        console.warn('[GoogleSheets] Non-critical warning clearing trailing ranges:', clearErr.message);
      }
    }

    console.log('[GoogleSheets] ✓ Atomic non-destructive batch update completed successfully.');
    return {
      success: true,
      updatedRangesCount: valueDataEntries.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Sync complete cached audit data to Google Sheets using atomic non-destructive batch update
   */
  async syncWorkbookToGoogleSheets(cachedData) {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets is not configured in environment variables.');
    }

    const { labs = [] } = cachedData || {};
    console.log(`[GoogleSheets] Beginning non-destructive sync to Google Sheet (${this.sheetId})...`);

    const result = await this.updateAuditSheetsNonDestructive(labs);
    return {
      success: true,
      sheetId: this.sheetId,
      syncedAt: result.timestamp
    };
  }

  /**
   * Update a specific lab sheet non-destructively in Google Sheets
   */
  async updateLabSheet(lab) {
    if (!this.isConfigured()) {
      throw new Error('Google Sheets is not configured.');
    }

    const sheets = await this.getSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: this.sheetId });
    const existingTitles = (meta.data.sheets || []).map(s => s.properties.title);
    const targetTitle = this.findLabWorksheetTab(lab, existingTitles);

    if (!targetTitle) {
      throw new Error(`Could not locate worksheet tab in Google Sheets for lab ${lab.code}`);
    }

    const systems = lab.systems || [];
    const labRows = systems.map((item, index) => [
      item.srNo ?? (index + 1),
      item.centralDeadStockNo || '-',
      item.deptDeadStockNo || '-',
      item.labDeadStockNo || '-',
      item.supplier || 'Not Specified',
      item.itemType || 'Desktop PC',
      item.systemName || item.monitorSerial || `System ${index + 1}`,
      item.monitorSerial || '-',
      item.monitorStatus || (item.status === 'Working' ? 'YES' : 'NO'),
      item.cpuSerial || '-',
      item.cpuStatus || (item.status === 'Working' ? 'YES' : 'NO'),
      item.purchaseDate || '-',
      item.remarks || ''
    ]);

    const startRow = 7;
    const endRow = startRow + labRows.length - 1;

    await sheets.spreadsheets.values.update({
      spreadsheetId: this.sheetId,
      range: `'${targetTitle}'!A${startRow}:M${endRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: labRows
      }
    });

    if (endRow + 1 <= 100) {
      try {
        await sheets.spreadsheets.values.clear({
          spreadsheetId: this.sheetId,
          range: `'${targetTitle}'!A${endRow + 1}:M100`
        });
      } catch (_) {}
    }

    return {
      success: true,
      sheetName: targetTitle,
      updatedAt: new Date().toISOString()
    };
  }
}

module.exports = new GoogleSheetsService();
