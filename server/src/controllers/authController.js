import bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import logger from '../config/logger.js';
import { sendVerificationEmail } from '../services/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const refreshCookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'strict',
	maxAge: REFRESH_TOKEN_MAX_AGE_MS,
	path: '/api/auth',
};

if (!JWT_SECRET) {
	throw new Error('Missing required environment variable: JWT_SECRET');
}

const createAccessToken = (user) =>
	jwt.sign({ id: user.id, role: user.role, jti: randomUUID() }, JWT_SECRET, {
		expiresIn: ACCESS_TOKEN_EXPIRES_IN,
	});

const createRefreshToken = (user) =>
	jwt.sign({ id: user.id, type: 'refresh', jti: randomUUID() }, JWT_SECRET, {
		expiresIn: REFRESH_TOKEN_EXPIRES_IN,
	});

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

const getCookieValue = (req, key) => {
	const cookieHeader = req.headers.cookie;

	if (!cookieHeader) {
		return null;
	}

	const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
	const found = cookies.find((cookie) => cookie.startsWith(`${key}=`));

	if (!found) {
		return null;
	}

	return decodeURIComponent(found.slice(key.length + 1));
};

const sanitizeUser = (user) => ({
	id: user.id,
	name: user.name,
	email: user.email,
	role: user.role,
	profile_picture: user.profile_picture,
	created_at: user.created_at,
});

export const registerUser = async (req, res, next) => {
	try {
		const { name, email, password } = req.body;

		const existingUser = await prisma.user.findUnique({
			where: { email: email.toLowerCase() },
		});

		if (existingUser) {
			const error = new Error('email is already in use');
			error.statusCode = 409;
			throw error;
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const rawVerificationToken = randomBytes(32).toString('hex');
		const hashedVerificationToken = createHash('sha256')
			.update(rawVerificationToken)
			.digest('hex');
		const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

		const user = await prisma.user.create({
			data: {
				name,
				email: email.toLowerCase(),
				password: hashedPassword,
				isVerified: false,
				emailVerificationToken: hashedVerificationToken,
				emailVerificationExpiry,
			},
		});

		const token = createAccessToken(user);
		const appUrl = process.env.APP_URL || 'http://localhost:3000';
		const verificationLink = `${appUrl}/api/auth/verify-email?token=${rawVerificationToken}`;
		let emailSent = true;

		try {
			await sendVerificationEmail({
				to: user.email,
				name: user.name,
				verificationLink,
			});
		} catch (emailError) {
			emailSent = false;
			logger.error(`Verification email failed: ${emailError.message}`);
		}

		res.status(201).json({
			success: true,
			message: emailSent
				? 'User registered successfully. Verification email sent.'
				: 'User registered successfully. Verification email could not be sent right now.',
			accessToken: token,
			verificationLink:
				process.env.NODE_ENV === 'production' && emailSent ? undefined : verificationLink,
			user: sanitizeUser(user),
		});
	} catch (error) {
		next(error);
	}
};

export const loginUser = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		const user = await prisma.user.findUnique({
			where: { email: email?.toLowerCase() },
		});

		if (!user) {
			const error = new Error('Invalid email or password');
			error.statusCode = 401;
			throw error;
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			const error = new Error('Invalid email or password');
			error.statusCode = 401;
			throw error;
		}

		if (!user.isVerified) {
			const error = new Error('Please verify your email');
			error.statusCode = 403;
			throw error;
		}

		const accessToken = createAccessToken(user);
		const refreshToken = createRefreshToken(user);
		const hashedRefreshToken = hashToken(refreshToken);
		const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		await prisma.session.create({
			data: {
				userId: user.id,
				refreshToken: hashedRefreshToken,
				userAgent: req.headers['user-agent'] || null,
				ipAddress: req.ip || null,
				expiresAt: refreshTokenExpiresAt,
			},
		});

		res.cookie('refreshToken', refreshToken, refreshCookieOptions);

		res.status(200).json({
			success: true,
			message: 'Login successful',
			accessToken,
			refreshToken,
			user: sanitizeUser(user),
		});
	} catch (error) {
		next(error);
	}
};

export const refreshAuthToken = async (req, res, next) => {
	try {
		const refreshToken = req.body.refreshToken || getCookieValue(req, 'refreshToken');

		if (!refreshToken) {
			const error = new Error('refreshToken is required');
			error.statusCode = 400;
			throw error;
		}

		let decoded;
		try {
			decoded = jwt.verify(refreshToken, JWT_SECRET);
		} catch {
			const error = new Error('Invalid or expired refresh token');
			error.statusCode = 401;
			throw error;
		}

		if (decoded.type !== 'refresh') {
			const error = new Error('Invalid token type');
			error.statusCode = 401;
			throw error;
		}

		const hashedRefreshToken = hashToken(refreshToken);

		const session = await prisma.session.findFirst({
			where: {
				userId: decoded.id,
				refreshToken: hashedRefreshToken,
				expiresAt: {
					gt: new Date(),
				},
			},
			include: {
				user: true,
			},
		});

		if (!session) {
			const error = new Error('Refresh session not found or expired');
			error.statusCode = 401;
			throw error;
		}

		if (!session.user.isVerified) {
			const error = new Error('Please verify your email');
			error.statusCode = 403;
			throw error;
		}

		const accessToken = createAccessToken(session.user);

		res.status(200).json({
			success: true,
			message: 'Token refreshed successfully',
			accessToken,
		});
	} catch (error) {
		next(error);
	}
};

