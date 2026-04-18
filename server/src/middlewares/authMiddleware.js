import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { isTokenBlacklisted } from '../utils/tokenBlacklist.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
	throw new Error('Missing required environment variable: JWT_SECRET');
}

export const protect = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			const error = new Error('Not authorized. Token missing.');
			error.statusCode = 401;
			throw error;
		}

		const token = authHeader.split(' ')[1];
		const decoded = jwt.verify(token, JWT_SECRET);

		if (decoded.type === 'refresh') {
			const error = new Error('Not authorized. Access token required.');
			error.statusCode = 401;
			throw error;
		}

		if (await isTokenBlacklisted(decoded.jti)) {
			const error = new Error('Not authorized. Token has been revoked.');
			error.statusCode = 401;
			throw error;
		}

		const user = await prisma.user.findUnique({
			where: { id: decoded.id },
			select: {
				id: true,
				name: true,
				email: true,
				isVerified: true,
				role: true,
				profile_picture: true,
				created_at: true,
			},
		});

		if (!user) {
			const error = new Error('Not authorized. User no longer exists.');
			error.statusCode = 401;
			throw error;
		}

		req.user = user;
		req.token = token;
		req.jwtPayload = decoded;
		next();
	} catch (error) {
		if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
			const authError = new Error('Not authorized. Invalid or expired token.');
			authError.statusCode = 401;
			return next(authError);
		}

		return next(error);
	}
};

export const authorizeRoles = (...roles) => (req, res, next) => {
	if (!req.user) {
		const error = new Error('Not authorized. User context is missing.');
		error.statusCode = 401;
		return next(error);
	}

	if (!roles.includes(req.user.role)) {
		const error = new Error('Forbidden. Insufficient permissions.');
		error.statusCode = 403;
		return next(error);
	}

	return next();
};

export const requireVerified = (req, res, next) => {
	if (!req.user) {
		const error = new Error('Not authorized. User context is missing.');
		error.statusCode = 401;
		return next(error);
	}

	if (!req.user.isVerified) {
		const error = new Error('Please verify your email to perform this action');
		error.statusCode = 403;
		return next(error);
	}

	return next();
};
