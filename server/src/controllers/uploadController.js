import cloudinary from '../config/cloudinary.js';

export const deleteUploadByPublicId = async (req, res, next) => {
  try {
    const { public_id: publicId } = req.params;

    if (!publicId) {
      const error = new Error('public_id is required');
      error.statusCode = 400;
      throw error;
    }

    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });

    res.status(200).json({
      success: true,
      message: 'Upload deleted successfully',
      result,
    });
  } catch (error) {
    next(error);
  }
};