export const logoutUser = async (req, res, next) => {
	try {
		const refreshToken = req.body.refreshToken || getCookieValue(req, 'refreshToken');

		if (!refreshToken) {
			const error = new Error('refreshToken is required');
			error.statusCode = 400;
			throw error;
		}
		const hashedRefreshToken = hashToken(refreshToken);

		await prisma.session.deleteMany({
			where: {
				refreshToken: hashedRefreshToken,
			},
		});

		res.clearCookie('refreshToken', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			path: '/api/auth',
		});

		res.status(200).json({
			success: true,
			message: 'Logout successful',
		});
	} catch (error) {
		next(error);
	}
};

export const getMe = async (req, res, next) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				profile_picture: true,
				created_at: true,
			},
		});

		if (!user) {
			const error = new Error('User not found');
			error.statusCode = 404;
			throw error;
		}

		res.status(200).json({
			success: true,
			user,
		});
	} catch (error) {
		next(error);
	}
};

export const forgotPassword = async (req, res, next) => {
	try {
		const { email } = req.body;

		const user = await prisma.user.findUnique({
			where: { email: email.toLowerCase() },
		});

		if (!user) {
			const error = new Error('User with this email does not exist');
			error.statusCode = 404;
			throw error;
		}

		const rawToken = randomBytes(32).toString('hex');
		const hashedToken = createHash('sha256').update(rawToken).digest('hex');
		const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

		await prisma.user.update({
			where: { id: user.id },
			data: {
				resetToken: hashedToken,
				resetTokenExpiry,
			},
		});

		const appUrl = process.env.APP_URL || 'http://localhost:3000';
		const resetLink = `${appUrl}/api/auth/reset-password/${rawToken}`;

		res.status(200).json({
			success: true,
			message: 'Password reset link generated',
			resetLink,
		});
	} catch (error) {
		next(error);
	}
};

export const resetPassword = async (req, res, next) => {
	try {
		const token = req.params.token?.trim() || req.query.token?.trim();
		const { password } = req.body;

		if (!token) {
			const error = new Error('Reset token is required');
			error.statusCode = 400;
			throw error;
		}

		const hashedToken = createHash('sha256').update(token).digest('hex');

		const user = await prisma.user.findFirst({
			where: {
				resetToken: hashedToken,
				resetTokenExpiry: {
					gt: new Date(),
				},
			},
		});

		if (!user) {
			const error = new Error('Invalid or expired reset token');
			error.statusCode = 400;
			throw error;
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		await prisma.user.update({
			where: { id: user.id },
			data: {
				password: hashedPassword,
				resetToken: null,
				resetTokenExpiry: null,
			},
		});

		res.status(200).json({
			success: true,
			message: 'Password reset successful',
		});
	} catch (error) {
		next(error);
	}
};

export const verifyEmail = async (req, res, next) => {
	try {
		const token = req.query.token?.trim() || req.params.token?.trim();

		if (!token) {
			const error = new Error('Verification token is required');
			error.statusCode = 400;
			throw error;
		}

		const hashedToken = createHash('sha256').update(token).digest('hex');

		const user = await prisma.user.findFirst({
			where: {
				emailVerificationToken: hashedToken,
				emailVerificationExpiry: {
					gt: new Date(),
				},
			},
		});

		if (!user) {
			const error = new Error('Invalid or expired verification token');
			error.statusCode = 400;
			throw error;
		}

		await prisma.user.update({
			where: { id: user.id },
			data: {
				isVerified: true,
				emailVerificationToken: null,
				emailVerificationExpiry: null,
			},
		});

		res.status(200).json({
			success: true,
			message: 'Email verified successfully',
		});
	} catch (error) {
		next(error);
	}
};

export const googleAuthCallback = async (req, res, next) => {
	try {
		const user = req.user;

		if (!user) {
			const error = new Error('Google authentication failed');
			error.statusCode = 401;
			throw error;
		}

		const accessToken = createAccessToken(user);
		const refreshToken = createRefreshToken(user);
		const hashedRefreshToken = hashToken(refreshToken);
		const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		await prisma.session.create({
			data: {
				userId: user.id,
				refreshToken: hashedRefreshToken,
				userAgent: req.headers['user-agent'] || null,
				ipAddress: req.ip || null,
				expiresAt: refreshTokenExpiresAt,
			},
		});

		res.cookie('refreshToken', refreshToken, refreshCookieOptions);

		res.status(200).json({
			success: true,
			message: 'Google login successful',
			accessToken,
			refreshToken,
			user: sanitizeUser(user),
		});
	} catch (error) {
		next(error);
	}
};
