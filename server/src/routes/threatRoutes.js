import { Router } from 'express';
import { getThreats, getThreatById, analyzePayload } from '../controllers/threatController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getThreats);
router.get('/:id', getThreatById);
router.post('/analyze', analyzePayload);

export default router;
