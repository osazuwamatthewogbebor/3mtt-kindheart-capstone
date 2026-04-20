import express from 'express';
import { createCampaign, getCampaignById, listCampaigns, updateCampaign } from '../controllers/campaignController.js';
import { protect, requireVerified } from '../middlewares/authMiddleware.js';
import validateRequest from '../middlewares/validateRequest.js';
import { createCampaignSchema, updateCampaignSchema } from '../validations/campaignValidation.js';

const router = express.Router();

router.post('/', protect, requireVerified, validateRequest(createCampaignSchema), createCampaign);
router.get('/', listCampaigns);
router.get('/:id', getCampaignById);
router.put('/:id', protect, requireVerified, validateRequest(updateCampaignSchema), updateCampaign);

export default router;