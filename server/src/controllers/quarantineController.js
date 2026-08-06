import { db } from '../config/db.js';
import { broadcastEvent } from '../services/websocketService.js';

export const getQuarantineList = (req, res) => {
  try {
    const list = db.getQuarantineList();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve quarantine blacklist: ' + err.message });
  }
};

export const toggleQuarantine = (req, res) => {
  try {
    const { ip_address, action, reason } = req.body;
    if (!ip_address) {
      return res.status(400).json({ error: 'ip_address parameter is required' });
    }

    if (action === 'RELEASE' || action === 'REMOVE') {
      db.removeFromQuarantine(ip_address);
      broadcastEvent('QUARANTINE_RELEASED', { ip_address });
      return res.json({ message: `IP ${ip_address} has been released from quarantine isolation.`, status: 'RELEASED' });
    } else {
      const entry = db.addToQuarantine({
        ip_address,
        reason: reason || 'Manual SOC Quarantine Override by Administrator'
      });
      broadcastEvent('QUARANTINE_ADDED', entry);
      return res.json({ message: `IP ${ip_address} has been placed under honeypot quarantine.`, status: 'ACTIVE', entry });
    }
  } catch (err) {
    res.status(500).json({ error: 'Quarantine toggle operation failed: ' + err.message });
  }
};
