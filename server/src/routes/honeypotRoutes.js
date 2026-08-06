import { Router } from 'express';
import { serveHoneypotTrap, serveHoneypotEnvironment } from '../controllers/honeypotController.js';

const router = Router();

router.all('/trap', serveHoneypotTrap);
router.all('/environment', serveHoneypotEnvironment);
router.all('/*', serveHoneypotTrap);

export default router;
