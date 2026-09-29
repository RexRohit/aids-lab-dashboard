const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

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

  async readAuditWorkbook() {
    if (!fs.existsSync(this.excelFilePath)) {
      throw new Error(`Excel audit file not found at: ${this.excelFilePath}`);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.excelFilePath);

    const labs = [];
    const recentIssues = [];
    const supplierCounts = {};

    let totalComputers = 0;
    let totalWorking = 0;
    let totalFaulty = 0;

    workbook.eachSheet((worksheet) => {
      const sheetName = worksheet.name.trim();

      if (sheetName.toLowerCase().includes('summary')) {
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

      // Safe Lab Code discovery
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
      let labWorkingCount = 0;
      let labFaultyCount = 0;

      for (let r = headerRowIndex + 1; r <= worksheet.rowCount; r++) {
        const row = worksheet.getRow(r);
        const srVal = this.cleanCell(row.getCell(columnMap.srNo || 1));
        const sysVal = this.cleanCell(row.getCell(columnMap.systemName || 7));
        const monSNVal = this.cleanCell(row.getCell(columnMap.monitorSerial || 8));
        const supplierVal = this.cleanCell(row.getCell(columnMap.supplier || 5));
        const itemTypeVal = this.cleanCell(row.getCell(columnMap.itemType || 6));

        if (sysVal.toLowerCase().includes('laboratory information') || sysVal.toLowerCase().includes('area of laboratory')) break;
        if (!srVal && !sysVal && !monSNVal && !supplierVal && !itemTypeVal) continue;
        if (/total/i.test(srVal) || /total/i.test(sysVal)) break;

        const cdsVal = this.cleanCell(row.getCell(columnMap.centralDeadStock || 2));
        const ddsVal = this.cleanCell(row.getCell(columnMap.deptDeadStock || 3));
        const ldsVal = this.cleanCell(row.getCell(columnMap.labDeadStock || 4));

        const monStatus = this.cleanCell(row.getCell(columnMap.monitorStatus || 9));
        const cpuStatus = this.cleanCell(row.getCell(columnMap.cpuStatus || 11));

        const remarkVal = this.cleanCell(row.getCell(columnMap.remarks || 13));
        const purchaseDateVal = this.cleanCell(row.getCell(columnMap.purchaseDate || 12));

        const isMonFaulty = /no|false|defective|faulty|issue|not working/i.test(monStatus);
        const isCpuFaulty = /no|false|defective|faulty|issue|not working/i.test(cpuStatus);
        const isRemarkFaulty = /non-functional|faulty|damaged|not working|repair|failure|defect/i.test(remarkVal);

        const isFaulty = isMonFaulty || isCpuFaulty || isRemarkFaulty;
        const status = isFaulty ? 'Faulty' : 'Working';

        if (isFaulty) {
          labFaultyCount++;
        } else {
          labWorkingCount++;
        }

        const supplier = supplierVal || 'Not Specified';
        if (supplier && supplier !== 'Not Specified') {
          supplierCounts[supplier] = (supplierCounts[supplier] || 0) + 1;
        }

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
          cpuSerial: this.cleanCell(row.getCell(columnMap.cpuSerial || 10)) || 'N/A',
          cpuStatus: cpuStatus || 'YES',
          status: status,
          deadStockNo: formattedDSN,
          centralDeadStockNo: cdsVal || '-',
          deptDeadStockNo: ddsVal || '-',
          labDeadStockNo: ldsVal || '-',
          supplier: supplier,
          purchaseDate: purchaseDateVal || '-',
          remarks: remarkVal
        };

        systems.push(systemItem);

        if (isFaulty) {
          recentIssues.push({
            ...systemItem,
            labName: labName,
            labCode: labCode,
            roomNo: roomNo
          });
        }
      }

      const totalLabSystems = systems.length;
      const healthPct = totalLabSystems > 0 ? ((labWorkingCount / totalLabSystems) * 100).toFixed(1) : '100.0';

      totalComputers += totalLabSystems;
      totalWorking += labWorkingCount;
      totalFaulty += labFaultyCount;

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
        totalCount: totalLabSystems,
        workingCount: labWorkingCount,
        faultyCount: labFaultyCount,
        healthPercentage: parseFloat(healthPct),
        systems: systems
      });
    });

    const workingPct = totalComputers > 0 ? ((totalWorking / totalComputers) * 100).toFixed(1) : '100.0';

    this.lastSynced = new Date().toISOString();
    this.cachedData = {
      summary: {
        totalLabs: labs.length,
        totalComputers: totalComputers,
        workingComputers: totalWorking,
        faultyComputers: totalFaulty,
        workingPercentage: parseFloat(workingPct),
        equipmentIssues: totalFaulty,
        lastSynced: this.lastSynced
      },
      labs: labs,
      recentIssues: recentIssues,
      supplierCounts: supplierCounts
    };

    return this.cachedData;
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
}

module.exports = new ExcelService();
