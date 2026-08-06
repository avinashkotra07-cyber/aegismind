import { db } from '../config/db.js';
import { analyzePayloadWithAI } from '../services/aiThreatService.js';
import { generateCodePatch } from '../services/patchGeneratorService.js';
import { broadcastEvent } from '../services/websocketService.js';
import { ThreatAnalysisSchema } from '../validators/threatValidator.js';

export const getThreats = (req, res) => {
  try {
    const { page = 1, limit = 50, category, search, minScore } = req.query;
    const result = db.getThreats({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      category,
      search,
      minScore
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch threat incidents: ' + err.message });
  }
};

export const getThreatById = (req, res) => {
  try {
    const { id } = req.params;
    const threat = db.getThreatById(id);
    if (!threat) {
      return res.status(404).json({ error: 'Threat incident not found.' });
    }
    res.json(threat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve threat details: ' + err.message });
  }
};

export const analyzePayload = async (req, res) => {
  try {
    const validatedData = ThreatAnalysisSchema.parse(req.body);
    const { client_ip, request_method, request_path, payload, headers } = validatedData;

    const analysis = await analyzePayloadWithAI({
      ip: client_ip,
      method: request_method,
      path: request_path,
      headers,
      body: payload
    });

    const policy = db.getPolicies();
    const quarantineThreshold = policy?.quarantine_threshold || 80;
    const autoPatchThreshold = policy?.auto_patch_threshold || 90;

    const incident = db.createThreat({
      client_ip: client_ip,
      request_method,
      request_path,
      payload,
      headers,
      threat_category: analysis.threat_category,
      owasp_mapping: analysis.owasp_mapping,
      risk_score: analysis.risk_score,
      action_taken: analysis.risk_score >= quarantineThreshold ? 'QUARANTINED' : 'LOGGED',
      is_quarantined: analysis.risk_score >= quarantineThreshold
    });

    broadcastEvent('THREAT_INTERCEPTED', incident);

    if (analysis.risk_score >= quarantineThreshold) {
      const quarantineEntry = db.addToQuarantine({
        ip_address: client_ip,
        reason: `Manual Analysis Trigger: ${analysis.owasp_mapping} - ${analysis.threat_category} (Score: ${analysis.risk_score})`,
        associated_incident_id: incident.id
      });
      broadcastEvent('QUARANTINE_ADDED', quarantineEntry);
    }

    let patch = null;
    if (analysis.risk_score >= autoPatchThreshold) {
      const patchData = await generateCodePatch({ incident });
      patch = db.createPatch({ incident_id: incident.id, ...patchData });
      broadcastEvent('PATCH_PROPOSED', patch);
    }

    res.json({
      incident,
      analysis,
      patch
    });
  } catch (err) {
    res.status(400).json({ error: 'Payload analysis failed: ' + err.message });
  }
};
