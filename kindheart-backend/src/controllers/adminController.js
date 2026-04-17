const { query } = require('../config/database');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Public (or Private/Admin for real deployment)
exports.getStats = async (req, res) => {
  try {
    // Total donations
    const donationsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM donations 
       WHERE payment_status = 'SUCCESS'`
    );

    // Total campaigns
    const campaignsResult = await query(
      'SELECT COUNT(*) as total FROM campaigns WHERE status = $1',
      ['ACTIVE']
    );

    // Total users
    const usersResult = await query(
      'SELECT COUNT(*) as total FROM users'
    );

    // Total withdrawals (you can implement withdrawal logic later)
    const withdrawalsResult = { rows: [{ total: 0 }] };

    res.status(200).json({
      success: true,
      data: {
        donations: parseFloat(donationsResult.rows[0].total),
        campaigns: parseInt(campaignsResult.rows[0].total),
        users: parseInt(usersResult.rows[0].total),
        withdrawals: parseFloat(withdrawalsResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching stats'
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { role, search, limit = 50, page = 1 } = req.query;

    let queryText = `
      SELECT 
        u.id, u.name, u.email, u.role, u.image, u.created_at,
        COUNT(DISTINCT c.id) as campaign_count,
        COUNT(DISTINCT d.id) as donation_count,
        COALESCE(SUM(d.amount), 0) as total_donated
      FROM users u
      LEFT JOIN campaigns c ON u.id = c.user_id
      LEFT JOIN donations d ON u.id = d.user_id AND d.payment_status = 'SUCCESS'
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (role) {
      queryText += ` AND u.role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    queryText += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(queryText, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        u.id, u.name, u.email, u.role, u.image, u.created_at,
        COUNT(DISTINCT c.id) as campaign_count,
        COUNT(DISTINCT d.id) as donation_count,
        COALESCE(SUM(d.amount), 0) as total_donated
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
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user'
    });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['USER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log admin action
    await query(
      'INSERT INTO admin_logs (admin_id, action) VALUES ($1, $2)',
      [req.user.id, `Updated user ${id} role to ${role}`]
    );

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user role'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const userExists = await query(
      'SELECT id, email FROM users WHERE id = $1',
      [id]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting self
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await query('DELETE FROM users WHERE id = $1', [id]);

    // Log admin action
    await query(
      'INSERT INTO admin_logs (admin_id, action) VALUES ($1, $2)',
      [req.user.id, `Deleted user ${id} (${userExists.rows[0].email})`]
    );

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
};

// @desc    Get admin logs
// @route   GET /api/admin/logs
// @access  Private/Admin
exports.getAdminLogs = async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;

    const result = await query(
      `SELECT 
        al.id, al.action, al.created_at,
        u.name as admin_name, u.email as admin_email
      FROM admin_logs al
      LEFT JOIN users u ON al.admin_id = u.id
      ORDER BY al.created_at DESC
      LIMIT $1 OFFSET $2`,
      [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching logs'
    });
  }
};

// @desc    Get recent activity
// @route   GET /api/admin/activity
// @access  Private/Admin
exports.getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent donations
    const donations = await query(
      `SELECT 
        'donation' as type,
        d.id,
        d.amount,
        d.created_at,
        u.name as user_name,
        c.title as campaign_title
      FROM donations d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN campaigns c ON d.campaign_id = c.id
      WHERE d.payment_status = 'SUCCESS'
      ORDER BY d.created_at DESC
      LIMIT $1`,
      [parseInt(limit)]
    );

    // Get recent campaigns
    const campaigns = await query(
      `SELECT 
        'campaign' as type,
        c.id,
        c.title,
        c.created_at,
        u.name as user_name
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
      LIMIT $1`,
      [parseInt(limit)]
    );

    // Combine and sort
    const activity = [...donations.rows, ...campaigns.rows]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      count: activity.length,
      data: activity
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching activity'
    });
  }
};
