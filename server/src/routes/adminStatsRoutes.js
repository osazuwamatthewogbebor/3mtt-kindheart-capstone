import express from 'express';
import { getStats, getUsers, getCampaigns, updateCampaignStatus, bulkUpdateCampaignStatus, updateUserVerification, updateUserRole } from '../controllers/adminStatsController.js';
import { isAuth, requireVerified } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/isAdmin.js';
import validateRequest from '../middlewares/validateRequest.js';
import { adminUpdateCampaignStatusSchema, bulkCampaignStatusSchema } from '../validations/campaignValidation.js';

const router = express.Router();

router.get('/stats', isAuth, requireVerified, isAdmin, getStats);
router.get('/users', isAuth, requireVerified, isAdmin, getUsers);
router.put('/users/:id/verification', isAuth, requireVerified, isAdmin, updateUserVerification);
router.put('/users/:id/role', isAuth, requireVerified, isAdmin, updateUserRole);
router.get('/campaigns', isAuth, requireVerified, isAdmin, getCampaigns);
router.put('/campaigns/bulk/status', isAuth, requireVerified, isAdmin, validateRequest(bulkCampaignStatusSchema), bulkUpdateCampaignStatus);
router.put('/campaigns/:id/status', isAuth, requireVerified, isAdmin, validateRequest(adminUpdateCampaignStatusSchema), updateCampaignStatus);

export default router;
