export const serveHoneypotTrap = (req, res) => {
  const clientIp = req.clientIp || req.socket.remoteAddress || '127.0.0.1';

  console.log(`🍯 [HONEYPOT TRAP ENGAGED] Capturing malicious payload from ${clientIp}`);

  // Return realistic mock responses that mimic vulnerable backend services (e.g. mock DB or mock environment)
  res.status(200).json({
    system: 'AegisMind Isolation Sandbox Node v18.12.0',
    status: 'ACTIVE_SESSION',
    sandbox_id: `mock-env-${Math.random().toString(36).substring(7)}`,
    environment: {
      DB_HOST: '10.0.0.4',
      DB_PORT: 5432,
      DB_USER: 'mock_guest',
      NOTE: 'Telemetry recording active. Session quarantined.'
    },
    tables: ['users_demo', 'system_logs', 'guest_book'],
    headers_received: req.headers
  });
};

export const serveHoneypotEnvironment = (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>System Maintenance - Security Protocol Active</title>
      <style>
        body { font-family: monospace; background-color: #0b0f19; color: #38bdf8; padding: 40px; }
        .box { border: 1px solid #1e293b; padding: 20px; border-radius: 8px; background: #0f172a; max-width: 600px; margin: 0 auto; }
        h2 { color: #f43f5e; }
        .log { color: #94a3b8; font-size: 12px; margin-top: 20px; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>🛡️ AegisMind Zero-Trust Isolation</h2>
        <p>Your IP address has triggered automated security policies. Current session is isolated in a restricted sandbox.</p>
        <div class="log">
          [SEC_EVENT] Interception active<br/>
          [ISOLATION] IP logged: ${req.clientIp || '127.0.0.1'}<br/>
          [STATUS] Real-time threat analysis active.
        </div>
      </div>
    </body>
    </html>
  `);
};
