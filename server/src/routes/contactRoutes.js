import express from 'express';
import validateRequest from '../middlewares/validateRequest.js';
import { submitContactForm } from '../controllers/contactController.js';
import { contactSchema } from '../validations/contactValidation.js';

const router = express.Router();
router.post('/', validateRequest(contactSchema), submitContactForm);

export default router;
