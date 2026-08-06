import { db } from '../config/db.js';

export const quarantineMiddleware = (req, res, next) => {
  // Extract client IP (handle proxies like X-Forwarded-For)
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
  req.clientIp = clientIp;

  // Allow auth, policy, remediation, quarantine, interceptor, threats management and honeypot routes to pass through quarantine checks
  if (
    req.path.startsWith('/api/v1/auth') ||
    req.path.startsWith('/api/v1/policies') ||
    req.path.startsWith('/api/v1/remediation') ||
    req.path.startsWith('/api/v1/quarantine') ||
    req.path.startsWith('/api/v1/interceptor') ||
    req.path.startsWith('/api/v1/threats') ||
    req.path.startsWith('/api/honeypot') ||
    req.path.startsWith('/ws')
  ) {
    return next();
  }

  // Check if IP is in quarantine blacklist
  const isQuarantined = db.isIpQuarantined(clientIp);

  if (isQuarantined) {
    console.warn(`🚨 [QUARANTINE ENFORCED] Flagged IP ${clientIp} intercepted. Rerouting to Mock Honeypot.`);
    
    // Reroute internally or return mock honeypot payload
    req.url = '/api/honeypot/trap';
    return res.status(403).json({
      status: 'QUARANTINED',
      message: 'Zero-Trust Protocol Active: Suspicious activity detected. Client session placed under isolation.',
      honeypot_redirect: '/api/honeypot/environment',
      timestamp: new Date().toISOString()
    });
  }

  next();
};
