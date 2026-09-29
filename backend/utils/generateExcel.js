const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function generateAuditExcel() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = path.join(dataDir, 'AI&DS Lab Audit sheet 2026-27.xlsx');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Department of AI & DS';
  workbook.created = new Date();

  // Color styling definitions
  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E293B' } // Slate 800
  };
  const headerFont = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
  
  const titleFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0F172A' } // Slate 900
  };
  const titleFont = { name: 'Calibri', size: 14, bold: true, color: { argb: 'F8FAFC' } };

  const labsConfig = [
    {
      id: 'swl',
      code: 'SWL',
      name: 'Software Laboratory',
      sheetName: 'SWL - Room 202',
      room: '202',
      inCharge: 'Dr. A. R. Sharma',
      assistant: 'Mr. V. K. Patil',
      totalCount: 30,
      suppliers: ['Dell India Pvt Ltd', 'HP Enterprise'],
      faultyIndices: [5, 14, 23],
      remarks: {
        5: 'Power supply unit failure - Sent for repair',
        14: 'RAM slot defect on motherboard',
        23: 'Display flickering - Cable issue'
      }
    },
    {
      id: 'ar-vr',
      code: 'AR/VR',
      name: 'AR/VR Laboratory',
      sheetName: 'AR-VR - Room 234',
      room: '234',
      inCharge: 'Prof. S. M. Kulkarni',
      assistant: 'Mrs. P. R. Deshmukh',
      totalCount: 24,
      suppliers: ['Lenovo Workstations', 'Dell India Pvt Ltd'],
      faultyIndices: [8, 19],
      remarks: {
        8: 'VR Headset tracking sensor glitch',
        19: 'GPU fan noise / overheating'
      }
    },
    {
      id: 'dsl',
      code: 'DSL',
      name: 'Data Science Laboratory',
      sheetName: 'DSL - Room 235',
      room: '235',
      inCharge: 'Prof. N. V. Joshi',
      assistant: 'Mr. S. B. Shinde',
      totalCount: 30,
      suppliers: ['HP Enterprise', 'Acer Systems'],
      faultyIndices: [11, 27],
      remarks: {
        11: 'CMOS Battery replaced, OS reinstallation needed',
        27: 'No display output - Integrated graphics issue'
      }
    },
    {
      id: 'ail',
      code: 'AIL',
      name: 'Artificial Intelligence Laboratory',
      sheetName: 'AIL - Room 236',
      room: '236',
      inCharge: 'Dr. P. K. Mehta',
      assistant: 'Mr. A. A. Pawar',
      totalCount: 28,
      suppliers: ['Dell India Pvt Ltd', 'NVIDIA DGX Station Partner'],
      faultyIndices: [3, 18],
      remarks: {
        3: 'NVMe SSD read error',
        18: 'Keyboard mechanical keys unresponsive'
      }
    },
    {
      id: 'osl',
      code: 'OSL',
      name: 'Operating Systems Laboratory',
      sheetName: 'OSL - Room 238',
      room: '238',
      inCharge: 'Prof. R. T. Jadhav',
      assistant: 'Mrs. M. S. More',
      totalCount: 30,
      suppliers: ['Lenovo Systems', 'HP Enterprise'],
      faultyIndices: [7, 16, 25],
      remarks: {
        7: 'Hard disk sector corrupted',
        16: 'Ethernet RJ45 port physically broken',
        25: 'SMPS power supply replace required'
      }
    },
    {
      id: 'pl',
      code: 'PL',
      name: 'Programming Laboratory',
      sheetName: 'PL - Room 239',
      room: '239',
      inCharge: 'Prof. G. H. Wagh',
      assistant: 'Mr. K. D. Bhosale',
      totalCount: 32,
      suppliers: ['Dell India Pvt Ltd', 'Acer Systems'],
      faultyIndices: [12, 29],
      remarks: {
        12: 'CPU heatsink fan stopped spinning',
        29: 'Mouse scroll wheel malfunctioning'
      }
    }
  ];

  // 1. Create Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.views = [{ showGridLines: true }];

  // Title Row
  summarySheet.mergeCells('A1:J1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE';
  titleCell.font = titleFont;
  titleCell.fill = titleFill;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 30;

  // Subtitle Row
  summarySheet.mergeCells('A2:J2');
  const subtitleCell = summarySheet.getCell('A2');
  subtitleCell.value = 'ANNUAL LABORATORY AUDIT SUMMARY SHEET (ACADEMIC YEAR 2026-27)';
  subtitleCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: '334155' } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(2).height = 24;

  // Header Row
  const summaryHeaders = [
    'Sr. No.',
    'Lab Code',
    'Laboratory Name',
    'Room No.',
    'Lab In-Charge',
    'Lab Assistant',
    'Total Systems',
    'Working Systems',
    'Faulty Systems',
    'Health %'
  ];

  const headerRow = summarySheet.getRow(4);
  headerRow.values = summaryHeaders;
  headerRow.height = 25;

  summaryHeaders.forEach((_, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  let totalDeptSystems = 0;
  let totalDeptWorking = 0;
  let totalDeptFaulty = 0;

  labsConfig.forEach((lab, idx) => {
    const workingCount = lab.totalCount - lab.faultyIndices.length;
    const faultyCount = lab.faultyIndices.length;
    const health = ((workingCount / lab.totalCount) * 100).toFixed(1);

    totalDeptSystems += lab.totalCount;
    totalDeptWorking += workingCount;
    totalDeptFaulty += faultyCount;

    const row = summarySheet.getRow(5 + idx);
    row.values = [
      idx + 1,
      lab.code,
      lab.name,
      lab.room,
      lab.inCharge,
      lab.assistant,
      lab.totalCount,
      workingCount,
      faultyCount,
      `${health}%`
    ];
    row.height = 22;

    row.eachCell((cell, colNumber) => {
      cell.alignment = {
        horizontal: colNumber === 3 || colNumber === 5 || colNumber === 6 ? 'left' : 'center',
        vertical: 'middle'
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
        left: { style: 'thin', color: { argb: 'CBD5E1' } },
        right: { style: 'thin', color: { argb: 'CBD5E1' } }
      };
    });
  });

  // Total Summary Row
  const totalRowIndex = 5 + labsConfig.length;
  const totalRow = summarySheet.getRow(totalRowIndex);
  const deptHealth = ((totalDeptWorking / totalDeptSystems) * 100).toFixed(1);

  totalRow.values = [
    'TOTAL',
    '-',
    'All Department Laboratories',
    '-',
    '-',
    '-',
    totalDeptSystems,
    totalDeptWorking,
    totalDeptFaulty,
    `${deptHealth}%`
  ];
  totalRow.height = 24;

  totalRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
    cell.alignment = {
      horizontal: colNumber === 3 ? 'left' : 'center',
      vertical: 'middle'
    };
    cell.border = {
      top: { style: 'medium', color: { argb: '64748B' } },
      bottom: { style: 'medium', color: { argb: '64748B' } }
    };
  });

  // Set Summary Column Widths
  summarySheet.columns = [
    { width: 10 }, // Sr. No.
    { width: 12 }, // Code
    { width: 32 }, // Lab Name
    { width: 12 }, // Room No
    { width: 24 }, // In-charge
    { width: 24 }, // Assistant
    { width: 15 }, // Total
    { width: 16 }, // Working
    { width: 15 }, // Faulty
    { width: 14 }  // Health
  ];

  // 2. Create Individual Lab Sheets
  labsConfig.forEach((lab) => {
    const sheet = workbook.addWorksheet(lab.sheetName);
    sheet.views = [{ showGridLines: true }];

    // Metadata Header Section
    sheet.mergeCells('A1:K1');
    const labTitle = sheet.getCell('A1');
    labTitle.value = `${lab.name.toUpperCase()} (ROOM ${lab.room})`;
    labTitle.font = titleFont;
    labTitle.fill = titleFill;
    labTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 28;

    // Metadata Key-Values
    sheet.getRow(3).values = ['Laboratory Name:', lab.name, '', 'Room Number:', lab.room, '', 'Lab In-Charge:', lab.inCharge];
    sheet.getRow(4).values = ['Department:', 'AI & DS', '', 'Academic Year:', '2026-27', '', 'Lab Assistant:', lab.assistant];

    sheet.getCell('A3').font = { bold: true };
    sheet.getCell('D3').font = { bold: true };
    sheet.getCell('G3').font = { bold: true };
    sheet.getCell('A4').font = { bold: true };
    sheet.getCell('D4').font = { bold: true };
    sheet.getCell('G4').font = { bold: true };

    // Audit Table Headers
    const labHeaders = [
      'Sr. No.',
      'Computer/System',
      'Monitor Serial No.',
      'CPU Serial No.',
      'Keyboard Serial No.',
      'Mouse Serial No.',
      'Working Status',
      'Dead Stock Number',
      'Supplier',
      'Purchase Date',
      'Remarks'
    ];

    const labHeaderRow = sheet.getRow(6);
    labHeaderRow.values = labHeaders;
    labHeaderRow.height = 25;

    labHeaders.forEach((_, colIdx) => {
      const cell = labHeaderRow.getCell(colIdx + 1);
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Populate System Rows
    for (let i = 1; i <= lab.totalCount; i++) {
      const isFaulty = lab.faultyIndices.includes(i);
      const status = isFaulty ? 'Faulty' : 'Working';
      const sysNum = String(i).padStart(2, '0');
      const systemName = `SYS-${lab.code}-${sysNum}`;
      
      const monSN = `MON-${lab.code}-2024-${1000 + i}`;
      const cpuSN = `CPU-${lab.code}-2024-${2000 + i}`;
      const kbSN = `KB-${lab.code}-2024-${3000 + i}`;
      const msSN = `MS-${lab.code}-2024-${4000 + i}`;

      const dsnYear = 2024 + (i % 2);
      const dsn = `DSN/AIDS/${lab.code}/${dsnYear}/${String(i).padStart(3, '0')}`;
      const supplier = lab.suppliers[i % lab.suppliers.length];
      const purchaseDate = `${2023 + (i % 3)}-0${(i % 8) + 1}-15`;
      const remark = isFaulty ? lab.remarks[i] || 'Hardware diagnostic required' : 'Operational';

      const dataRow = sheet.getRow(6 + i);
      dataRow.values = [
        i,
        systemName,
        monSN,
        cpuSN,
        kbSN,
        msSN,
        status,
        dsn,
        supplier,
        purchaseDate,
        remark
      ];
      dataRow.height = 20;

      dataRow.eachCell((cell, colNumber) => {
        cell.alignment = {
          horizontal: colNumber === 2 || colNumber === 8 || colNumber === 9 || colNumber === 11 ? 'left' : 'center',
          vertical: 'middle'
        };

        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };

        if (colNumber === 7) { // Working status column styling
          if (status === 'Working') {
            cell.font = { color: { argb: '166534' }, bold: true }; // Dark green
          } else {
            cell.font = { color: { argb: '991B1B' }, bold: true }; // Dark red
          }
        }
      });
    }

    // Set Column Widths for Lab Sheet
    sheet.columns = [
      { width: 8 },  // Sr. No.
      { width: 16 }, // Computer/System
      { width: 22 }, // Monitor SN
      { width: 22 }, // CPU SN
      { width: 22 }, // Keyboard SN
      { width: 22 }, // Mouse SN
      { width: 15 }, // Working Status
      { width: 25 }, // Dead Stock No
      { width: 25 }, // Supplier
      { width: 14 }, // Purchase Date
      { width: 38 }  // Remarks
    ];
  });

  await workbook.xlsx.writeFile(filePath);
  console.log(`[ExcelGenerator] Workbook generated successfully at: ${filePath}`);
}

if (require.main === module) {
  generateAuditExcel().catch((err) => {
    console.error('[ExcelGenerator] Error generating workbook:', err);
    process.exit(1);
  });
}

module.exports = { generateAuditExcel };
