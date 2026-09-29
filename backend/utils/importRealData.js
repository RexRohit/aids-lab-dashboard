const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function createExactAuditWorkbook() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = path.join(dataDir, 'AI&DS Lab Audit sheet 2026-27.xlsx');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SNJB College of Engineering AI&DS Dept';
  workbook.created = new Date();

  // Colors & Styles
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

  const summaryRowsData = [
    [1, 'Software Laboratory', 'SWL', '202', 'Prof. Pooja S. Bhavar', 'Ms. Shraddha A. Gaikwad', 20, 20, 27, 26, 1],
    [2, 'Computer Laboratory-II (AR/VR)', 'CL-II', '234', 'Prof. Ashish S. Kale', 'Ms. Priya A. Kamble', 20, 20, 29, 25, 4],
    [3, 'Data Science Laboratory', 'DSL', '235', 'Prof. Sandhya E. Aghav', 'Ms. Nayana N. Aher', 20, 20, 23, 14, 9],
    [4, 'Artificial Intelligence Laboratory', 'AIL', '236', 'Prof. Minakshi S. Sonawane', 'Mr. Satish S. Jadhav', 20, 20, 25, 23, 2],
    [5, 'Open Source Laboratory', 'OSL', '238', 'Prof. Nilesh V. Sharma', 'Ms. Nayana N. Aher', 20, 20, 22, 21, 1],
    [6, 'Project Laboratory', 'PL', '239', 'Prof. Mayur V. Kumbharde', 'Mr. Satish S. Jadhav', 20, 20, 25, 23, 2]
  ];

  summaryRowsData.forEach((rd, i) => {
    const row = summarySheet.getRow(5 + i);
    row.values = rd;
    row.height = 22;
    row.eachCell((cell, colNo) => {
      cell.alignment = { horizontal: colNo === 2 || colNo === 5 || colNo === 6 ? 'left' : 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin', color: { argb: 'CBD5E1' } }, bottom: { style: 'thin', color: { argb: 'CBD5E1' } }, left: { style: 'thin', color: { argb: 'CBD5E1' } }, right: { style: 'thin', color: { argb: 'CBD5E1' } } };
    });
  });

  summarySheet.columns = [
    { width: 8 }, { width: 32 }, { width: 12 }, { width: 10 }, { width: 26 }, { width: 24 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 14 }
  ];

  // Full Exact Raw Sheets Data
  const realLabsData = [
    {
      sheetName: 'SWL - Room 202',
      code: 'SWL',
      labName: 'Software Laboratory',
      room: '202',
      inCharge: 'Prof Pooja S. Bhavar',
      assistant: 'Ms. Shraddha A Gaikwad',
      cost: '9,26,702/-',
      area: '99.31 Sq.m.',
      os: 'Windows 10 pro(64bit) & Windows 11 pro(64bit)',
      tools: 'Python3.8, Packet Tracker, My SQL,Aurdino IDE,ubunto-java/c++/c',
      browsers: 'Microsoft Edge, Google Chrome',
      misc: 'Microsoft office 2010, Microsoft PowerPOint 2010,Acrobat Reader',
      hardware: 'A) Model: Computer Lenovo ThinkCenter Tiny 10 AXSINYIH with 18.5" Lenovo Make Monitor LCD Processor Intel (R) Core (TM) i5 8500 CPU @3.00 GHZ,3000 MHZ(64 bit),16GB RAM, SSD SIZE - 238 GB, USB Keyboard, Mouse-USB.',
      items: [
        { sr: 1, cds: '307', dds: '7', lds: '1', supplier: 'RACCA INFOTECH PVT LTD', type: 'Projector', itemDesc: 'Projector', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '2020-01-07', remark: '' },
        { sr: 2, cds: '414', dds: '10', lds: '4', supplier: 'GUIDE ROUND COMPUTERS', type: 'Networks Switch', itemDesc: 'Networks Switch', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '2020-01-07', remark: '' },
        { sr: 3, cds: '411', dds: '9', lds: '3', supplier: 'GENERAL MAINTENANCE CO.', type: 'UPS', itemDesc: 'UPS', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '2020-01-07', remark: '' },
        { sr: 4, cds: '680', dds: '27', lds: '7', supplier: 'RACCA INFOTECH PVT LTD (20 PCS)', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-47/IT-01/SL-01/2008-09/MNTR-18', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-01', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 5, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-406/ETC-96/RESEARCH-01/2015-16/LENOVO-02', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-02', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 6, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-406/ETC-96/RESEARCH-01/2015-16/LENOVO-03', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-03', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 7, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-406/ETC-91/RESEARCH-01/2015-16/LENOVO-07', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-04', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 8, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-47/IT-01/SL-01/2008-09/MNTR-10', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-05', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 9, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-406/ETC-96/PG-07/2015-16/LENOVO-10', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-06', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 10, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-406/ETC-96/PG-07/2015-16/LENOVO-13', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-07', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 11, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-406/ETC-96/PG-07/2015-16/LENOVO-14', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-08', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 12, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-406/ETC-96/PG-07/2015-16/LENOVO-11', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-09', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 13, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-406/ETC-96/PG-07/2015-16/LENOVO-12', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-10', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 14, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-406/ETC-96/PG-07/2015-16/LENOVO-09', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-11', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 15, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-406/ETC-96/PG-07/2015-16/LENOVO-08', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-12', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 16, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-406/ETC-96/PG-01/2015-16/LENOVO-07', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-13', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 17, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-406/ETC-96/RESEARCH-01/2015-16/LENOVO-04', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-14', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 18, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-406/ETC-96/PG-07/2015-16/LENOVO-05', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-15', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 19, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: '', monW: 'NO', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-16', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 20, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-187/OSL-13/OSL-13/2015-16/MNTR-06', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-17', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 21, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-406/ETC-96/PG-07/2015-16/LENOVO-02', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-18', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 22, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-406/ETC-96/PG-07/2015-16/LENOVO-01', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-19', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 23, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: '', monW: 'YES', cpuSN: 'SNJBCOE-680/AIDS-27/SWL-07/2026-27/CPU-20', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '16/03/2026', remark: '' },
        { sr: 24, cds: '', dds: '', lds: '', supplier: 'SUPER DEBUG PVT. LTD.', type: 'IOT KIT', itemDesc: 'i)RASPBERRY-PI DEVELOPMENT BOARD ADVANCE WITH SENSORS ii)RASPBERRY-PI-5 4gb STARTER KIT', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '27/03/2024', remark: '' },
        { sr: 25, cds: '650', dds: '26', lds: '6', supplier: 'COGNIFRONT', type: 'IOT KIT', itemDesc: 'ARDUINO UNO BOARD (5)', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '30/07/2025', remark: '' },
        { sr: 26, cds: '650', dds: '26', lds: '6', supplier: 'COGNIFRONT', type: 'IOT KIT', itemDesc: 'NODE MCU BOARD (5)', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '30/07/2025', remark: '' },
        { sr: 27, cds: '650', dds: '26', lds: '6', supplier: 'COGNIFRONT', type: 'IOT KIT', itemDesc: 'SENSORS & ACTUATORS BOARD (5)', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '30/07/2025', remark: '' }
      ]
    },
    {
      sheetName: 'CL-II - Room 234',
      code: 'CL-II',
      labName: 'Computer Laboratory-II',
      room: '234',
      inCharge: 'Prof Ashish S. Kale',
      assistant: 'Ms. Priya kamble',
      cost: '6,95,402/-',
      area: '95.04',
      os: 'WINDOWS 10 (64 bit), UBUNTU 22.04 (64 bit)',
      tools: 'Turboc3,visual studio,Unity',
      browsers: 'Microsoft Edge, Google Chrome',
      misc: 'Microsoft office 2010, Microsoft PowerPOint 2010,Acrobat Reader',
      hardware: 'Asus 18.5 LED Monitor D310 MT Intel(R) Core(TM) i7-8700 CPU @ 3.20GHz (3.19 GHz) 16GB RAM Intel(R) UHD Graphics 630 (128 MB) Storage - 238 GB 64-bit operating system, x64-based processor USB Keyboard, Mouse.',
      items: [
        { sr: 1, cds: '639', dds: '24', lds: '3', supplier: 'Racca infotech pvt LTd Nashik', type: 'Desktop PC', itemDesc: '1', monSN: 'SNJBCOE-639/MECR-24/DSR-03/ASUS/D310MT/001', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-01', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'SNJBCOE/560/AIDS-13/PRL-07/22-23/M-18', msW: 'YES', date: '01-01-2025', remark: '' },
        { sr: 2, cds: 'CDS003', dds: 'DDS003', lds: 'LDS003', supplier: '', type: 'Desktop PC', itemDesc: '2', monSN: 'SNJBCOE-639/MECR-24/DSR-155/ASUS/D310MT/006', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-016', cpuW: 'YES', kbSN: 'SNJBCOE/MECH/LENOVO-35', kbW: 'YES', msSN: 'SNJBCOE/LEMP/IBM', msW: 'YES', date: '10-03-2024', remark: '' },
        { sr: 3, cds: 'CDS004', dds: 'DDS004', lds: 'LDS004', supplier: '', type: 'Desktop PC', itemDesc: '3', monSN: 'SNJBCOE-406/IT', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-04', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'NO BRANDING', msW: 'YES', date: '20-03-2024', remark: '' },
        { sr: 4, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '4', monSN: 'SNJBCOE/MECH/DSR-154/LENOVO/E73/013', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-15', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'SNJBCOE/COMP/IBMCS', msW: 'YES', date: '', remark: '' },
        { sr: 5, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '5', monSN: 'SNJBCOE-412/COMP-188/OSL-14/15-16/MTR07', monW: 'NO', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-03', cpuW: 'NO', kbSN: 'NO BRANDING', kbW: 'NO', msSN: 'NO BRANDING', msW: 'NO', date: '', remark: '' },
        { sr: 6, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '6', monSN: 'SNJBCOE-412/COMP-188/OSL-14/15-16/MTR03', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-14', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'NO BRANDING', msW: 'YES', date: '', remark: '' },
        { sr: 7, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '7', monSN: 'SNJBCOE/MECH/DSR-155/ASUS/D310MT/011', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-11', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'CAD-LAB', msW: 'YES', date: '', remark: '' },
        { sr: 8, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '8', monSN: 'SNJBCOE/MECH/DSR144/LENOVO/M72E/019', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-17', cpuW: 'YES', kbSN: 'SNJBCOE/MECH/A13\\10\\05', kbW: 'YES', msSN: 'NO BRANDING', msW: 'YES', date: '', remark: '' },
        { sr: 9, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '9', monSN: 'SNJBCOE/MECH/DSR155/ASUS/D310MT/020', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-02', cpuW: 'YES', kbSN: 'SNJBCOE-406/COMP-187/OSL-13/15-16/KBD-02', kbW: 'YES', msSN: 'NO BRANDING', msW: 'YES', date: '', remark: '' },
        { sr: 10, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '10', monSN: 'SNJBCOE/MECH/DSR133/LENOVO/A13/001', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-09', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'NO BRANDING', msW: 'YES', date: '', remark: '' },
        { sr: 11, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '11', monSN: 'SNJBCOE/MECH/DSR155/ASUS/D310MT/012', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-06', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'NO BRANDING', msW: 'YES', date: '', remark: '' },
        { sr: 12, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '12', monSN: 'NO BRANDING', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-05', cpuW: 'YES', kbSN: 'SNJBCOE-406/COMP-187/OSL-13/15-16/KBD-10', kbW: 'YES', msSN: 'NO BRANDING', msW: 'YES', date: '', remark: '' },
        { sr: 13, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '13', monSN: 'SNJBCOE/MECH/DSR155/ASUS/D310MT/008', monW: 'NO', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-10', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'NO BRANDING', msW: 'YES', date: '', remark: '' },
        { sr: 14, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '14', monSN: 'SNJBCOE/MECH/DSR155/ASUS/D310MT/005', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-18', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'SNJBCOE/604/AIDS-17/PL-06/24-25/M-06', msW: 'YES', date: '', remark: '' },
        { sr: 15, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '15', monSN: 'NO BRANDING', monW: 'NO', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-08', cpuW: 'NO', kbSN: 'NO BRANDING', kbW: 'NO', msSN: 'NO BRANDING', msW: 'NO', date: '', remark: '' },
        { sr: 16, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '16', monSN: 'SNJBCOE/MECH/DSR155/ASUS/D310MT/010', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-07', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'NO BRANDING', msW: 'YES', date: '', remark: '' },
        { sr: 17, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '17', monSN: 'SNJBCOE/MECH/DSR155/ASUS/D310MT/014', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-20', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'SNJBCOE/COMP/IBMSCS', msW: 'YES', date: '', remark: '' },
        { sr: 18, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '18', monSN: 'SNJBCOE/MECH/DSR155/ASUS/D310MT/017', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-13', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'NO BRANDING', msW: 'YES', date: '', remark: '' },
        { sr: 19, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '19', monSN: 'SNJBCOE/MECH/DSR144/LENOVO/M72E/003', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-19', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'NO BRANDING', msW: 'YES', date: '', remark: '' },
        { sr: 20, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: '20', monSN: 'SNJBCOE/MECH/DSR155/ASUS/D310MT/002', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-20', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'NO BRANDING', msW: 'YES', date: '', remark: '' },
        { sr: 21, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE/MECH/DSR', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-13', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'NO BRANDING', msW: 'YES', date: '', remark: '' },
        { sr: 22, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: '', monW: 'YES', cpuSN: 'SNJBCOE-639/AIDS-24/CL-II-234/24-25/CPU-19', cpuW: 'YES', kbSN: 'NO BRANDING', kbW: 'YES', msSN: 'SNJBCOE-406/IT-36/131/15-16/MOUSE-07', msW: 'YES', date: '', remark: '' },
        { sr: 23, cds: '', dds: '', lds: '', supplier: '', type: 'Projector', itemDesc: '1', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '', remark: '' },
        { sr: 24, cds: '', dds: '', lds: '', supplier: '', type: 'Networks Switch', itemDesc: '1', monSN: 'SNJBCOE-173/AI&DS-29/CL-II-05/25-26/SWITCH-01', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '', remark: '' },
        { sr: 25, cds: '', dds: '', lds: '', supplier: '', type: 'AR /VR Kit', itemDesc: '1', monSN: 'SNJBCOE-684/AI &DS-25/CL-II-04/25-26/AR-VR-H1', monW: 'YES', cpuSN: 'SNJBCOE-684/AI &DS-25/CL-II-04/25-26/AR-VR-CR1', cpuW: 'NO', kbSN: 'SNJBCOE-684/AI &DS-25/CL-II-04/25-26/AR-VR-CL1', kbW: 'YES', msSN: '', msW: 'YES', date: '', remark: '' },
        { sr: 26, cds: '', dds: '', lds: '', supplier: '', type: 'AR /VR Kit', itemDesc: '2', monSN: 'SNJBCOE-684/AI &DS-25/CL-II-04/25-26/AR-VR-H2', monW: 'YES', cpuSN: 'SNJBCOE-684/AI &DS-25/CL-II-04/25-26/AR-VR-CR2', cpuW: 'YES', kbSN: 'SNJBCOE-684/AI &DS-25/CL-II-04/25-26/AR-VR-CL2', kbW: 'YES', msSN: '', msW: 'YES', date: '', remark: '' },
        { sr: 27, cds: '', dds: '', lds: '', supplier: '', type: 'AR /VR Kit', itemDesc: '3', monSN: 'SNJBCOE-703/AI&DS-30/AR-VR-06/26-27/AR-VR-H3', monW: 'YES', cpuSN: 'SNJBCOE-703/AI&DS-30/AR-VR-06/26-27/AR-VR-CR3', cpuW: 'YES', kbSN: 'SNJBCOE-703/AI&DS-30/AR-VR-06/26-27/AR-VR-CL3', kbW: 'YES', msSN: '', msW: 'YES', date: '', remark: '' },
        { sr: 28, cds: '', dds: '', lds: '', supplier: '', type: 'AR /VR Kit', itemDesc: '4', monSN: 'SNJBCOE-703/AI&DS-30/AR-VR-06/26-27/AR-VR-H4', monW: 'YES', cpuSN: 'SNJBCOE-703/AI&DS-30/AR-VR-06/26-27/AR-VR-CR4', cpuW: 'YES', kbSN: 'SNJBCOE-703/AI&DS-30/AR-VR-06/26-27/AR-VR-CL4', kbW: 'YES', msSN: '', msW: 'YES', date: '', remark: '' },
        { sr: 29, cds: '', dds: '', lds: '', supplier: '', type: 'AR /VR Kit', itemDesc: '5', monSN: 'SNJBCOE-703/AI&DS-30/AR-VR-06/26-27/AR-VR-H5', monW: 'YES', cpuSN: 'SNJBCOE-703/AI&DS-30/AR-VR-06/26-27/AR-VR-CR5', cpuW: 'YES', kbSN: 'SNJBCOE-703/AI&DS-30/AR-VR-06/26-27/AR-VR-CL5', kbW: 'YES', msSN: '', msW: 'YES', date: '', remark: '' }
      ]
    },
    {
      sheetName: 'DSL - Room 235',
      code: 'DSL',
      labName: 'Data Science Laboratory',
      room: '235',
      inCharge: 'Prof sandhya E. Aghav',
      assistant: 'Ms. Nayana N.Aher',
      cost: '7,50,000/-',
      area: '67.99 Sq.m.',
      os: 'WINDOWS 10 (64 bit), UBUNTU 22.04(64 bit)',
      tools: 'Python, Pycharm IDE, MetPlotLib, G++,Aurdino IDE',
      browsers: 'Mozilla Firefox ,Microsoft Egde, Google Chrome',
      misc: 'Acrobat Reader, Microsoft Office 2010',
      hardware: 'A) Model:- Computer Lenovo MakeThinkVision Model- E1922s with Monitor 18.6" LCD Processor Intel Core(TM) i5-6500T CPU @ 2.50GHz, 64 bit,4GB RAM, SSD SIZE - 256GB, USB Keyboard, Mouse-USB.',
      items: [
        { sr: 1, cds: '492', dds: '2', lds: '2', supplier: 'Digotal world', type: 'Networks Switch', itemDesc: 'Networks Switch', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '01.07.2022', remark: '' },
        { sr: 2, cds: '554', dds: '11', lds: '3', supplier: 'Digitech solutions', type: 'Projector', itemDesc: 'Projector', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '08.02.2023', remark: '' },
        { sr: 3, cds: '560', dds: '13', lds: '4', supplier: 'Gore computers shrirampur ahmednagar', type: 'Desktop PC', itemDesc: '20pcs Desktop PC', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'NO', msSN: '', msW: 'NO', date: '20.01.2023', remark: '' },
        { sr: 4, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-01', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-01', cpuW: 'YES', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-01', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-01', msW: 'YES', date: '', remark: '' },
        { sr: 5, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-02', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-02', cpuW: 'YES', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-02', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-02', msW: 'YES', date: '', remark: '' },
        { sr: 6, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-03', monW: 'NO', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-03', cpuW: 'YES', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-03', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-03', msW: 'NO', date: '', remark: '' },
        { sr: 7, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-04', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-04', cpuW: 'YES', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-04', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-04', msW: 'YES', date: '', remark: '' },
        { sr: 8, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-05', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-05', cpuW: 'YES', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-05', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-05', msW: 'YES', date: '', remark: '' },
        { sr: 9, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-06', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-06', cpuW: 'ISSUE', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-06', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-06', msW: 'YES', date: '', remark: '' },
        { sr: 10, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-07', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-07', cpuW: 'YES', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-07', kbW: 'NO', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-07', msW: 'NO', date: '', remark: '' },
        { sr: 11, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-08', monW: 'NO', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-08', cpuW: 'YES', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-08', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-08', msW: 'YES', date: '', remark: '' },
        { sr: 12, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-09', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-09', cpuW: 'YES', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-09', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-09', msW: 'YES', date: '', remark: '' },
        { sr: 13, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-10', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-10', cpuW: 'NO', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-10', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-10', msW: 'YES', date: '', remark: '' },
        { sr: 14, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-11', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-11', cpuW: 'YES', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-11', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-11', msW: 'YES', date: '', remark: '' },
        { sr: 15, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-12', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-12', cpuW: 'YES', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-12', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-12', msW: 'YES', date: '', remark: '' },
        { sr: 16, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-13', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-13', cpuW: 'YES', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-13', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-13', msW: 'YES', date: '', remark: '' },
        { sr: 17, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-14', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-14', cpuW: 'ISSUE', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-14', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-14', msW: 'YES', date: '', remark: '' },
        { sr: 18, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-15', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-15', cpuW: 'NO', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-15', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-15', msW: 'YES', date: '', remark: '' },
        { sr: 19, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-16', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-16', cpuW: 'YES', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-16', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-16', msW: 'YES', date: '', remark: '' },
        { sr: 20, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-17', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-17', cpuW: 'YES', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-17', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-17', msW: 'YES', date: '', remark: '' },
        { sr: 21, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-18', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-18', cpuW: 'NO', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-18', kbW: 'ISSUE', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-18', msW: 'NO', date: '', remark: '' },
        { sr: 22, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-19', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-19', cpuW: 'YES', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-19', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-19', msW: 'YES', date: '', remark: '' },
        { sr: 23, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MNTR-20', monW: 'YES', cpuSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/CPU-20', cpuW: 'YES', kbSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/KBD-20', kbW: 'YES', msSN: 'SNJB/COE/560/AIDS-13-SWL-04/22-23/MOUSE-20', msW: 'YES', date: '', remark: '' }
      ]
    },
    {
      sheetName: 'AIL - Room 236',
      code: 'AIL',
      labName: 'Artificial Intelligence Laboratory',
      room: '236',
      inCharge: 'Prof. Minakshi Sonawane',
      assistant: 'Mr. Satish S. Jadhav',
      cost: '8,20,000/-',
      area: '68 Sq.m.',
      os: 'WINDOWS 10 (64 bit), UBUNTU 22.04(64 bit),ubuntu 16.04 LTS',
      tools: 'Python, Pycharm IDE, MetPlotLib, G++,Aurdino IDE, R software ,python IDE',
      browsers: 'Mozilla Firefox ,Microsoft Egde, Google Chrome',
      misc: 'Acrobat Reader, Microsoft Office 2010',
      hardware: 'A) Model: Computer Lenovo MakeThinkVision Model- E1922s with Monitor 18.6" LCD Processor Intel(R) Core(TM) i5-6500T CPU @ 2.50GHz, 64 bit,8.00GB RAM, SSD SIZE - 256 GB USB Keyboard, Mouse-USB. . .',
      items: [
        { sr: 1, cds: 'CDS002', dds: 'DDS002', lds: 'LDS002', supplier: 'XYZ Technologies', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '01-01-2025', remark: '' },
        { sr: 2, cds: 'CDS003', dds: 'DDS003', lds: 'LDS003', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: '', monW: 'NO', cpuSN: '', cpuW: 'NO', kbSN: '', kbW: 'NO', msSN: '', msW: 'NO', date: '10-03-2024', remark: '' },
        { sr: 3, cds: 'CDS004', dds: 'DDS004', lds: 'LDS004', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: '', monW: 'NO', cpuSN: '', cpuW: 'NO', kbSN: '', kbW: 'NO', msSN: '', msW: 'NO', date: '20-03-2024', remark: '' },
        { sr: 4, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '', remark: '' },
        { sr: 5, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '', remark: '' }
      ]
    },
    {
      sheetName: 'OSL - Room 238',
      code: 'OSL',
      labName: 'Open Source Laboratory',
      room: '238',
      inCharge: 'Prof. Nilesh V. Sharma',
      assistant: 'Ms.Aher N.N.',
      cost: '6,80,000/-',
      area: '66 Sq.m.',
      os: 'WINDOWS 10 (64 bit), UBUNTU 22.04 (64 bit)',
      tools: 'jupyter notebook , pycharm , google collab',
      browsers: 'Mozilla Firefox , Google Chrome, Microsoft Edge',
      misc: 'Acrobat Reader, Microsoft Office 2019',
      hardware: 'Model: Computer Lenovo MakeThinkVision Model- E1922s with Monitor 18.6" LCD Processor Intel Core(TM) i5-6500T CPU @ 2.50GHz, 64 bit,8GB RAM, USB Keyboard, Mouse-USB.',
      items: [
        { sr: 1, cds: '433', dds: '43', lds: '4', supplier: 'Laptop world nashik', type: 'Printer', itemDesc: 'Printer', monSN: '', monW: 'NO', cpuSN: '', cpuW: 'NO', kbSN: '', kbW: 'NO', msSN: '', msW: 'NO', date: '04.10.2016', remark: '' },
        { sr: 2, cds: '177', dds: '55', lds: '9', supplier: 'General Maintainance company', type: 'Ups Battery', itemDesc: 'Ups Battery', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '28.02.2018', remark: '' },
        { sr: 3, cds: '343', dds: '39', lds: '10', supplier: 'Racca info pvt ltd', type: 'Projector', itemDesc: 'Projector', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '12.07.2018', remark: '' },
        { sr: 4, cds: '', dds: '192', lds: '12', supplier: 'Racca infotech nashik', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '05.08.2022', remark: '' },
        { sr: 5, cds: '544', dds: '193', lds: '12', supplier: 'gore computer shrirampur', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '06.09.2022', remark: '' },
        { sr: 6, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-19', monW: 'YES', cpuSN: 'SNJBCOE-544/COMP-193/OSL-13/22-23/CPU-02', cpuW: 'YES', kbSN: '1', kbW: 'YES', msSN: '1', msW: 'YES', date: '', remark: '' },
        { sr: 7, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-16', monW: 'YES', cpuSN: 'SNJBCOE-544/COMP-193/OSL-13/22-23/CPU-03', cpuW: 'YES', kbSN: '2', kbW: 'YES', msSN: '2', msW: 'YES', date: '', remark: '' },
        { sr: 8, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-17', monW: 'YES', cpuSN: 'SNJBCOE-544/COMP-193/OSL-13/22-23/CPU-13', cpuW: 'YES', kbSN: '3', kbW: 'YES', msSN: '3', msW: 'YES', date: '', remark: '' },
        { sr: 9, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-07', monW: 'YES', cpuSN: 'SNJBCOE-544/COMP-193/OSL-13/22-23/CPU-16', cpuW: 'YES', kbSN: '4', kbW: 'YES', msSN: '4', msW: 'YES', date: '', remark: '' },
        { sr: 10, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-04', monW: 'YES', cpuSN: 'SNJBCOE-544/COMP-193/OSL-13/22-23/CPU-04', cpuW: 'YES', kbSN: '5', kbW: 'YES', msSN: '5', msW: 'YES', date: '', remark: '' },
        { sr: 11, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-13', monW: 'YES', cpuSN: 'SNJBCOE-544/COMP-193/OSL-13/22-23/CPU-20', cpuW: 'YES', kbSN: '6', kbW: 'YES', msSN: '6', msW: 'YES', date: '', remark: '' },
        { sr: 12, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-09', monW: 'YES', cpuSN: 'SNJBCOE-544/COMP-193/OSL-13/22-23/CPU-09', cpuW: 'YES', kbSN: '7', kbW: 'YES', msSN: '7', msW: 'YES', date: '', remark: '' },
        { sr: 13, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-08', monW: 'YES', cpuSN: 'SNJBCOE-544/COMP-193/OSL-13/22-23/CPU-06', cpuW: 'YES', kbSN: '8', kbW: 'YES', msSN: '8', msW: 'YES', date: '', remark: '' },
        { sr: 14, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-18', monW: 'YES', cpuSN: 'SNJBCOE-544/COMP-193/OSL-13/22-23/CPU-10', cpuW: 'YES', kbSN: '9', kbW: 'YES', msSN: '9', msW: 'YES', date: '', remark: '' },
        { sr: 15, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-02', monW: 'YES', cpuSN: 'SNJBCOE-544/COMP-193/OSL-13/22-23/CPU-14', cpuW: 'YES', kbSN: '10', kbW: 'YES', msSN: '10', msW: 'YES', date: '', remark: '' },
        { sr: 16, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-12', monW: 'YES', cpuSN: 'SNJBCOE-544/COMP-193/OSL-13/22-23/CPU-18', cpuW: 'YES', kbSN: '11', kbW: 'YES', msSN: '11', msW: 'YES', date: '', remark: '' },
        { sr: 17, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-14', monW: 'YES', cpuSN: 'SNJBCOE-544/COMP-193/OSL-13/22-23/CPU-01', cpuW: 'YES', kbSN: '12', kbW: 'YES', msSN: '12', msW: 'YES', date: '', remark: '' },
        { sr: 18, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-03', monW: 'YES', cpuSN: 'SNJBCOE-544/COMP-193/OSL-13/22-23/CPU-17', cpuW: 'YES', kbSN: '13', kbW: 'YES', msSN: '13', msW: 'YES', date: '', remark: '' },
        { sr: 19, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-05', monW: 'YES', cpuSN: 'SNJBCOE-544/COMP-193/OSL-13/22-23/CPU-07', cpuW: 'YES', kbSN: '14', kbW: 'YES', msSN: '14', msW: 'YES', date: '', remark: '' },
        { sr: 20, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-11', monW: 'YES', cpuSN: 'SNJBCOE-544/COMP-193/OSL-13/22-23/CPU-12', cpuW: 'YES', kbSN: '15', kbW: 'YES', msSN: '15', msW: 'YES', date: '', remark: '' },
        { sr: 21, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJBCOE-545/COMP-192/OSL-12/22-23/MNTR-15', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '16', kbW: 'YES', msSN: '16', msW: 'YES', date: '', remark: '' },
        { sr: 22, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: 'SNJB/COE/COMP/IBMCS-24', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '17', kbW: 'YES', msSN: '17', msW: 'YES', date: '', remark: '' }
      ]
    },
    {
      sheetName: 'PL - Room 239',
      code: 'PL',
      labName: 'Project Laboratory',
      room: '239',
      inCharge: 'Prof. Mayur V. Kumbharde',
      assistant: 'Mr. Satish S. Jadhav',
      cost: '7,10,000/-',
      area: '67 Sq.m.',
      os: 'Windows 10, Ubuntu 22.4',
      tools: 'Python, Pycharm IDE',
      browsers: 'Mozilla Firefox ,Microsoft Egde, Google Chrome',
      misc: 'Acrobat Reader, Microsoft Office 2019',
      hardware: 'Dell Precision T58810 Computer System',
      items: [
        { sr: 1, cds: 'CDS002', dds: 'DDS002', lds: 'LDS002', supplier: 'XYZ Technologies', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '01-01-2025', remark: '' },
        { sr: 2, cds: 'CDS003', dds: 'DDS003', lds: 'LDS003', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: '', monW: 'NO', cpuSN: '', cpuW: 'NO', kbSN: '', kbW: 'NO', msSN: '', msW: 'NO', date: '10-03-2024', remark: '' },
        { sr: 3, cds: 'CDS004', dds: 'DDS004', lds: 'LDS004', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: '', monW: 'NO', cpuSN: '', cpuW: 'NO', kbSN: '', kbW: 'NO', msSN: '', msW: 'NO', date: '20-03-2024', remark: '' },
        { sr: 4, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '', remark: '' },
        { sr: 5, cds: '', dds: '', lds: '', supplier: '', type: 'Desktop PC', itemDesc: 'Desktop PC', monSN: '', monW: 'YES', cpuSN: '', cpuW: 'YES', kbSN: '', kbW: 'YES', msSN: '', msW: 'YES', date: '', remark: '' }
      ]
    }
  ];

  // Populate individual Lab Worksheets
  realLabsData.forEach((lab) => {
    const sheet = workbook.addWorksheet(lab.sheetName);
    sheet.views = [{ showGridLines: true }];

    // Header Title
    sheet.mergeCells('A1:M1');
    const title = sheet.getCell('A1');
    title.value = `SNJB'S LATE SAU. K. B. JAIN COLLEGE OF ENGINEERING - ${lab.labName.toUpperCase()} (ROOM ${lab.room})`;
    title.font = titleFont;
    title.fill = titleFill;
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 28;

    // Metadata Key-Values
    sheet.getRow(3).values = ['Laboratory Name:', lab.labName, '', 'Room Number:', lab.room, '', 'Lab In-Charge:', lab.inCharge];
    sheet.getRow(4).values = ['Department:', 'AI & DS', '', 'Lab Cost:', lab.cost, '', 'Lab Assistant:', lab.assistant];

    sheet.getCell('A3').font = { bold: true };
    sheet.getCell('D3').font = { bold: true };
    sheet.getCell('G3').font = { bold: true };
    sheet.getCell('A4').font = { bold: true };
    sheet.getCell('D4').font = { bold: true };
    sheet.getCell('G4').font = { bold: true };

    // Table Headers
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

    // Items rows
    lab.items.forEach((item, idx) => {
      const row = sheet.getRow(7 + idx);
      row.values = [
        item.sr,
        item.cds,
        item.dds,
        item.lds,
        item.supplier,
        item.type,
        item.monSN || item.itemDesc,
        item.monSN,
        item.monW,
        item.cpuSN,
        item.cpuW,
        item.date,
        item.remark
      ];
      row.height = 20;

      row.eachCell((cell, colNo) => {
        cell.alignment = {
          horizontal: colNo === 5 || colNo === 6 || colNo === 7 || colNo === 8 || colNo === 10 || colNo === 13 ? 'left' : 'center',
          vertical: 'middle'
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };

        if (colNo === 9 || colNo === 11) {
          if (cell.value === 'YES') {
            cell.font = { color: { argb: '166534' }, bold: true };
          } else if (cell.value === 'NO' || cell.value === 'ISSUE') {
            cell.font = { color: { argb: '991B1B' }, bold: true };
          }
        }
      });
    });

    // Append Laboratory Specifications at bottom
    const metaStartRow = 9 + lab.items.length;
    sheet.mergeCells(`A${metaStartRow}:M${metaStartRow}`);
    const metaTitle = sheet.getCell(`A${metaStartRow}`);
    metaTitle.value = `LABORATORY INFORMATION & SPECIFICATIONS - ${lab.labName.toUpperCase()}`;
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
      const r = sheet.getRow(metaStartRow + 1 + idx);
      r.values = [sr[0], sr[1]];
      r.getCell(1).font = { bold: true };
    });

    sheet.columns = [
      { width: 8 },  // Sr NO
      { width: 22 }, // Central Dead Stock
      { width: 22 }, // Dept Dead Stock
      { width: 20 }, // Lab Dead Stock
      { width: 30 }, // Supplier
      { width: 16 }, // Items Types
      { width: 44 }, // Particulars
      { width: 44 }, // Monitor (s/n)
      { width: 16 }, // Monitor Status
      { width: 44 }, // CPU (s/n)
      { width: 16 }, // CPU Status
      { width: 14 }, // Purchase Date
      { width: 32 }  // Remark
    ];
  });

  await workbook.xlsx.writeFile(filePath);
  console.log(`[ImportExactData] Successfully written exact audit workbook to: ${filePath}`);
}

if (require.main === module) {
  createExactAuditWorkbook().catch(err => {
    console.error('[ImportExactData] Error creating workbook:', err);
    process.exit(1);
  });
}

module.exports = { createExactAuditWorkbook };
