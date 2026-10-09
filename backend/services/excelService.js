const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const googleSheetsService = require('./googleSheetsService');

class ExcelService {
  constructor() {
    this.excelFilePath = path.join(__dirname, '..', 'data', 'AI&DS Lab Audit sheet 2026-27.xlsx');
    this.cachedData = null;
    this.lastSynced = null;
  }

  getFilePath() {
    return this.excelFilePath;
  }

  cleanCell(cell) {
    if (!cell || cell.value === null || cell.value === undefined) return '';
    if (typeof cell.value === 'object') {
      if (cell.value.result !== undefined) return String(cell.value.result).trim();
      if (cell.value.richText) return cell.value.richText.map(t => t.text).join('').trim();
      if (cell.value.text) return String(cell.value.text).trim();
    }
    return String(cell.value).trim();
  }

  isFaultyValue(val) {
    if (!val) return false;
    const s = String(val).trim();
    if (!s) return false;
    return /\b(no|false|defective|faulty|not working|down|damaged|dead|broken|repair|failure|defect)\b/i.test(s);
  }

  /**
   * Recalculate all metrics and KPIs across all laboratories
   */
  recalculateMetrics() {
    if (!this.cachedData || !this.cachedData.labs) return;

    let totalComputers = 0;
    let totalWorking = 0;
    let totalFaulty = 0;
    const recentIssues = [];
    const supplierCounts = {};

    this.cachedData.labs.forEach((lab) => {
      let labWorking = 0;
      let labFaulty = 0;

      (lab.systems || []).forEach((sys, idx) => {
        // Ensure id exists
        if (!sys.id) {
          sys.id = `${lab.id}-${idx + 1}-${Date.now()}`;
        }

        const isMonFaulty = this.isFaultyValue(sys.monitorStatus);
        const isCpuFaulty = this.isFaultyValue(sys.cpuStatus);
        const isRemarkFaulty = this.isFaultyValue(sys.remarks);

        const isFaulty = sys.status === 'Faulty' || isMonFaulty || isCpuFaulty || isRemarkFaulty;
        sys.status = isFaulty ? 'Faulty' : 'Working';

        // Dead stock formatted
        if (!sys.deadStockNo || sys.deadStockNo === '-') {
          if (sys.centralDeadStockNo || sys.deptDeadStockNo || sys.labDeadStockNo) {
            sys.deadStockNo = `CDS: ${sys.centralDeadStockNo || '-'} | DDS: ${sys.deptDeadStockNo || '-'} | LDS: ${sys.labDeadStockNo || '-'}`;
          }
        }

        if (isFaulty) {
          labFaulty++;
          recentIssues.push({
            ...sys,
            labName: lab.name,
            labCode: lab.code,
            roomNo: lab.room
          });
        } else {
          labWorking++;
        }

        const supplier = sys.supplier || 'Not Specified';
        if (supplier && supplier !== 'Not Specified') {
          supplierCounts[supplier] = (supplierCounts[supplier] || 0) + 1;
        }
      });

      const totalLabSystems = (lab.systems || []).length;
      const healthPct = totalLabSystems > 0 ? ((labWorking / totalLabSystems) * 100).toFixed(1) : '100.0';

      lab.totalCount = totalLabSystems;
      lab.workingCount = labWorking;
      lab.faultyCount = labFaulty;
      lab.healthPercentage = parseFloat(healthPct);

      totalComputers += totalLabSystems;
      totalWorking += labWorking;
      totalFaulty += labFaulty;
    });

    const workingPct = totalComputers > 0 ? ((totalWorking / totalComputers) * 100).toFixed(1) : '100.0';

    this.lastSynced = new Date().toISOString();
    this.cachedData.summary = {
      totalLabs: this.cachedData.labs.length,
      totalComputers: totalComputers,
      workingComputers: totalWorking,
      faultyComputers: totalFaulty,
      workingPercentage: parseFloat(workingPct),
      equipmentIssues: totalFaulty,
      lastSynced: this.lastSynced
    };
    this.cachedData.recentIssues = recentIssues;
    this.cachedData.supplierCounts = supplierCounts;

    return this.cachedData;
  }

