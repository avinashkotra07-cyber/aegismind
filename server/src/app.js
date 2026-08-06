import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { quarantineMiddleware } from './middleware/quarantineMiddleware.js';
import { telemetryInterceptor } from './middleware/telemetryInterceptor.js';

import authRoutes from './routes/authRoutes.js';
import threatRoutes from './routes/threatRoutes.js';
import remediationRoutes from './routes/remediationRoutes.js';
import quarantineRoutes from './routes/quarantineRoutes.js';
import policyRoutes from './routes/policyRoutes.js';
import honeypotRoutes from './routes/honeypotRoutes.js';
import interceptorRoutes from './routes/interceptorRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 1. Dynamic Quarantine Interceptor Middleware
app.use(quarantineMiddleware);

// 2. Zero-Trust Telemetry Inspection Middleware
app.use(telemetryInterceptor);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/threats', threatRoutes);
app.use('/api/v1/remediation', remediationRoutes);
app.use('/api/v1/quarantine', quarantineRoutes);
app.use('/api/v1/policies', policyRoutes);
app.use('/api/v1/interceptor', interceptorRoutes);
app.use('/api/honeypot', honeypotRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'AegisMind Core Engine',
    version: '1.0.0-enterprise',
    timestamp: new Date().toISOString()
  });
});

// Attack Simulation Endpoint (For testing/demonstration)
app.post('/api/v1/simulate-attack', (req, res) => {
  res.json({
    status: 'PROCESSED',
    message: 'Attack payload evaluated by AegisMind Zero-Trust Telemetry Interceptor.'
  });
});

// Serve Static React Client Build if available (for Render / Single Server Deployments)
const possibleDistPaths = [
  path.join(__dirname, '../../client/dist'),
  path.join(__dirname, '../client/dist'),
  path.join(__dirname, './client/dist')
];

let activeDistPath = null;
for (const p of possibleDistPaths) {
  if (fs.existsSync(p)) {
    activeDistPath = p;
    break;
  }
}

if (activeDistPath) {
  console.log(`📁 Serving React frontend static assets from: ${activeDistPath}`);
  app.use(express.static(activeDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(activeDistPath, 'index.html'));
  });
} else {
  // Landing fallback page if accessed directly at root without static build
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>AegisMind — Autonomous Cyber Defense Gateway</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #090d16; color: #f8fafc; padding: 40px; text-align: center; }
          .card { max-width: 600px; margin: 40px auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,242,254,0.1); }
          h1 { color: #00f2fe; margin-bottom: 8px; font-family: monospace; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
          .btn { display: inline-block; background: linear-gradient(135deg, #00f2fe, #3b82f6); color: #090d16; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none; margin-top: 16px; font-family: monospace; }
          .status { font-family: monospace; color: #10b981; font-size: 12px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🛡️ AEGISMIND SECURITY GATEWAY</h1>
          <p>Autonomous Zero-Trust Cyber Defense & Dynamic Remediation API Ecosystem Online.</p>
          <a href="/health" class="btn">CHECK SYSTEM HEALTH</a>
          <div class="status">● API STATUS: ONLINE (v1.0.0)</div>
        </div>
      </body>
      </html>
    `);
  });
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found on AegisMind Security Gateway.` });
});

export default app;
