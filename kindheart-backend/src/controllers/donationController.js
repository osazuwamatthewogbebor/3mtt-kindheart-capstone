const { query } = require('../config/database');
const { initializePayment, verifyPayment } = require('../utils/paystack');
const { v4: uuidv4 } = require('uuid');

// @desc    Create donation (initialize payment)
// @route   POST /api/donations
// @access  Private (can be public for anonymous donations)
exports.createDonation = async (req, res) => {
  try {
    const { campaign_id, amount, email } = req.body;
    const user_id = req.user ? req.user.id : null;

    // Validate campaign exists
    const campaignResult = await query(
      'SELECT id, title, goal_amount, raised_amount, status FROM campaigns WHERE id = $1',
      [campaign_id]
    );

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const campaign = campaignResult.rows[0];

    if (campaign.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Campaign is not active'
      });
    }

    // Generate unique reference
    const reference = `KH-${uuidv4()}`;

    // Create donation record
    const donationResult = await query(
      `INSERT INTO donations (user_id, campaign_id, amount, payment_reference, payment_status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING *`,
      [user_id, campaign_id, amount, reference]
    );

    const donation = donationResult.rows[0];

    // Initialize Paystack payment
    const paymentData = await initializePayment(
      email,
      amount,
      reference,
      {
        donation_id: donation.id,
        campaign_id: campaign_id,
        campaign_title: campaign.title
      }
    );

    // Create payment record
    await query(
      `INSERT INTO payments (donation_id, provider, reference, amount, status)
       VALUES ($1, 'PAYSTACK', $2, $3, 'INITIATED')`,
      [donation.id, reference, amount]
    );

    res.status(201).json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        donation_id: donation.id,
        reference: reference,
        authorization_url: paymentData.data.authorization_url,
        access_code: paymentData.data.access_code
      }
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating donation'
    });
  }
};

// @desc    Verify payment
// @route   GET /api/donations/verify/:reference
// @access  Public
exports.verifyDonation = async (req, res) => {
  try {
    const { reference } = req.params;

    // Verify payment with Paystack
    const paymentData = await verifyPayment(reference);

    if (paymentData.status && paymentData.data.status === 'success') {
      // Update donation status
      await query(
        `UPDATE donations 
         SET payment_status = 'SUCCESS'
         WHERE payment_reference = $1`,
        [reference]
      );

      // Update payment status
      await query(
        `UPDATE payments 
         SET status = 'SUCCESS'
         WHERE reference = $1`,
        [reference]
      );

      // Get donation details
      const donationResult = await query(
        'SELECT campaign_id, amount FROM donations WHERE payment_reference = $1',
        [reference]
      );

      const donation = donationResult.rows[0];

      // Update campaign raised amount
      await query(
        `UPDATE campaigns 
         SET raised_amount = raised_amount + $1
         WHERE id = $2`,
        [donation.amount, donation.campaign_id]
      );

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: paymentData.data
      });
    } else {
      // Update to failed
      await query(
        `UPDATE donations 
         SET payment_status = 'FAILED'
         WHERE payment_reference = $1`,
        [reference]
      );

      await query(
        `UPDATE payments 
         SET status = 'FAILED'
         WHERE reference = $1`,
        [reference]
      );

      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Verify donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error verifying payment'
    });
  }
};

// @desc    Get all donations (admin)
// @route   GET /api/donations
// @access  Private/Admin
exports.getDonations = async (req, res) => {
  try {
    const { status, campaign_id, limit = 50, page = 1 } = req.query;

    let queryText = `
      SELECT 
        d.id, d.amount, d.payment_reference, d.payment_status, d.created_at,
        u.name as donor_name, u.email as donor_email,
        c.title as campaign_title
      FROM donations d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN campaigns c ON d.campaign_id = c.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (status) {
      queryText += ` AND d.payment_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (campaign_id) {
      queryText += ` AND d.campaign_id = $${paramCount}`;
      params.push(campaign_id);
      paramCount++;
    }

    queryText += ` ORDER BY d.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(queryText, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching donations'
    });
  }
};

// @desc    Get user's donations
// @route   GET /api/donations/my-donations
// @access  Private
exports.getMyDonations = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await query(
      `SELECT 
        d.id, d.amount, d.payment_reference, d.payment_status, d.created_at,
        c.title as campaign_title, c.id as campaign_id
      FROM donations d
      LEFT JOIN campaigns c ON d.campaign_id = c.id
      WHERE d.user_id = $1
      ORDER BY d.created_at DESC`,
      [user_id]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get my donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching donations'
    });
  }
};

// @desc    Get campaign donations
// @route   GET /api/donations/campaign/:campaignId
// @access  Public
exports.getCampaignDonations = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const result = await query(
      `SELECT 
        d.amount, d.created_at,
        u.name as donor_name
      FROM donations d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.campaign_id = $1 AND d.payment_status = 'SUCCESS'
      ORDER BY d.created_at DESC`,
      [campaignId]
    );

    // Calculate total
    const totalResult = await query(
      `SELECT SUM(amount) as total
       FROM donations
       WHERE campaign_id = $1 AND payment_status = 'SUCCESS'`,
      [campaignId]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      total: parseFloat(totalResult.rows[0].total) || 0,
      data: result.rows
    });
  } catch (error) {
    console.error('Get campaign donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching campaign donations'
    });
  }
};
