const { query } = require('../config/database');
const upload = require('../middleware/upload');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        u.id, u.name, u.email, u.role, u.image, u.created_at,
        COUNT(DISTINCT c.id) as total_campaigns,
        COUNT(DISTINCT d.id) as total_donations,
        COALESCE(SUM(d.amount), 0) as total_donated,
        COALESCE(SUM(c.raised_amount), 0) as total_raised
      FROM users u
      LEFT JOIN campaigns c ON u.id = c.user_id
      LEFT JOIN donations d ON u.id = d.user_id AND d.payment_status = 'SUCCESS'
      WHERE u.id = $1
      GROUP BY u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

// @desc    Update user image
// @route   PUT /api/users/upload-image
// @access  Private
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const userId = req.user.id;
    const imagePath = `/uploads/${req.file.filename}`;

    const result = await query(
      'UPDATE users SET image = $1 WHERE id = $2 RETURNING id, name, email, role, image',
      [imagePath, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading image'
    });
  }
};

// @desc    Get user's campaigns
// @route   GET /api/users/:id/campaigns
// @access  Public
exports.getUserCampaigns = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    let queryText = `
      SELECT 
        c.id, c.title, c.description, c.goal_amount, c.raised_amount,
        c.image, c.status, c.created_at,
        cat.name as category_name
      FROM campaigns c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.user_id = $1
    `;

    const params = [id];

    if (status) {
      queryText += ' AND c.status = $2';
      params.push(status);
    }

    queryText += ' ORDER BY c.created_at DESC';

    const result = await query(queryText, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get user campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching campaigns'
    });
  }
};

// @desc    Get user's donations
// @route   GET /api/users/:id/donations
// @access  Private (own donations only, unless admin)
exports.getUserDonations = async (req, res) => {
  try {
    const { id } = req.params;

    // Check authorization
    if (req.user.id !== id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these donations'
      });
    }

    const result = await query(
      `SELECT 
        d.id, d.amount, d.payment_status, d.created_at,
        c.title as campaign_title, c.id as campaign_id
      FROM donations d
      LEFT JOIN campaigns c ON d.campaign_id = c.id
      WHERE d.user_id = $1
      ORDER BY d.created_at DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get user donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching donations'
    });
  }
};
