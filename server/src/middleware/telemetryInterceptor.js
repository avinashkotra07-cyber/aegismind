import { analyzePayloadWithAI } from '../services/aiThreatService.js';
import { generateCodePatch } from '../services/patchGeneratorService.js';
import { db } from '../config/db.js';
import { broadcastEvent } from '../services/websocketService.js';

export const telemetryInterceptor = async (req, res, next) => {
  // Skip telemetry on static, healthcheck, auth, or internal API calls unless requested
  if (
    req.path.startsWith('/api/v1/auth') ||
    req.path.startsWith('/api/v1/policies') ||
    req.path.startsWith('/api/v1/remediation') ||
    req.path.startsWith('/api/v1/quarantine') ||
    req.path.startsWith('/api/v1/interceptor') ||
    req.path.startsWith('/api/honeypot')
  ) {
    return next();
  }

  const clientIp = req.clientIp || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
  const method = req.method;
  const path = req.path;
  const headers = req.headers || {};
  const body = req.body || {};
  const query = req.query || {};

  const hasPayload = Object.keys(body).length > 0 || Object.keys(query).length > 0 || /sqlmap|nikto|curl|python/i.test(headers['user-agent'] || '');

  if (!hasPayload && method === 'GET') {
    return next();
  }

  try {
    const interceptorState = db.getInterceptorState();
    const mode = interceptorState.mode || 'ACTIVE_BLOCK';

    // Run AI Threat Classification
    const analysis = await analyzePayloadWithAI({ ip: clientIp, method, path, headers, body, query });

    const isBlocked = (mode === 'ACTIVE_BLOCK' || mode === 'ZERO_TRUST_STRICT') && analysis.risk_score >= 80;

    // Increment telemetry counters
    db.incrementPacketCount(isBlocked);

    // Broadcast Packet Event to Live Traffic Interceptor UI
    const packetEvent = {
      id: `pkt-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      client_ip: clientIp,
      method,
      path,
      headers: { 'user-agent': headers['user-agent'] || 'Unknown' },
      body,
      query,
      threat_category: analysis.threat_category,
      owasp_mapping: analysis.owasp_mapping,
      risk_score: analysis.risk_score,
      is_malicious: analysis.is_malicious,
      mode_active: mode,
      action: isBlocked ? 'BLOCKED' : analysis.risk_score >= 80 ? 'QUARANTINED' : 'PASSED'
    };

    broadcastEvent('PACKET_INTERCEPTED', packetEvent);

    if (analysis.is_malicious || analysis.risk_score >= 40) {
      console.warn(`⚠️ [TELEMETRY DETECTED] Threat Category: ${analysis.threat_category} | Score: ${analysis.risk_score}/100 | Mode: ${mode}`);

      const policy = db.getPolicies();
      const quarantineThreshold = policy?.quarantine_threshold || 80;
      const autoPatchThreshold = policy?.auto_patch_threshold || 90;

      // 1. Record Incident
      const incident = db.createThreat({
        client_ip: clientIp,
        request_method: method,
        request_path: path,
        payload: { body, query },
        headers: { 'user-agent': headers['user-agent'] || 'Unknown' },
        threat_category: analysis.threat_category,
        owasp_mapping: analysis.owasp_mapping,
        risk_score: analysis.risk_score,
        action_taken: isBlocked ? 'BLOCKED' : analysis.risk_score >= quarantineThreshold ? 'QUARANTINED' : 'LOGGED',
        is_quarantined: analysis.risk_score >= quarantineThreshold
      });

      // 2. Broadcast Live Threat Event to SOC Dashboard via WebSocket
      broadcastEvent('THREAT_INTERCEPTED', incident);

      // 3. Dynamic Quarantine Trigger
      if (analysis.risk_score >= quarantineThreshold) {
        const quarantineEntry = db.addToQuarantine({
          ip_address: clientIp,
          reason: `${analysis.owasp_mapping}: ${analysis.threat_category} attack detected on ${path} (Risk Score: ${analysis.risk_score})`,
          associated_incident_id: incident.id
        });
        broadcastEvent('QUARANTINE_ADDED', quarantineEntry);
      }

      // 4. Autonomous Patch Generation Trigger
      if (analysis.risk_score >= autoPatchThreshold) {
        try {
          const patchData = await generateCodePatch({ incident });
          const newPatch = db.createPatch({
            incident_id: incident.id,
            ...patchData
          });
          broadcastEvent('PATCH_PROPOSED', newPatch);
        } catch (patchErr) {
          console.error('Failed to generate automatic code patch:', patchErr);
        }
      }

      // 5. Active Blocking enforcement if mode is ACTIVE_BLOCK or ZERO_TRUST_STRICT
      if (isBlocked) {
        return res.status(403).json({
          status: 'BLOCKED_BY_INTERCEPTOR',
          message: 'Zero-Trust Telemetry Interceptor actively dropped request packet due to critical threat score.',
          threat: {
            category: analysis.threat_category,
            owasp: analysis.owasp_mapping,
            risk_score: analysis.risk_score
          },
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.error('Error in telemetryInterceptor:', err);
  }

  next();
};
