import { v2 as cloudinary } from 'cloudinary';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
	throw new Error('Missing Cloudinary environment variables');
}

cloudinary.config({
	cloud_name: CLOUDINARY_CLOUD_NAME,
	api_key: CLOUDINARY_API_KEY,
	api_secret: CLOUDINARY_API_SECRET,
	secure: true,
});

export const uploadImageBuffer = async ({ buffer, mimetype, folder = 'campaigns' }) => {
	const result = await new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder,
				resource_type: 'image',
				timeout: 60000,
			},
			(error, response) => {
				if (error) {
					console.error("DETAILED CLOUDINARY ERROR:", error);
					reject(error);
					return;
				}

				resolve(response);
			},
		);

		uploadStream.end(buffer);
	});

	return {
		imageUrl: result.secure_url,
		imagePublicId: result.public_id,
	};
};

export const deleteImageByPublicId = async (publicId) => {
	if (!publicId) {
		return null;
	}

	return cloudinary.uploader.destroy(publicId, {
		resource_type: 'image',
	});
};

export default cloudinary;