  /**
   * Parse audit workbook from disk (or buffer)
   */
  async readAuditWorkbook(buffer = null) {
    const workbook = new ExcelJS.Workbook();
    if (buffer) {
      const safeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
      try {
        await workbook.xlsx.load(safeBuffer);
      } catch (loadErr) {
        const { Readable } = require('stream');
        const readable = new Readable();
        readable.push(safeBuffer);
        readable.push(null);
        await workbook.xlsx.read(readable);
      }
    } else {
      if (!fs.existsSync(this.excelFilePath)) {
        throw new Error(`Excel audit file not found at: ${this.excelFilePath}`);
      }
      await workbook.xlsx.readFile(this.excelFilePath);
    }

    const labs = [];

    workbook.eachSheet((worksheet) => {
      const sheetName = worksheet.name.trim();

      if (sheetName.toLowerCase().includes('summary') || sheetName.toLowerCase().startsWith('sheet')) {
        return;
      }

      let labName = sheetName;
      let roomNo = '';
      let labInCharge = 'Not Specified';
      let labAssistant = 'Not Specified';
      let labCost = 'N/A';
      let labArea = 'N/A';
      let labOS = 'N/A';
      let labTools = 'N/A';
      let labHardware = 'N/A';
      let labBrowsers = 'N/A';
      let labMisc = 'N/A';

      worksheet.eachRow((row) => {
        row.eachCell((cell, colIdx) => {
          const val = this.cleanCell(cell);
          if (/room\s*(number|no\.?|#)?\s*:/i.test(val)) {
            const nextCell = row.getCell(colIdx + 1);
            if (nextCell && this.cleanCell(nextCell)) roomNo = this.cleanCell(nextCell);
          } else if (/lab(oratory)?\s*in-?charge\s*:/i.test(val)) {
            const nextCell = row.getCell(colIdx + 1);
            if (nextCell && this.cleanCell(nextCell)) labInCharge = this.cleanCell(nextCell);
          } else if (/lab(oratory)?\s*assistant\s*:/i.test(val)) {
            const nextCell = row.getCell(colIdx + 1);
            if (nextCell && this.cleanCell(nextCell)) labAssistant = this.cleanCell(nextCell);
          } else if (/lab(oratory)?\s*name\s*:/i.test(val)) {
            const nextCell = row.getCell(colIdx + 1);
            if (nextCell && this.cleanCell(nextCell)) labName = this.cleanCell(nextCell);
          } else if (/lab(oratory)?\s*cost\s*:/i.test(val)) {
            const nextCell = row.getCell(colIdx + 1);
            if (nextCell && this.cleanCell(nextCell)) labCost = this.cleanCell(nextCell);
          } else if (/area\s*of\s*laboratory/i.test(val)) {
            const nextCell = row.getCell(colIdx + 1);
            if (nextCell && this.cleanCell(nextCell)) labArea = this.cleanCell(nextCell);
          } else if (/operating\s*system/i.test(val)) {
            const nextCell = row.getCell(colIdx + 1);
            if (nextCell && this.cleanCell(nextCell)) labOS = this.cleanCell(nextCell);
          } else if (/programming\s*tools/i.test(val)) {
            const nextCell = row.getCell(colIdx + 1);
            if (nextCell && this.cleanCell(nextCell)) labTools = this.cleanCell(nextCell);
          } else if (/hardware\s*configuration/i.test(val)) {
            const nextCell = row.getCell(colIdx + 1);
            if (nextCell && this.cleanCell(nextCell)) labHardware = this.cleanCell(nextCell);
          } else if (/browsers/i.test(val)) {
            const nextCell = row.getCell(colIdx + 1);
            if (nextCell && this.cleanCell(nextCell)) labBrowsers = this.cleanCell(nextCell);
          } else if (/misc/i.test(val)) {
            const nextCell = row.getCell(colIdx + 1);
            if (nextCell && this.cleanCell(nextCell)) labMisc = this.cleanCell(nextCell);
          }
        });
      });

      if (!roomNo) {
        const roomMatch = sheetName.match(/room\s*(\d+)/i) || sheetName.match(/(\d{3})/);
        if (roomMatch) roomNo = roomMatch[1];
      }

      // Lab Code discovery
      let labCode = 'LAB';
      let labId = 'lab';

      if (sheetName.includes('CL-II') || sheetName.includes('AR') || sheetName.includes('234')) {
        labCode = 'AR/VR';
        labId = 'ar-vr';
      } else if (sheetName.includes('SWL') || sheetName.includes('202')) {
        labCode = 'SWL';
        labId = 'swl';
      } else if (sheetName.includes('DSL') || sheetName.includes('235')) {
        labCode = 'DSL';
        labId = 'dsl';
      } else if (sheetName.includes('AIL') || sheetName.includes('236')) {
        labCode = 'AIL';
        labId = 'ail';
      } else if (sheetName.includes('OSL') || sheetName.includes('238')) {
        labCode = 'OSL';
        labId = 'osl';
      } else if (sheetName.includes('PL') || sheetName.includes('239')) {
        labCode = 'PL';
        labId = 'pl';
      } else {
        labCode = sheetName.split('-')[0].trim();
        labId = labCode.toLowerCase().replace('/', '-');
      }

      let headerRowIndex = -1;
      let columnMap = {};

      worksheet.eachRow((row, rowNumber) => {
        if (headerRowIndex !== -1) return;

        let cellTexts = [];
        row.eachCell({ includeEmpty: false }, (cell) => {
          cellTexts.push(this.cleanCell(cell).toLowerCase());
        });

        const rowStr = cellTexts.join(' ');
        const hasSr = rowStr.includes('sr') || rowStr.includes('s.no') || rowStr.includes('sr.');
        const hasDeadStock = rowStr.includes('dead stock');
        const hasParticulars = rowStr.includes('particulars') || rowStr.includes('items types') || rowStr.includes('supplier');

        if (rowNumber >= 5 && (hasSr || hasDeadStock || hasParticulars) && cellTexts.length >= 4) {
          headerRowIndex = rowNumber;

          row.eachCell((cell, colIdx) => {
            const label = this.cleanCell(cell).toLowerCase();
            if ((label.includes('sr') || label.includes('s.no') || label.includes('sr.')) && !columnMap.srNo) {
              columnMap.srNo = colIdx;
            } else if (label.includes('central') && !columnMap.centralDeadStock) {
              columnMap.centralDeadStock = colIdx;
            } else if (label.includes('departmental') && !columnMap.deptDeadStock) {
              columnMap.deptDeadStock = colIdx;
            } else if (label.includes('lab dead') && !columnMap.labDeadStock) {
              columnMap.labDeadStock = colIdx;
            } else if (label.includes('supplier') && !columnMap.supplier) {
              columnMap.supplier = colIdx;
            } else if (label.includes('type') && !columnMap.itemType) {
              columnMap.itemType = colIdx;
            } else if (label.includes('particular') && !columnMap.systemName) {
              columnMap.systemName = colIdx;
            } else if (label.includes('monitor') && !columnMap.monitorSerial) {
              columnMap.monitorSerial = colIdx;
            } else if (label.includes('working') && !columnMap.monitorStatus) {
              columnMap.monitorStatus = colIdx;
            } else if (label.includes('cpu') && !columnMap.cpuSerial) {
              columnMap.cpuSerial = colIdx;
            } else if (label.includes('date') && !columnMap.purchaseDate) {
              columnMap.purchaseDate = colIdx;
            } else if (label.includes('remark') && !columnMap.remarks) {
              columnMap.remarks = colIdx;
            }
          });
        }
      });

      if (headerRowIndex === -1) {
        headerRowIndex = 6;
        columnMap = {
          srNo: 1,
          centralDeadStock: 2,
          deptDeadStock: 3,
          labDeadStock: 4,
          supplier: 5,
          itemType: 6,
          systemName: 7,
          monitorSerial: 8,
          monitorStatus: 9,
          cpuSerial: 10,
          cpuStatus: 11,
          purchaseDate: 12,
          remarks: 13
        };
      }

      const systems = [];

      for (let r = headerRowIndex + 1; r <= worksheet.rowCount; r++) {
        const row = worksheet.getRow(r);
        const srVal = this.cleanCell(row.getCell(columnMap.srNo || 1));
        const sysVal = this.cleanCell(row.getCell(columnMap.systemName || 7));
        const monSNVal = this.cleanCell(row.getCell(columnMap.monitorSerial || 8));
        const supplierVal = this.cleanCell(row.getCell(columnMap.supplier || 5));
        const itemTypeVal = this.cleanCell(row.getCell(columnMap.itemType || 6));

        // Aggregate full text for this row
        let rowFullText = '';
        row.eachCell((cell) => {
          rowFullText += ' ' + this.cleanCell(cell).toLowerCase();
        });

        // 1. Check for Specifications / Footer section or totals -> STOP parsing equipment
        const isFooter = /laboratory information|area of laboratory|operating system|programming tools|hardware configuration|browsers|misc software/i.test(srVal) ||
                         rowFullText.includes('laboratory information & specifications') ||
                         /^total/i.test(srVal) || /^total/i.test(sysVal);
        if (isFooter) break;

        // 2. Check for Sub-header row (e.g. Row 7 with 'Monitor (s/n)', 'Working/ Not Working', etc.) -> SKIP
        const isSubHeader = !/^\d+$/.test(srVal) && (
          rowFullText.includes('monitor (s/n)') ||
          rowFullText.includes('working/ not working') ||
          rowFullText.includes('cpu (s/n)') ||
          rowFullText.includes('keyboard (s/n)')
        );
        if (isSubHeader) continue;

        // 3. Skip empty rows
        if (!srVal && !sysVal && !monSNVal && !supplierVal && !itemTypeVal) continue;

        const cdsVal = this.cleanCell(row.getCell(columnMap.centralDeadStock || 2));
        const ddsVal = this.cleanCell(row.getCell(columnMap.deptDeadStock || 3));
        const ldsVal = this.cleanCell(row.getCell(columnMap.labDeadStock || 4));

        let monStatus = '';
        let cpuSerial = '';
        let cpuStatus = '';
        let purchaseDateVal = '';
        let remarkVal = '';

        if (sheetName.includes('ARVR') || sheetName.includes('234') || sheetName.includes('DSL') || sheetName.includes('235')) {
          monStatus = this.cleanCell(row.getCell(8)) || this.cleanCell(row.getCell(9));
          cpuSerial = this.cleanCell(row.getCell(10));
          cpuStatus = this.cleanCell(row.getCell(11));
          purchaseDateVal = this.cleanCell(row.getCell(12));
          remarkVal = this.cleanCell(row.getCell(13));
        } else {
          monStatus = this.cleanCell(row.getCell(8));
          cpuSerial = this.cleanCell(row.getCell(9)) || this.cleanCell(row.getCell(10));
          cpuStatus = this.cleanCell(row.getCell(10)) || this.cleanCell(row.getCell(11));
          purchaseDateVal = this.cleanCell(row.getCell(12));
          remarkVal = this.cleanCell(row.getCell(13));
        }

        const isMonFaulty = this.isFaultyValue(monStatus);
        const isCpuFaulty = this.isFaultyValue(cpuStatus);
        const isRemarkFaulty = this.isFaultyValue(remarkVal);
        const isFaulty = isMonFaulty || isCpuFaulty || isRemarkFaulty;

        let formattedDSN = '-';
        if (cdsVal || ddsVal || ldsVal) {
          formattedDSN = `CDS: ${cdsVal || '-'} | DDS: ${ddsVal || '-'} | LDS: ${ldsVal || '-'}`;
        }

        const systemItem = {
          id: `${labId}-${r}`,
          srNo: parseInt(srVal) || systems.length + 1,
          labCode: labCode,
          labSheet: sheetName,
          roomNo: roomNo,
          itemType: itemTypeVal || 'Desktop PC',
          systemName: sysVal || monSNVal || `SYS-${labCode}-${String(systems.length + 1).padStart(2, '0')}`,
          monitorSerial: monSNVal || 'N/A',
          monitorStatus: monStatus || 'YES',
          cpuSerial: cpuSerial || 'N/A',
          cpuStatus: cpuStatus || 'YES',
          status: isFaulty ? 'Faulty' : 'Working',
          deadStockNo: formattedDSN,
          centralDeadStockNo: cdsVal || '-',
          deptDeadStockNo: ddsVal || '-',
          labDeadStockNo: ldsVal || '-',
          supplier: supplierVal || 'Not Specified',
          purchaseDate: purchaseDateVal || '-',
          remarks: remarkVal
        };

        systems.push(systemItem);
      }

      labs.push({
        id: labId,
        code: labCode,
        name: labName || `${labCode} Laboratory`,
        sheetName: sheetName,
        room: roomNo || '234',
        inCharge: labInCharge,
        assistant: labAssistant,
        cost: labCost,
        area: labArea,
        os: labOS,
        tools: labTools,
        hardware: labHardware,
        browsers: labBrowsers,
        misc: labMisc,
        systems: systems
      });
    });

    this.cachedData = {
      labs: labs,
      summary: {},
      recentIssues: [],
      supplierCounts: {}
    };

    this.recalculateMetrics();
    return this.cachedData;
  }

  /**
   * Save the current cached data to local Excel file
   */
  async saveToLocalExcelFile() {
    if (!this.cachedData || !this.cachedData.labs) return;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AI&DS Laboratory Audit System';
    workbook.created = new Date();

    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    const headerFont = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    const titleFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
    const titleFont = { name: 'Calibri', size: 12, bold: true, color: { argb: 'F8FAFC' } };

    // 1. Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.views = [{ showGridLines: true }];
    summarySheet.mergeCells('A1:K1');
    summarySheet.getCell('A1').value = "SNJB'S LATE SAU. KANTABAI BHAVARLALJI JAIN COLLEGE OF ENGINEERING, CHANDWAD";
    summarySheet.getCell('A1').font = titleFont;
    summarySheet.getCell('A1').fill = titleFill;
    summarySheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    summarySheet.mergeCells('A2:K2');
    summarySheet.getCell('A2').value = "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE DEPARTMENT - LAB AUDIT REPORT 2026-27";
    summarySheet.getCell('A2').font = { name: 'Calibri', size: 11, bold: true, color: { argb: '334155' } };
    summarySheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

    const summaryHeaders = ['Sr. No.', 'Lab Name', 'Code', 'Room', 'Lab In-Charge', 'Lab Assistant', 'Dept Dead Stock', 'Lab Dead Stock', 'Available', 'Working', 'Not Working'];
    const sRow = summarySheet.getRow(4);
    sRow.values = summaryHeaders;
    sRow.height = 25;
    summaryHeaders.forEach((_, idx) => {
      const c = sRow.getCell(idx + 1);
      c.fill = headerFill;
      c.font = headerFont;
      c.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    this.cachedData.labs.forEach((lab, i) => {
      const row = summarySheet.getRow(5 + i);
      row.values = [
        i + 1,
        lab.name,
        lab.code,
        lab.room,
        lab.inCharge,
        lab.assistant,
        20,
        20,
        lab.totalCount,
        lab.workingCount,
        lab.faultyCount
      ];
      row.height = 22;
    });

    // 2. Individual Lab sheets
    this.cachedData.labs.forEach((lab) => {
      const sheet = workbook.addWorksheet(lab.sheetName || `${lab.code} - Room ${lab.room}`);
      sheet.views = [{ showGridLines: true }];

      sheet.mergeCells('A1:M1');
      const title = sheet.getCell('A1');
      title.value = `SNJB'S LATE SAU. K. B. JAIN COLLEGE OF ENGINEERING - ${(lab.name || '').toUpperCase()} (ROOM ${lab.room})`;
      title.font = titleFont;
      title.fill = titleFill;
      title.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 28;

      sheet.getRow(3).values = ['Laboratory Name:', lab.name, '', 'Room Number:', lab.room, '', 'Lab In-Charge:', lab.inCharge];
      sheet.getRow(4).values = ['Department:', 'AI & DS', '', 'Lab Cost:', lab.cost, '', 'Lab Assistant:', lab.assistant];

      const labHeaders = [
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

      const hRow = sheet.getRow(6);
      hRow.values = labHeaders;
      hRow.height = 25;
      labHeaders.forEach((_, idx) => {
        const c = hRow.getCell(idx + 1);
        c.fill = headerFill;
        c.font = headerFont;
        c.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      (lab.systems || []).forEach((item, idx) => {
        const row = sheet.getRow(7 + idx);
        row.values = [
          item.srNo,
          item.centralDeadStockNo,
          item.deptDeadStockNo,
          item.labDeadStockNo,
          item.supplier,
          item.itemType,
          item.systemName,
          item.monitorSerial,
          item.monitorStatus,
          item.cpuSerial,
          item.cpuStatus,
          item.purchaseDate,
          item.remarks
        ];
        row.height = 20;
      });

      const metaStartRow = 9 + (lab.systems || []).length;
      sheet.mergeCells(`A${metaStartRow}:M${metaStartRow}`);
      const metaTitle = sheet.getCell(`A${metaStartRow}`);
      metaTitle.value = `LABORATORY INFORMATION & SPECIFICATIONS - ${(lab.name || '').toUpperCase()}`;
      metaTitle.font = { name: 'Calibri', size: 11, bold: true, color: { argb: '1E293B' } };

      const specRows = [
        ['Area of Laboratory:', lab.area || 'N/A'],
        ['Operating System:', lab.os || 'N/A'],
        ['Programming Tools:', lab.tools || 'N/A'],
        ['Browsers:', lab.browsers || 'N/A'],
        ['Misc Software:', lab.misc || 'N/A'],
        ['Hardware Configuration:', lab.hardware || 'N/A']
      ];

      specRows.forEach((sr, idx) => {
        const row = sheet.getRow(metaStartRow + 1 + idx);
        row.values = [sr[0], sr[1]];
      });
    });

    try {
      await workbook.xlsx.writeFile(this.excelFilePath);
      console.log(`[ExcelService] Local audit workbook saved: ${this.excelFilePath}`);
    } catch (err) {
      console.error('[ExcelService] Warning: Could not write local Excel file (may be locked or ephemeral):', err.message);
    }
  }

  async getData() {
    if (!this.cachedData) {
      await this.readAuditWorkbook();
    }
    return this.cachedData;
  }

  async getSummary() {
    const data = await this.getData();
    return {
      ...data.summary,
      labStatus: data.labs.map(l => ({
        id: l.id,
        code: l.code,
        name: l.name,
        room: l.room,
        inCharge: l.inCharge,
        assistant: l.assistant,
        cost: l.cost,
        area: l.area,
        total: l.totalCount,
        working: l.workingCount,
        faulty: l.faultyCount,
        healthPercentage: l.healthPercentage
      })),
      recentIssues: data.recentIssues
    };
  }

  async getLabs() {
    const data = await this.getData();
    return data.labs.map(l => ({
      id: l.id,
      code: l.code,
      name: l.name,
      sheetName: l.sheetName,
      room: l.room,
      inCharge: l.inCharge,
      assistant: l.assistant,
      cost: l.cost,
      area: l.area,
      totalCount: l.totalCount,
      workingCount: l.workingCount,
      faultyCount: l.faultyCount,
      healthPercentage: l.healthPercentage
    }));
  }

  async getLabById(id) {
    const data = await this.getData();
    const searchId = id.toLowerCase().replace('/', '-');

    const lab = data.labs.find(l => 
      l.id === searchId || 
      l.code.toLowerCase().replace('/', '-') === searchId ||
      (searchId.includes('ar') && l.id.includes('ar')) ||
      (searchId.includes('cl') && l.id.includes('ar')) ||
      (searchId.includes('ar') && l.id.includes('cl'))
    );
    if (!lab) return null;
    return lab;
  }

  async getEquipment(query = {}) {
    const data = await this.getData();
    let allEquipment = [];

    data.labs.forEach(lab => {
      lab.systems.forEach(sys => {
        allEquipment.push({
          ...sys,
          labName: lab.name,
          roomNo: lab.room
        });
      });
    });

    const { search, status, labId, supplier, sortBy = 'srNo', sortOrder = 'asc' } = query;
    let filtered = allEquipment;

    if (labId) {
      const searchLab = labId.toLowerCase().replace('/', '-');
      filtered = filtered.filter(item => 
        item.labCode.toLowerCase().replace('/', '-').includes(searchLab) || 
        item.labSheet.toLowerCase().includes(searchLab) ||
        (searchLab.includes('ar') && item.labCode.toLowerCase().includes('cl')) ||
        (searchLab.includes('cl') && item.labCode.toLowerCase().includes('ar'))
      );
    }

    if (status && status !== 'all') {
      filtered = filtered.filter(item => item.status.toLowerCase() === status.toLowerCase());
    }

    if (supplier && supplier !== 'all') {
      filtered = filtered.filter(item => item.supplier.toLowerCase().includes(supplier.toLowerCase()));
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(item => 
        item.systemName.toLowerCase().includes(term) ||
        item.monitorSerial.toLowerCase().includes(term) ||
        item.cpuSerial.toLowerCase().includes(term) ||
        item.deadStockNo.toLowerCase().includes(term) ||
        item.supplier.toLowerCase().includes(term) ||
        item.itemType.toLowerCase().includes(term) ||
        item.remarks.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return {
      total: filtered.length,
      items: filtered
    };
  }

  // ================= ADMIN PERSISTENCE OPERATIONS =================

  /**
   * Persist a laboratory update to Google Sheets (and local file)
   */
  async persistLabUpdate(lab) {
    let cloudSynced = false;
    let cloudError = null;

    if (googleSheetsService.isConfigured()) {
      try {
        console.log(`[ExcelService] Saving lab "${lab.code}" changes to Google Sheets...`);
        await googleSheetsService.updateLabSheet(lab);
        cloudSynced = true;
      } catch (err) {
        console.error('[ExcelService] Google Sheets API update failed:', err.message);
        cloudError = err.message;
        throw new Error(`Google Sheets API error: ${err.message}`);
      }
    } else {
      console.warn('[ExcelService] Google Sheets is not configured. Falling back to local file persistence.');
    }

    // Save to local file as complementary backup
    await this.saveToLocalExcelFile();

    return {
      cloudSynced,
      cloudError
    };
  }

  /**
   * Persist entire workbook to Google Sheets (and local file)
   */
  async persistFullWorkbook() {
    let cloudSynced = false;
    let cloudError = null;

    if (googleSheetsService.isConfigured()) {
      try {
        console.log('[ExcelService] Syncing full workbook to Google Sheets...');
        await googleSheetsService.syncWorkbookToGoogleSheets(this.cachedData);
        cloudSynced = true;
      } catch (err) {
        console.error('[ExcelService] Google Sheets full sync failed:', err.message);
        cloudError = err.message;
        throw new Error(`Google Sheets sync error: ${err.message}`);
      }
    }

    await this.saveToLocalExcelFile();
    return { cloudSynced, cloudError };
  }

  /**
   * Update a single equipment record
   */
  async updateRecord(recordId, updatedFields) {
    const data = await this.getData();
    let found = false;
    let targetLab = null;

    for (const lab of data.labs) {
      const idx = lab.systems.findIndex(s => s.id === recordId);
      if (idx !== -1) {
        lab.systems[idx] = {
          ...lab.systems[idx],
          ...updatedFields
        };
        targetLab = lab;
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Record with ID '${recordId}' not found.`);
    }

    // 1. Recalculate metrics
    this.recalculateMetrics();

    // 2. Persist to Google Sheets & local file
    const persistResult = await this.persistLabUpdate(targetLab);

    return {
      success: true,
      lab: targetLab,
      summary: this.cachedData.summary,
      ...persistResult
    };
  }

  /**
   * Add a new equipment record to a specific lab
   */
  async addRecord(labId, recordData) {
    const data = await this.getData();
    const lab = await this.getLabById(labId);
    if (!lab) {
      throw new Error(`Laboratory '${labId}' not found.`);
    }

    const newSrNo = (lab.systems.length > 0) 
      ? Math.max(...lab.systems.map(s => parseInt(s.srNo) || 0)) + 1 
      : 1;

    const newId = `${lab.id}-${Date.now()}`;
    const newRecord = {
      id: newId,
      srNo: recordData.srNo || newSrNo,
      labCode: lab.code,
      labSheet: lab.sheetName,
      roomNo: lab.room,
      itemType: recordData.itemType || 'Desktop PC',
      systemName: recordData.systemName || `SYS-${lab.code}-${String(newSrNo).padStart(2, '0')}`,
      monitorSerial: recordData.monitorSerial || 'N/A',
      monitorStatus: recordData.monitorStatus || 'YES',
      cpuSerial: recordData.cpuSerial || 'N/A',
      cpuStatus: recordData.cpuStatus || 'YES',
      status: recordData.status || (recordData.monitorStatus === 'NO' || recordData.cpuStatus === 'NO' ? 'Faulty' : 'Working'),
      deadStockNo: recordData.deadStockNo || '-',
      centralDeadStockNo: recordData.centralDeadStockNo || '-',
      deptDeadStockNo: recordData.deptDeadStockNo || '-',
      labDeadStockNo: recordData.labDeadStockNo || '-',
      supplier: recordData.supplier || 'Not Specified',
      purchaseDate: recordData.purchaseDate || '-',
      remarks: recordData.remarks || ''
    };

    lab.systems.push(newRecord);

    this.recalculateMetrics();
    const persistResult = await this.persistLabUpdate(lab);

    return {
      success: true,
      record: newRecord,
      lab: lab,
      summary: this.cachedData.summary,
      ...persistResult
    };
  }

  /**
   * Delete an equipment record by ID
   */
  async deleteRecord(recordId) {
    const data = await this.getData();
    let found = false;
    let targetLab = null;

    for (const lab of data.labs) {
      const idx = lab.systems.findIndex(s => s.id === recordId);
      if (idx !== -1) {
        lab.systems.splice(idx, 1);
        targetLab = lab;
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Record with ID '${recordId}' not found.`);
    }

    this.recalculateMetrics();
    const persistResult = await this.persistLabUpdate(targetLab);

    return {
      success: true,
      lab: targetLab,
      summary: this.cachedData.summary,
      ...persistResult
    };
  }

  /**
   * Update Laboratory Metadata (In-Charge, Room, Area, Cost, Specs)
   */
  async updateLabInfo(labId, updatedInfo) {
    const lab = await this.getLabById(labId);
    if (!lab) {
      throw new Error(`Laboratory '${labId}' not found.`);
    }

    if (updatedInfo.name !== undefined) lab.name = updatedInfo.name;
    if (updatedInfo.room !== undefined) {
      lab.room = updatedInfo.room;
      (lab.systems || []).forEach(s => s.roomNo = updatedInfo.room);
    }
    if (updatedInfo.inCharge !== undefined) lab.inCharge = updatedInfo.inCharge;
    if (updatedInfo.assistant !== undefined) lab.assistant = updatedInfo.assistant;
    if (updatedInfo.cost !== undefined) lab.cost = updatedInfo.cost;
    if (updatedInfo.area !== undefined) lab.area = updatedInfo.area;
    if (updatedInfo.os !== undefined) lab.os = updatedInfo.os;
    if (updatedInfo.tools !== undefined) lab.tools = updatedInfo.tools;
    if (updatedInfo.hardware !== undefined) lab.hardware = updatedInfo.hardware;
    if (updatedInfo.browsers !== undefined) lab.browsers = updatedInfo.browsers;
    if (updatedInfo.misc !== undefined) lab.misc = updatedInfo.misc;

    this.recalculateMetrics();
    const persistResult = await this.persistLabUpdate(lab);

    return {
      success: true,
      lab: lab,
      summary: this.cachedData.summary,
      ...persistResult
    };
  }

  /**
   * Batch save modified records and lab info for a laboratory
   */
  async batchSaveLab(labId, records, labInfo) {
    const lab = await this.getLabById(labId);
    if (!lab) {
      throw new Error(`Laboratory '${labId}' not found.`);
    }

    if (Array.isArray(records)) {
      lab.systems = records.map((r, idx) => ({
        ...r,
        id: r.id || `${lab.id}-${idx + 1}-${Date.now()}`,
        labCode: lab.code,
        labSheet: lab.sheetName,
        roomNo: lab.room
      }));
    }

    if (labInfo && typeof labInfo === 'object') {
      if (labInfo.name) lab.name = labInfo.name;
      if (labInfo.room) {
        lab.room = labInfo.room;
        lab.systems.forEach(s => s.roomNo = labInfo.room);
      }
      if (labInfo.inCharge) lab.inCharge = labInfo.inCharge;
      if (labInfo.assistant) lab.assistant = labInfo.assistant;
      if (labInfo.cost) lab.cost = labInfo.cost;
      if (labInfo.area) lab.area = labInfo.area;
      if (labInfo.os) lab.os = labInfo.os;
      if (labInfo.tools) lab.tools = labInfo.tools;
      if (labInfo.hardware) lab.hardware = labInfo.hardware;
      if (labInfo.browsers) lab.browsers = labInfo.browsers;
      if (labInfo.misc) lab.misc = labInfo.misc;
    }

    this.recalculateMetrics();
    const persistResult = await this.persistLabUpdate(lab);

    return {
      success: true,
      lab: lab,
      summary: this.cachedData.summary,
      ...persistResult
    };
  }

  /**
   * Validate and generate a preview of an uploaded Excel file without committing changes
   * to cachedData, Google Sheets, or local storage.
   */
  async validateAndPreviewExcel(buffer, originalname = '') {
    if (!buffer || buffer.length === 0) {
      throw new Error('Uploaded file is empty.');
    }

    const safeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const workbook = new ExcelJS.Workbook();
    try {
      try {
        await workbook.xlsx.load(safeBuffer);
      } catch (loadErr) {
        const { Readable } = require('stream');
        const readable = new Readable();
        readable.push(safeBuffer);
        readable.push(null);
        await workbook.xlsx.read(readable);
      }
    } catch (err) {
      throw new Error(`Invalid Excel workbook format: ${err.message || 'Unable to parse workbook'}`);
    }

    const worksheets = workbook.worksheets || [];
    if (worksheets.length === 0) {
      throw new Error('Workbook contains no worksheets.');
    }

    const validationErrors = [];
    const detectedLabs = [];
    let totalSystemsCount = 0;
    let totalWorkingCount = 0;
    let totalFaultyCount = 0;

    workbook.eachSheet((worksheet) => {
      const sheetName = worksheet.name.trim();
      if (
        sheetName.toLowerCase().includes('summary') || 
        sheetName.toLowerCase().startsWith('sheet')
      ) {
        return;
      }

      // Detect lab code
      let labCode = 'LAB';
      let labId = 'lab';

      if (sheetName.includes('CL-II') || sheetName.includes('AR') || sheetName.includes('234')) {
        labCode = 'AR/VR';
        labId = 'ar-vr';
      } else if (sheetName.includes('SWL') || sheetName.includes('202')) {
        labCode = 'SWL';
        labId = 'swl';
      } else if (sheetName.includes('DSL') || sheetName.includes('235')) {
        labCode = 'DSL';
        labId = 'dsl';
      } else if (sheetName.includes('AIL') || sheetName.includes('236')) {
        labCode = 'AIL';
        labId = 'ail';
      } else if (sheetName.includes('OSL') || sheetName.includes('238')) {
        labCode = 'OSL';
        labId = 'osl';
      } else if (sheetName.includes('PL') || sheetName.includes('239')) {
        labCode = 'PL';
        labId = 'pl';
      } else {
        labCode = sheetName.split('-')[0].trim();
        labId = labCode.toLowerCase().replace('/', '-');
      }

      // Check for table header row
      let headerRowIndex = -1;
      worksheet.eachRow((row, rowNumber) => {
        if (headerRowIndex !== -1) return;

        let cellTexts = [];
        row.eachCell({ includeEmpty: false }, (cell) => {
          cellTexts.push(this.cleanCell(cell).toLowerCase());
        });

        const rowStr = cellTexts.join(' ');
        const hasSr = rowStr.includes('sr') || rowStr.includes('s.no') || rowStr.includes('sr.');
        const hasParticulars = rowStr.includes('particular') || rowStr.includes('items types') || rowStr.includes('supplier');

        if (rowNumber >= 4 && (hasSr || hasParticulars) && cellTexts.length >= 3) {
          headerRowIndex = rowNumber;
        }
      });

      // Count data rows in sheet
      let sheetSystems = 0;
      let sheetWorking = 0;
      let sheetFaulty = 0;

      if (headerRowIndex !== -1) {
        for (let r = headerRowIndex + 1; r <= worksheet.rowCount; r++) {
          const row = worksheet.getRow(r);
          const val1 = this.cleanCell(row.getCell(1));
          const val7 = this.cleanCell(row.getCell(7));
          const val8 = this.cleanCell(row.getCell(8));

          // Aggregate full text for this row
          let rowFullText = '';
          row.eachCell((cell) => {
            rowFullText += ' ' + this.cleanCell(cell).toLowerCase();
          });

          // Check footer / specs
          if (
            /laboratory information|area of laboratory|operating system|programming tools|hardware configuration|browsers|misc software/i.test(val1) ||
            rowFullText.includes('laboratory information & specifications') ||
            /^total/i.test(val1) || /^total/i.test(val7)
          ) {
            break;
          }

          // Check sub-header row
          if (!/^\d+$/.test(val1)) {
            if (
              rowFullText.includes('monitor (s/n)') ||
              rowFullText.includes('working/ not working') ||
              rowFullText.includes('cpu (s/n)') ||
              rowFullText.includes('keyboard (s/n)')
            ) {
              continue;
            }
          }

          if (!val1 && !val7 && !val8) continue;

          sheetSystems++;

          let monStatus = '';
          let cpuStatus = '';
          let remarkVal = this.cleanCell(row.getCell(13));

          if (sheetName.includes('ARVR') || sheetName.includes('234') || sheetName.includes('DSL') || sheetName.includes('235')) {
            monStatus = this.cleanCell(row.getCell(8)) || this.cleanCell(row.getCell(9));
            cpuStatus = this.cleanCell(row.getCell(11));
          } else {
            monStatus = this.cleanCell(row.getCell(8));
            cpuStatus = this.cleanCell(row.getCell(10)) || this.cleanCell(row.getCell(11));
          }

          const isFaulty = this.isFaultyValue(monStatus) || this.isFaultyValue(cpuStatus) || this.isFaultyValue(remarkVal);
          if (isFaulty) {
            sheetFaulty++;
          } else {
            sheetWorking++;
          }
        }
      }

      detectedLabs.push({
        sheetName,
        code: labCode,
        id: labId,
        headerFound: headerRowIndex !== -1,
        systemsCount: sheetSystems,
        workingCount: sheetWorking,
        faultyCount: sheetFaulty
      });

      totalSystemsCount += sheetSystems;
      totalWorkingCount += sheetWorking;
      totalFaultyCount += sheetFaulty;
    });

    if (detectedLabs.length === 0) {
      validationErrors.push('No laboratory worksheets found in the workbook (only Summary or empty sheets).');
    }

    if (totalSystemsCount === 0) {
      validationErrors.push('No valid equipment records could be parsed. Check that header columns ("Sr NO", "Particulars", "Monitor", "CPU") exist.');
    }

    const knownCodes = ['SWL', 'AR/VR', 'DSL', 'AIL', 'OSL', 'PL'];
    const matchedKnownCodes = detectedLabs.filter(l => knownCodes.includes(l.code)).map(l => l.code);

    return {
      isValid: validationErrors.length === 0,
      validationErrors,
      fileName: originalname,
      fileSizeBytes: buffer.length,
      sheetsCount: workbook.worksheets.length,
      detectedLabsCount: detectedLabs.length,
      totalRecords: totalSystemsCount,
      workingRecords: totalWorkingCount,
      faultyRecords: totalFaultyCount,
      matchedKnownCodes,
      labs: detectedLabs,
      existingTotalRecords: (this.cachedData && this.cachedData.summary) ? this.cachedData.summary.totalComputers : 111
    };
  }

  /**
   * Import confirmed uploaded Excel buffer into persistent storage
   */
  async importUploadedExcel(buffer, originalname = '') {
    console.log(`[ExcelService] Processing confirmed Excel upload: "${originalname}" (${buffer.length} bytes)...`);

    // 1. Validate schema before altering any data
    const preview = await this.validateAndPreviewExcel(buffer, originalname);
    if (!preview.isValid) {
      throw new Error(`Validation failed: ${preview.validationErrors.join('; ')}`);
    }

    // 2. Parse uploaded workbook
    await this.readAuditWorkbook(buffer);

    // 3. Save to local backup file
    try {
      fs.writeFileSync(this.excelFilePath, buffer);
      console.log(`[ExcelService] Saved uploaded file to local disk: ${this.excelFilePath}`);
    } catch (err) {
      console.warn('[ExcelService] Warning: Could not write buffer directly to disk:', err.message);
    }

    // 4. Persist to Google Sheets if configured
    let persistResult = { cloudSynced: false };
    if (googleSheetsService.isConfigured()) {
      try {
        console.log('[ExcelService] Syncing imported workbook to Google Sheets...');
        persistResult = await this.persistFullWorkbook();
      } catch (err) {
        console.error('[ExcelService] Google Sheets sync failed on import:', err.message);
        throw new Error(`Google Sheets sync failed: ${err.message}`);
      }
    } else {
      console.warn('[ExcelService] Google Sheets not configured. Preserving local cache.');
    }

    return {
      success: true,
      summary: this.cachedData.summary,
      labsCount: this.cachedData.labs.length,
      ...persistResult
    };
  }

  /**
   * Synchronize the latest state from Google Sheets into memory and backup to local file.
   * Ensures that on Render restarts, any changes saved to Google Sheets are automatically restored.
   */
  async syncFromGoogleSheets() {
    if (!googleSheetsService.isConfigured()) {
      return null;
    }

    const allSheets = await googleSheetsService.readAllSheets();
    const sheetTitles = Object.keys(allSheets);

    if (sheetTitles.length === 0) {
      console.warn('[ExcelService] No sheets found in Google Sheets to sync.');
      return null;
    }

    const labs = [];

    for (const [sheetTitle, rows] of Object.entries(allSheets)) {
      if (
        sheetTitle.toLowerCase().includes('summary') || 
        sheetTitle.toLowerCase().startsWith('sheet') ||
        !rows || rows.length < 6
      ) {
        continue;
      }

      // Determine Lab Code & ID
      let labCode = 'LAB';
      let labId = 'lab';
      if (sheetTitle.includes('CL-II') || sheetTitle.includes('AR') || sheetTitle.includes('234')) {
        labCode = 'AR/VR';
        labId = 'ar-vr';
      } else if (sheetTitle.includes('SWL') || sheetTitle.includes('202')) {
        labCode = 'SWL';
        labId = 'swl';
      } else if (sheetTitle.includes('DSL') || sheetTitle.includes('235')) {
        labCode = 'DSL';
        labId = 'dsl';
      } else if (sheetTitle.includes('AIL') || sheetTitle.includes('236')) {
        labCode = 'AIL';
        labId = 'ail';
      } else if (sheetTitle.includes('OSL') || sheetTitle.includes('238')) {
        labCode = 'OSL';
        labId = 'osl';
      } else if (sheetTitle.includes('PL') || sheetTitle.includes('239')) {
        labCode = 'PL';
        labId = 'pl';
      } else {
        labCode = sheetTitle.split(/[- (]/)[0].trim();
        labId = labCode.toLowerCase().replace('/', '-');
      }

      let labName = `${labCode} Laboratory`;
      let roomNo = '';
      let labInCharge = 'Not Specified';
      let labAssistant = 'Not Specified';
      let labCost = 'N/A';
      let labArea = 'N/A';
      let labOS = 'N/A';
      let labTools = 'N/A';
      let labHardware = 'N/A';
      let labBrowsers = 'N/A';
      let labMisc = 'N/A';

      // Scan rows for metadata
      rows.forEach((row) => {
        if (!Array.isArray(row)) return;
        row.forEach((cellVal, colIdx) => {
          const val = String(cellVal || '').trim();
          if (/room\s*(number|no\.?|#)?\s*:/i.test(val)) {
            const nextVal = String(row[colIdx + 1] || '').trim();
            if (nextVal) roomNo = nextVal;
          } else if (/lab(oratory)?\s*in-?charge\s*:/i.test(val)) {
            const nextVal = String(row[colIdx + 1] || '').trim();
            if (nextVal) labInCharge = nextVal;
          } else if (/lab(oratory)?\s*assistant\s*:/i.test(val)) {
            const nextVal = String(row[colIdx + 1] || '').trim();
            if (nextVal) labAssistant = nextVal;
          } else if (/lab(oratory)?\s*name\s*:/i.test(val)) {
            const nextVal = String(row[colIdx + 1] || '').trim();
            if (nextVal) labName = nextVal;
          } else if (/lab(oratory)?\s*cost\s*:/i.test(val)) {
            const nextVal = String(row[colIdx + 1] || '').trim();
            if (nextVal) labCost = nextVal;
          } else if (/area\s*of\s*laboratory/i.test(val)) {
            const nextVal = String(row[colIdx + 1] || '').trim();
            if (nextVal) labArea = nextVal;
          } else if (/operating\s*system/i.test(val)) {
            const nextVal = String(row[colIdx + 1] || '').trim();
            if (nextVal) labOS = nextVal;
          } else if (/programming\s*tools/i.test(val)) {
            const nextVal = String(row[colIdx + 1] || '').trim();
            if (nextVal) labTools = nextVal;
          } else if (/hardware\s*configuration/i.test(val)) {
            const nextVal = String(row[colIdx + 1] || '').trim();
            if (nextVal) labHardware = nextVal;
          } else if (/browsers/i.test(val)) {
            const nextVal = String(row[colIdx + 1] || '').trim();
            if (nextVal) labBrowsers = nextVal;
          } else if (/misc/i.test(val)) {
            const nextVal = String(row[colIdx + 1] || '').trim();
            if (nextVal) labMisc = nextVal;
          }
        });
      });

      if (!roomNo) {
        const roomMatch = sheetTitle.match(/(\d{3})/);
        if (roomMatch) roomNo = roomMatch[1];
      }

      // Find Header row (Sr NO, Particulars, etc.)
      let headerRowIndex = -1;
      for (let r = 0; r < rows.length; r++) {
        const rowStr = (rows[r] || []).join(' ').toLowerCase();
        if ((rowStr.includes('sr') || rowStr.includes('s.no')) && (rowStr.includes('particular') || rowStr.includes('monitor') || rowStr.includes('item'))) {
          headerRowIndex = r;
          break;
        }
      }

      if (headerRowIndex === -1) {
        headerRowIndex = 5;
      }

      const systems = [];
      for (let r = headerRowIndex + 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const srVal = String(row[0] || '').trim();
        const sysVal = String(row[6] || '').trim();
        const monSNVal = String(row[7] || '').trim();
        const supplierVal = String(row[4] || '').trim();
        const itemTypeVal = String(row[5] || '').trim();

        const rowStr = row.join(' ').toLowerCase();

        // 1. Check for Specifications / Footer section or totals -> STOP
        const isFooter = /laboratory information|area of laboratory|operating system|programming tools|hardware configuration|browsers|misc software/i.test(srVal) ||
                         rowStr.includes('laboratory information & specifications') ||
                         /^total/i.test(srVal) || /^total/i.test(sysVal);
        if (isFooter) break;

        // 2. Check for Sub-header row -> SKIP
        const isSubHeader = !/^\d+$/.test(srVal) && (
          rowStr.includes('monitor (s/n)') ||
          rowStr.includes('working/ not working') ||
          rowStr.includes('cpu (s/n)') ||
          rowStr.includes('keyboard (s/n)')
        );
        if (isSubHeader) continue;

        // 3. Skip completely empty rows
        const hasAny = row.some(cell => String(cell || '').trim().length > 0);
        if (!hasAny || (!srVal && !supplierVal && !itemTypeVal && !sysVal)) continue;

        const cdsVal = String(row[1] || '').trim();
        const ddsVal = String(row[2] || '').trim();
        const ldsVal = String(row[3] || '').trim();

        let monStatus = '';
        let cpuSerial = '';
        let cpuStatus = '';
        let purchaseDateVal = '';
        let remarkVal = '';

        if (sheetTitle.includes('ARVR') || sheetTitle.includes('234') || sheetTitle.includes('DSL') || sheetTitle.includes('235')) {
          monStatus = String(row[7] || row[8] || '').trim();
          cpuSerial = String(row[9] || '').trim();
          cpuStatus = String(row[10] || '').trim();
          purchaseDateVal = String(row[11] || '').trim();
          remarkVal = String(row[12] || '').trim();
        } else {
          monStatus = String(row[7] || '').trim();
          cpuSerial = String(row[8] || row[9] || '').trim();
          cpuStatus = String(row[9] || row[10] || '').trim();
          purchaseDateVal = String(row[11] || '').trim();
          remarkVal = String(row[12] || '').trim();
        }

        const isMonFaulty = this.isFaultyValue(monStatus);
        const isCpuFaulty = this.isFaultyValue(cpuStatus);
        const isRemarkFaulty = this.isFaultyValue(remarkVal);
        const isFaulty = isMonFaulty || isCpuFaulty || isRemarkFaulty;

        let formattedDSN = '-';
        if (cdsVal || ddsVal || ldsVal) {
          formattedDSN = `CDS: ${cdsVal || '-'} | DDS: ${ddsVal || '-'} | LDS: ${ldsVal || '-'}`;
        }

        systems.push({
          id: `${labId}-${r + 1}`,
          srNo: parseInt(srVal) || systems.length + 1,
          labCode: labCode,
          labSheet: sheetTitle,
          roomNo: roomNo,
          itemType: itemTypeVal || 'Desktop PC',
          systemName: sysVal || monSNVal || `SYS-${labCode}-${String(systems.length + 1).padStart(2, '0')}`,
          monitorSerial: monSNVal || 'N/A',
          monitorStatus: monStatus || 'YES',
          cpuSerial: cpuSerial || 'N/A',
          cpuStatus: cpuStatus || 'YES',
          status: isFaulty ? 'Faulty' : 'Working',
          deadStockNo: formattedDSN,
          centralDeadStockNo: cdsVal || '-',
          deptDeadStockNo: ddsVal || '-',
          labDeadStockNo: ldsVal || '-',
          supplier: supplierVal || 'Not Specified',
          purchaseDate: purchaseDateVal || '-',
          remarks: remarkVal
        });
      }

      if (systems.length > 0) {
        labs.push({
          id: labId,
          code: labCode,
          name: labName,
          sheetName: sheetTitle,
          room: roomNo || '234',
          inCharge: labInCharge,
          assistant: labAssistant,
          cost: labCost,
          area: labArea,
          os: labOS,
          tools: labTools,
          hardware: labHardware,
          browsers: labBrowsers,
          misc: labMisc,
          systems: systems
        });
      }
    }

    if (labs.length > 0) {
      this.cachedData = {
        labs: labs,
        summary: {},
        recentIssues: [],
        supplierCounts: {}
      };
      this.recalculateMetrics();
      // Also backup to local file
      await this.saveToLocalExcelFile();
      console.log(`[ExcelService] Synced ${labs.length} laboratories and ${this.cachedData.summary.totalComputers} computers from Google Sheets.`);
    }

    return this.cachedData;
  }
}

module.exports = new ExcelService();
