const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all products with filtering, sorting, and pagination
// @route   GET /api/products
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isIn(['price', '-price', 'rating', '-rating', 'createdAt', '-createdAt']).withMessage('Invalid sort option'),
  query('category').optional().isIn(['electronics', 'fashion', 'home', 'sports', 'books', 'beauty', 'automotive', 'toys', 'health', 'other']).withMessage('Invalid category'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Minimum price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Maximum price must be a positive number')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = { status: 'active', visibility: 'visible' };

    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Vendor filter
    if (req.query.vendor) {
      query.vendor = req.query.vendor;
    }

    // Featured filter
    if (req.query.featured === 'true') {
      query.featured = true;
    }

    // Build sort
    let sortBy = {};
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith('-') ? req.query.sort.slice(1) : req.query.sort;
      const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
      sortBy[sortField] = sortOrder;
    } else {
      sortBy.createdAt = -1; // Default sort by newest
    }

    // Execute query
    const products = await Product.find(query)
      .populate('vendor', 'storeName rating')
      .select('-__v')
      .sort(sortBy)
      .limit(limit)
      .skip(startIndex);

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      products
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendor', 'storeName storeDescription rating contact');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is visible
    if (product.status !== 'active' || product.visibility !== 'visible') {
      // Only allow vendor or admin to see inactive/hidden products
      if (!req.user || (req.user._id.toString() !== product.vendor.user.toString() && req.user.userType !== 'admin')) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
    }

    res.status(200).json({
      success: true,
      product
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Vendor only)
router.post('/', protect, authorize('vendor'), [
  body('title').notEmpty().withMessage('Product title is required'),
  body('description').notEmpty().withMessage('Product description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isIn(['electronics', 'fashion', 'home', 'sports', 'books', 'beauty', 'automotive', 'toys', 'health', 'other']).withMessage('Invalid category'),
  body('inventory.quantity').isInt({ min: 0 }).withMessage('Inventory quantity must be a non-negative integer')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Get vendor
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    if (vendor.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Vendor account is not active'
      });
    }

    // Add vendor to product data
    req.body.vendor = vendor._id;

    // Create product
    const product = await Product.create(req.body);

    // Update vendor stats
    vendor.stats.totalProducts += 1;
    await vendor.save();

    // Populate vendor info
    await product.populate('vendor', 'storeName rating');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Vendor - own products only)
router.put('/:id', protect, authorize('vendor'), [
  body('title').optional().notEmpty().withMessage('Product title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Product description cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').optional().isIn(['electronics', 'fashion', 'home', 'sports', 'books', 'beauty', 'automotive', 'toys', 'health', 'other']).withMessage('Invalid category')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Find product
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get vendor
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor || product.vendor.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    // Update product
    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('vendor', 'storeName rating');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Vendor - own products only)
router.delete('/:id', protect, authorize('vendor'), async (req, res, next) => {
  try {
    // Find product
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get vendor
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor || product.vendor.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    // Delete product
    await Product.findByIdAndDelete(req.params.id);

    // Update vendor stats
    vendor.stats.totalProducts = Math.max(0, vendor.stats.totalProducts - 1);
    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
router.get('/category/:category', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const products = await Product.find({
      category: req.params.category,
      status: 'active',
      visibility: 'visible'
    })
      .populate('vendor', 'storeName rating')
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Product.countDocuments({
      category: req.params.category,
      status: 'active',
      visibility: 'visible'
    });

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      products
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Search products
// @route   GET /api/products/search/:query
// @access  Public
router.get('/search/:query', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const products = await Product.find({
      $text: { $search: req.params.query },
      status: 'active',
      visibility: 'visible'
    })
      .populate('vendor', 'storeName rating')
      .select('-__v')
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .skip(startIndex);

    const total = await Product.countDocuments({
      $text: { $search: req.params.query },
      status: 'active',
      visibility: 'visible'
    });

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      products
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router; 