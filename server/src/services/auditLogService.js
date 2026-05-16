import prisma from '../config/db.js';

export const logAdminAction = async (adminId, action, resource, resourceId, details = null) => {
	try {
		await prisma.auditLog.create({
			data: {
				adminId,
				action,
				resource,
				resourceId,
				details: details ? JSON.stringify(details) : null,
			},
		});
	} catch (error) {
		// Log error but don't fail the request
		console.error('Failed to log audit action:', error);
	}
};
