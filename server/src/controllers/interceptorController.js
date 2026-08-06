import { db } from '../config/db.js';
import { broadcastEvent } from '../services/websocketService.js';
import { analyzePayloadWithAI } from '../services/aiThreatService.js';

export const getInterceptorStatus = (req, res) => {
  try {
    const state = db.getInterceptorState();
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve interceptor status: ' + err.message });
  }
};

export const updateInterceptorMode = (req, res) => {
  try {
    const { mode } = req.body;
    if (!['ACTIVE_BLOCK', 'PASSIVE_MONITOR', 'ZERO_TRUST_STRICT'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Allowed: ACTIVE_BLOCK, PASSIVE_MONITOR, ZERO_TRUST_STRICT' });
    }

    const updatedState = db.updateInterceptorMode(mode);
    broadcastEvent('INTERCEPTOR_MODE_CHANGED', updatedState);

    res.json({
      message: `Telemetry Interceptor operational mode updated to ${mode}`,
      state: updatedState
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update interceptor mode: ' + err.message });
  }
};

export const replayPacket = async (req, res) => {
  try {
    const { client_ip = '127.0.0.1', request_method = 'POST', request_path = '/api/v1/data', payload = {}, headers = {} } = req.body;

    const analysis = await analyzePayloadWithAI({
      ip: client_ip,
      method: request_method,
      path: request_path,
      headers,
      body: payload
    });

    const state = db.getInterceptorState();
    const isBlocked = (state.mode === 'ACTIVE_BLOCK' || state.mode === 'ZERO_TRUST_STRICT') && analysis.risk_score >= 80;

    const packetResult = {
      id: `replayed-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      client_ip,
      method: request_method,
      path: request_path,
      payload,
      analysis,
      verdict: isBlocked ? 'BLOCKED' : analysis.risk_score >= 80 ? 'QUARANTINED' : 'ALLOWED'
    };

    broadcastEvent('PACKET_INTERCEPTED', packetResult);

    res.json(packetResult);
  } catch (err) {
    res.status(400).json({ error: 'Packet replay analysis failed: ' + err.message });
  }
};
