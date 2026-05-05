import express from 'express';
import { createCampaign, getCampaignById, listCampaigns, updateCampaign, updateCampaignImage } from '../controllers/campaignController.js';
import { isAuth, protect, requireVerified } from '../middlewares/authMiddleware.js';
import validateRequest from '../middlewares/validateRequest.js';
import { createCampaignSchema, getCampaignByIdSchema, updateCampaignSchema } from '../validations/campaignValidation.js';
import { uploadCampaignImage } from '../middlewares/uploadMiddleware.js';
import { searchSchema } from '../validations/campaignSearchValidations.js';
import { handleSearch } from '../controllers/campaignSearchController.js';

const router = express.Router();

router.post('/', isAuth, uploadCampaignImage, validateRequest(createCampaignSchema), createCampaign);
router.get('/', listCampaigns);
router.get("/search", validateRequest(searchSchema, "query"), handleSearch)
router.get('/:id', getCampaignById);
router.put('/:id', protect, requireVerified, validateRequest(updateCampaignSchema), updateCampaign);
router.patch('/:id/image', protect, requireVerified, uploadCampaignImage, updateCampaignImage);


export default router;