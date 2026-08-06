import { Router } from 'express';
import { getPolicies, updatePolicies } from '../controllers/policyController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getPolicies);
router.put('/', requireRole('admin'), updatePolicies);

export default router;
