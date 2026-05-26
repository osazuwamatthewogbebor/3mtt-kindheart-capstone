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
      },
      select: {
        id: true,
        name: true,
        email: true,
        profileImageUrl: true,
        profileImagePublicId: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      user: {
        ...updatedUser,
        profile_picture: updatedUser.profileImageUrl,
        created_at: updatedUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!userExists) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const [totalCampaigns, totalDonations, totalRaisedResult, totalDonatedResult, totalSupporters] = await Promise.all([
      // Count total campaigns created by user
      prisma.campaign.count({
        where: { userId: id }
      }),
      // Count total successful donations made by user
      prisma.donation.count({
        where: {
          donorId: id,
          status: 'SUCCESS'
        }
      }),
      // Sum of amountRaised of campaigns created by user
      prisma.campaign.aggregate({
        where: { userId: id },
        _sum: {
          amountRaised: true
        }
      }),
      // Sum of donations made by user
      prisma.donation.aggregate({
        where: {
          donorId: id,
          status: 'SUCCESS'
        },
        _sum: {
          amount: true
        }
      }),
      // Count total successful donations received on user's campaigns
      prisma.donation.count({
        where: {
          campaign: {
            userId: id
          },
          status: 'SUCCESS'
        }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_campaigns: totalCampaigns,
        total_donations: totalDonations,
        total_raised: Number(totalRaisedResult._sum.amountRaised || 0),
        total_donated: Number(totalDonatedResult._sum.amount || 0),
        total_supporters: totalSupporters
      }
    });
  } catch (error) {
    next(error);
  }
};

