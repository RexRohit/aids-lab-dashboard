import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://aids-lab-dashboard.onrender.com'
);

const socket = io(API_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  withCredentials: true,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('[Socket.IO] Connected to backend server:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.warn('[Socket.IO] Disconnected from backend:', reason);
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`[Socket.IO] Reconnected after ${attemptNumber} attempts.`);
});

export { API_URL };
export default socket;
