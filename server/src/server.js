import http from 'http';
import app from './app.js';
import { initWebSocketServer } from './services/websocketService.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize WebSocket server attached to HTTP server
initWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`
========================================================================
 🛡️  AEGISMIND — AUTONOMOUS ZERO-TRUST CYBER DEFENSE PLATFORM ONLINE
========================================================================
 🌐 HTTP Gateway:      http://localhost:${PORT}
 🔌 WebSocket Stream:  ws://localhost:${PORT}/ws/threats
 🧠 AI Engine:         Google Gemini 2.5 Flash / Standard Rule Engine
 🔒 Sandbox Context:   node:vm Execution Runtime
========================================================================
  `);
});
