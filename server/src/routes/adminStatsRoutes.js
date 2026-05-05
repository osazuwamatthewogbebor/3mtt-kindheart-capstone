import express from 'express';
import { getStats, getUsers, getCampaigns, updateCampaignStatus, bulkUpdateCampaignStatus } from '../controllers/adminStatsController.js';
import { isAuth } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/isAdmin.js';
import validateRequest from '../middlewares/validateRequest.js';
import { adminUpdateCampaignStatusSchema, bulkCampaignStatusSchema } from '../validations/campaignValidation.js';

const router = express.Router();

router.get('/stats', isAuth, isAdmin, getStats);
router.get('/users', isAuth, isAdmin, getUsers);
router.get('/campaigns', isAuth, isAdmin, getCampaigns);
router.put('/campaigns/bulk/status', isAuth, isAdmin, validateRequest(bulkCampaignStatusSchema), bulkUpdateCampaignStatus);
router.put('/campaigns/:id/status', isAuth, isAdmin, validateRequest(adminUpdateCampaignStatusSchema), updateCampaignStatus);

export default router;
