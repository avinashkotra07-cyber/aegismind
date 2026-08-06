import { Router } from 'express';
import { getQuarantineList, toggleQuarantine } from '../controllers/quarantineController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getQuarantineList);
router.post('/toggle', toggleQuarantine);

export default router;
