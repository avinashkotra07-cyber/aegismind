import { WebSocketServer } from 'ws';

let wss = null;

export const initWebSocketServer = (server) => {
  wss = new WebSocketServer({ server, path: '/ws/threats' });

  wss.on('connection', (ws, req) => {
    console.log(`🔌 Client connected to AegisMind Real-Time Telemetry Stream (${req.socket.remoteAddress})`);

    // Send initial handshake state message
    ws.send(
      JSON.stringify({
        type: 'SYSTEM_STATUS',
        data: { status: 'ONLINE', mode: 'ZERO_TRUST_INTERCEPT', connectedAt: new Date().toISOString() }
      })
    );

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
        }
      } catch (err) {
        // Ignore unparseable client messages
      }
    });

    ws.on('close', () => {
      console.log('🔌 Client disconnected from Telemetry Stream');
    });
  });

  return wss;
};

export const broadcastEvent = (eventType, payload) => {
  if (!wss) return;

  const msg = JSON.stringify({
    type: eventType,
    data: payload,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(msg);
    }
  });
};
