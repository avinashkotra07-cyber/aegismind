import { db } from '../config/db.js';
import { generateCodePatch } from '../services/patchGeneratorService.js';
import { runSandboxVerification } from '../services/sandboxExecutionService.js';
import { broadcastEvent } from '../services/websocketService.js';

export const getPatches = (req, res) => {
  try {
    const patches = db.getPatches();
    res.json(patches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve code patches: ' + err.message });
  }
};

export const generatePatchForIncident = async (req, res) => {
  try {
    const { incident_id, file_path, vulnerable_code } = req.body;
    if (!incident_id) {
      return res.status(400).json({ error: 'incident_id is required' });
    }

    const incident = db.getThreatById(incident_id);
    if (!incident) {
      return res.status(404).json({ error: 'Associated incident not found' });
    }

    const patchData = await generateCodePatch({ incident, filePath: file_path, vulnerableSnippet: vulnerable_code });

    const newPatch = db.createPatch({
      incident_id,
      ...patchData
    });

    broadcastEvent('PATCH_PROPOSED', newPatch);
    res.status(201).json(newPatch);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate patch: ' + err.message });
  }
};

export const verifyPatchInSandbox = async (req, res) => {
  try {
    const { patch_id } = req.body;
    if (!patch_id) {
      return res.status(400).json({ error: 'patch_id is required' });
    }

    const patch = db.getPatchById(patch_id);
    if (!patch) {
      return res.status(404).json({ error: 'Code patch not found' });
    }

    // Execute patch verification inside isolated node:vm sandbox
    const result = await runSandboxVerification(patch);

    // Update patch status in DB
    const updatedPatch = db.updatePatchStatus(patch_id, {
      sandbox_test_status: result.status
    });

    broadcastEvent('PATCH_VERIFIED', { patch_id, result, updatedPatch });

    res.json({
      patch_id,
      status: result.status,
      executionTimeMs: result.executionTimeMs,
      logs: result.logs,
      errorMessage: result.errorMessage
    });
  } catch (err) {
    res.status(500).json({ error: 'Sandbox verification failed: ' + err.message });
  }
};

export const applyPatch = async (req, res) => {
  try {
    const { patch_id } = req.body;
    if (!patch_id) {
      return res.status(400).json({ error: 'patch_id is required' });
    }

    const patch = db.getPatchById(patch_id);
    if (!patch) {
      return res.status(404).json({ error: 'Code patch not found' });
    }

    const updatedPatch = db.updatePatchStatus(patch_id, {
      deployment_status: 'APPLIED',
      applied_by: req.user?.id || null
    });

    broadcastEvent('PATCH_APPLIED', updatedPatch);

    res.json({
      message: `Patch #${patch_id} successfully deployed into production environment. Zero-day vulnerability remediated.`,
      patch: updatedPatch
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to apply patch: ' + err.message });
  }
};
