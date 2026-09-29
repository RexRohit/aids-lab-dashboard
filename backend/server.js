const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const excelService = require('./services/excelService');
const apiRoutes = require('./routes/api');
const { initWatcher } = require('./utils/watcher');

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend Vite development server & production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO Server initialization
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

// API Routes
app.use('/api', apiRoutes);

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[Server] Loading initial Excel audit workbook data...');
    await excelService.readAuditWorkbook();
    console.log('[Server] Initial Excel data parsed successfully.');

    // Initialize Chokidar Watcher
    initWatcher(io);

    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` AI&DS Lab Audit Backend Server Running on Port ${PORT}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api/summary`);
      console.log(` Excel Data File: ${excelService.getFilePath()}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[Server] Critical error starting server:', err);
    process.exit(1);
  }
}

startServer();
