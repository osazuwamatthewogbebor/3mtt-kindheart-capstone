import express from 'express';
import passport from 'passport';
import {
	forgotPassword,
	getMe,
	googleAuthCallback,
	loginUser,
	logoutUser,
	refreshAuthToken,
	registerUser,
	resetPassword,
	verifyEmail,
	resendVerificationEmailLink,
} from '../controllers/authController.js';
import { authorizeRoles, protect } from '../middlewares/authMiddleware.js';
import validateRequest from '../middlewares/validateRequest.js';
import {
	forgotPasswordSchema,
	loginSchema,
	registerSchema,
	resetPasswordSchema,
} from '../validations/authValidation.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(loginSchema), loginUser);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
	'/google/callback',
	passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failure' }),
	googleAuthCallback,
);
router.get('/google/failure', (req, res) => {
	res.status(401).json({
		success: false,
		message: 'Google authentication failed',
	});
});
router.post('/refresh-token', refreshAuthToken);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmailLink);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.get('/reset-password/:token', resetPassword);
router.post('/reset-password/:token', validateRequest(resetPasswordSchema), resetPassword);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

router.get('/admin', protect, authorizeRoles('ADMIN'), (req, res) => {
	res.status(200).json({
		success: true,
		message: 'Admin access granted',
	});
});

export default router;
