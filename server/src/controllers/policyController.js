import { db } from '../config/db.js';
import { PolicyUpdateSchema } from '../validators/threatValidator.js';
import { broadcastEvent } from '../services/websocketService.js';

export const getPolicies = (req, res) => {
  try {
    const policy = db.getPolicies();
    res.json(policy);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve system policies: ' + err.message });
  }
};

export const updatePolicies = (req, res) => {
  try {
    const validatedData = PolicyUpdateSchema.parse(req.body);
    const updated = db.updatePolicies(validatedData);

    broadcastEvent('POLICY_UPDATED', updated);
    res.json({
      message: 'Zero-Trust Security Policies updated successfully.',
      policy: updated
    });
  } catch (err) {
    res.status(400).json({ error: 'Policy update invalid: ' + err.message });
  }
};
