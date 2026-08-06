import { Router } from 'express';
import { getInterceptorStatus, updateInterceptorMode, replayPacket } from '../controllers/interceptorController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/status', getInterceptorStatus);
router.put('/mode', updateInterceptorMode);
router.post('/replay', replayPacket);

export default router;
