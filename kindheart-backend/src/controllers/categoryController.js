const { query } = require('../config/database');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        c.id, c.name, c.created_at,
        COUNT(cam.id) as campaign_count
      FROM categories c
      LEFT JOIN campaigns cam ON c.id = cam.category_id
      GROUP BY c.id
      ORDER BY c.name ASC`
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching categories'
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching category'
    });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // Check if category exists
    const exists = await query(
      'SELECT id FROM categories WHERE name = $1',
      [name]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    const result = await query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating category'
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Check if category exists
    const categoryExists = await query(
      'SELECT id FROM categories WHERE id = $1',
      [id]
    );

    if (categoryExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if new name already exists
    const nameExists = await query(
      'SELECT id FROM categories WHERE name = $1 AND id != $2',
      [name, id]
    );

    if (nameExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    const result = await query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating category'
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const categoryExists = await query(
      'SELECT id FROM categories WHERE id = $1',
      [id]
    );

    if (categoryExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has campaigns
    const hasCampaigns = await query(
      'SELECT id FROM campaigns WHERE category_id = $1 LIMIT 1',
      [id]
    );

    if (hasCampaigns.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing campaigns'
      });
    }

    await query('DELETE FROM categories WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting category'
    });
  }
};
