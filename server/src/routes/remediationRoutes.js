import { Router } from 'express';
import { getPatches, generatePatchForIncident, verifyPatchInSandbox, applyPatch } from '../controllers/remediationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/patches', getPatches);
router.post('/generate', generatePatchForIncident);
router.post('/verify', verifyPatchInSandbox);
router.post('/apply', applyPatch);

export default router;
