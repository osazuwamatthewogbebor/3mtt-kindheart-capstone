import express from 'express';
import { getPublicStats } from '../controllers/adminStatsController.js';

const router = express.Router();

// Public stats endpoint - no authentication required
router.get('/', getPublicStats);

export default router;
