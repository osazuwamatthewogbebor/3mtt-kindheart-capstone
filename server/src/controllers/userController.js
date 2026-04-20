import prisma from '../config/db.js';
import cloudinary from '../config/cloudinary.js';

const uploadImageBuffer = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    stream.end(buffer);
  });

export const updateMyImage = async (req, res, next) => {
  try {
    const fileBuffer = req.file?.buffer;

    if (!fileBuffer) {
      const error = new Error('Image file is required');
      error.statusCode = 400;
      throw error;
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        profileImagePublicId: true,
      },
    });

    if (!currentUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (currentUser.profileImagePublicId) {
      await cloudinary.uploader.destroy(currentUser.profileImagePublicId, { resource_type: 'image' });
    }

    const uploadResult = await uploadImageBuffer(fileBuffer, 'kindheart/profile-images');
    const { secure_url: secureUrl, public_id: publicId } = uploadResult;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        profileImageUrl: secureUrl,
        profileImagePublicId: publicId,
        profile_picture: secureUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profile_picture: true,
        profileImageUrl: true,
        profileImagePublicId: true,
        created_at: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
