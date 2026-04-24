import express from 'express';
import { createCampaign, getCampaignById, listCampaigns, updateCampaign, updateCampaignImage } from '../controllers/campaignController.js';
import { isAuth, protect, requireVerified } from '../middlewares/authMiddleware.js';
import validateRequest from '../middlewares/validateRequest.js';
import { createCampaignSchema, updateCampaignSchema } from '../validations/campaignValidation.js';
import { uploadCampaignImage } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/', isAuth, uploadCampaignImage, validateRequest(createCampaignSchema), createCampaign);
router.get('/', listCampaigns);
router.get('/:id', getCampaignById);
router.put('/:id', protect, requireVerified, validateRequest(updateCampaignSchema), updateCampaign);
router.patch('/:id/image', protect, requireVerified, uploadCampaignImage, updateCampaignImage);

export default router;