require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const excelService = require('./services/excelService');
const googleSheetsService = require('./services/googleSheetsService');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { initWatcher } = require('./utils/watcher');

const app = express();
const server = http.createServer(app);

// Configure CORS for frontend Vite development server & production (Vercel)
const allowedOrigins = [
  'https://aids-lab-dashboard.vercel.app',
  'https://aids-lab-dashboard.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://localhost:10000'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server) or matched origins
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive for deployment flexibility with credentials
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Socket.IO Server initialization with CORS & credentials
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.set('io', io);

// API Routes
app.use('/api', apiRoutes);
app.use('/api/admin', authRoutes); // /api/admin/login, /api/admin/logout, /api/admin/me
app.use('/api/admin', adminRoutes); // /api/admin/records, /api/admin/save, /api/admin/upload-excel, etc.

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  
  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id} (Reason: ${reason})`);
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[Server] Loading initial Excel audit workbook data...');
    await excelService.readAuditWorkbook();
    console.log('[Server] Initial Excel data parsed successfully.');

    // Check Google Sheets status
    if (googleSheetsService.isConfigured()) {
      console.log('[Server] Google Sheets credentials detected. Testing connection...');
      const test = await googleSheetsService.testConnection();
      if (test.connected) {
        console.log(`[Server] Google Sheets persistent storage connected! Sheet Title: "${test.spreadsheetTitle}"`);
        try {
          console.log('[Server] Restoring latest records from Google Sheets into memory...');
          await excelService.syncFromGoogleSheets();
        } catch (syncErr) {
          console.warn('[Server] Notice: Google Sheets initial sync warning (using local backup):', syncErr.message);
        }
      } else {
        console.warn(`[Server] Google Sheets connection warning: ${test.message}`);
      }
    } else {
      console.log('[Server] Google Sheets not configured in .env. Running in local spreadsheet mode with fallback.');
    }

    // Initialize Chokidar Watcher for local Excel file changes
    initWatcher(io);

    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` AI&DS Lab Audit Backend Server Running on Port ${PORT}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api/summary`);
      console.log(` Admin Portal API: http://localhost:${PORT}/api/admin/login`);
      console.log(` Excel Data File: ${excelService.getFilePath()}`);
      console.log(` Google Sheets Configured: ${googleSheetsService.isConfigured()}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[Server] Critical error starting server:', err);
    process.exit(1);
  }
}

startServer();
