const { query } = require('../config/database');
const { calculateProgress } = require('../utils/helpers');

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Public
exports.getCampaigns = async (req, res) => {
  try {
    const { status, category, search, limit = 20, page = 1 } = req.query;
    
    let queryText = `
      SELECT 
        c.id, c.title, c.description, c.goal_amount, c.raised_amount, 
        c.image, c.status, c.created_at,
        u.name as creator_name, u.email as creator_email,
        cat.name as category_name,
        cat.id as category_id
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    // Filter by status
    if (status) {
      queryText += ` AND c.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Filter by category
    if (category) {
      queryText += ` AND cat.name = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    // Search by title or description
    if (search) {
      queryText += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    queryText += ` ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(queryText, params);

    // Calculate progress for each campaign
    const campaigns = result.rows.map(campaign => ({
      ...campaign,
      progress: calculateProgress(
        parseFloat(campaign.raised_amount),
        parseFloat(campaign.goal_amount)
      )
    }));

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching campaigns'
    });
  }
};

// @desc    Get single campaign
// @route   GET /api/campaigns/:id
// @access  Public
exports.getCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        c.*, 
        u.name as creator_name, 
        u.email as creator_email, 
        u.image as creator_image,
        cat.name as category_name
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const campaign = result.rows[0];
    campaign.progress = calculateProgress(
      parseFloat(campaign.raised_amount),
      parseFloat(campaign.goal_amount)
    );

    // Get recent donations for this campaign
    const donations = await query(
      `SELECT 
        d.amount, d.created_at,
        u.name as donor_name
      FROM donations d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.campaign_id = $1 AND d.payment_status = 'SUCCESS'
      ORDER BY d.created_at DESC
      LIMIT 10`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        ...campaign,
        recent_donations: donations.rows
      }
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching campaign'
    });
  }
};

// @desc    Create new campaign
// @route   POST /api/campaigns
// @access  Private
exports.createCampaign = async (req, res) => {
  try {
    const { title, description, goal_amount, category_id } = req.body;
    const user_id = req.user.id;

    // Handle image upload
    let image = null;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const result = await query(
      `INSERT INTO campaigns (user_id, category_id, title, description, goal_amount, image, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
       RETURNING *`,
      [user_id, category_id, title, description, goal_amount, image]
    );

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating campaign'
    });
  }
};

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private
exports.updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, goal_amount, category_id, status } = req.body;
    const user_id = req.user.id;

    // Check if campaign exists and belongs to user (or user is admin)
    const campaignResult = await query(
      'SELECT * FROM campaigns WHERE id = $1',
      [id]
    );

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const campaign = campaignResult.rows[0];

    // Only owner or admin can update
    if (campaign.user_id !== user_id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this campaign'
      });
    }

    // Handle image upload
    let image = campaign.image;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const result = await query(
      `UPDATE campaigns 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           goal_amount = COALESCE($3, goal_amount),
           category_id = COALESCE($4, category_id),
           status = COALESCE($5, status),
           image = COALESCE($6, image)
       WHERE id = $7
       RETURNING *`,
      [title, description, goal_amount, category_id, status, image, id]
    );

    res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating campaign'
    });
  }
};

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Check if campaign exists and belongs to user (or user is admin)
    const campaignResult = await query(
      'SELECT * FROM campaigns WHERE id = $1',
      [id]
    );

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const campaign = campaignResult.rows[0];

    // Only owner or admin can delete
    if (campaign.user_id !== user_id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this campaign'
      });
    }

    await query('DELETE FROM campaigns WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting campaign'
    });
  }
};

// @desc    Get user's campaigns
// @route   GET /api/campaigns/my-campaigns
// @access  Private
exports.getMyCampaigns = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await query(
      `SELECT 
        c.*,
        cat.name as category_name
      FROM campaigns c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC`,
      [user_id]
    );

    const campaigns = result.rows.map(campaign => ({
      ...campaign,
      progress: calculateProgress(
        parseFloat(campaign.raised_amount),
        parseFloat(campaign.goal_amount)
      )
    }));

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    console.error('Get my campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching campaigns'
    });
  }
};
