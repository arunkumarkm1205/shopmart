const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['electronics', 'fashion', 'home', 'sports', 'books', 'beauty', 'automotive', 'toys', 'health', 'other']).withMessage('Invalid category')
], async (req, res, next) => {
  try {
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

    let query = { status: 'active' };

    if (req.query.category) {
      query.category = req.query.category;
    }

    const vendors = await Vendor.find(query)
      .populate('user', 'name email')
      .select('-bankDetails -verificationDocuments')
      .sort({ 'rating.average': -1, createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Vendor.countDocuments(query);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalVendors: total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    res.status(200).json({
      success: true,
      count: vendors.length,
      pagination,
      vendors
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get single vendor
// @route   GET /api/vendors/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate('user', 'name email')
      .select('-bankDetails -verificationDocuments');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (vendor.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get vendor's products
    const products = await Product.find({ 
      vendor: vendor._id, 
      status: 'active',
      visibility: 'visible'
    })
      .select('title price rating images category')
      .limit(10);

    res.status(200).json({
      success: true,
      vendor: {
        ...vendor.toObject(),
        products
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get vendor dashboard data
// @route   GET /api/vendors/dashboard
// @access  Private (Vendor only)
router.get('/dashboard/stats', protect, authorize('vendor'), async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Get recent orders
    const recentOrders = await Order.find({ 'items.vendor': vendor._id })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get products with low stock
    const lowStockProducts = await Product.find({
      vendor: vendor._id,
      'inventory.quantity': { $lte: 10 }
    })
      .select('title inventory.quantity inventory.lowStockThreshold')
      .limit(10);

    // Calculate monthly revenue (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyOrders = await Order.find({
      'items.vendor': vendor._id,
      'payment.status': 'completed',
      createdAt: { $gte: startOfMonth }
    });

    const monthlyRevenue = monthlyOrders.reduce((total, order) => {
      const vendorItems = order.items.filter(item => 
        item.vendor.toString() === vendor._id.toString()
      );
      return total + vendorItems.reduce((sum, item) => sum + item.subtotal, 0);
    }, 0);

    // Get top selling products
    const topProducts = await Product.find({ vendor: vendor._id })
      .sort({ 'sales.totalSold': -1 })
      .limit(5)
      .select('title sales.totalSold sales.totalRevenue');

    res.status(200).json({
      success: true,
      dashboard: {
        stats: vendor.stats,
        monthlyRevenue,
        recentOrders,
        lowStockProducts,
        topProducts
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update vendor profile
// @route   PUT /api/vendors/profile
// @access  Private (Vendor only)
router.put('/profile', protect, authorize('vendor'), [
  body('storeName').optional().notEmpty().withMessage('Store name cannot be empty'),
  body('storeDescription').optional().notEmpty().withMessage('Store description cannot be empty'),
  body('category').optional().isIn(['electronics', 'fashion', 'home', 'sports', 'books', 'beauty', 'automotive', 'toys', 'health', 'other']).withMessage('Invalid category')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendor = await Vendor.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'name email');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vendor profile updated successfully',
      vendor
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get vendor's products
// @route   GET /api/vendors/products
// @access  Private (Vendor only)
router.get('/dashboard/products', protect, authorize('vendor'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'inactive', 'out-of-stock', 'discontinued']).withMessage('Invalid status')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    let query = { vendor: vendor._id };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const products = await Product.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Product.countDocuments(query);

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

// @desc    Get vendor's orders
// @route   GET /api/vendors/orders
// @access  Private (Vendor only)
router.get('/dashboard/orders', protect, authorize('vendor'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).withMessage('Invalid status')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    let matchQuery = { 'items.vendor': vendor._id };

    if (req.query.status) {
      matchQuery['items.status'] = req.query.status;
    }

    const orders = await Order.find(matchQuery)
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    // Filter items to show only this vendor's items
    const filteredOrders = orders.map(order => ({
      ...order.toObject(),
      items: order.items.filter(item => item.vendor.toString() === vendor._id.toString())
    }));

    const total = await Order.countDocuments(matchQuery);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    res.status(200).json({
      success: true,
      count: filteredOrders.length,
      pagination,
      orders: filteredOrders
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update order item status
// @route   PUT /api/vendors/orders/:orderId/items/:itemId
// @access  Private (Vendor only)
router.put('/orders/:orderId/items/:itemId', protect, authorize('vendor'), [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).withMessage('Invalid status'),
  body('trackingNumber').optional().notEmpty().withMessage('Tracking number cannot be empty')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const itemIndex = order.items.findIndex(item => 
      item._id.toString() === req.params.itemId && 
      item.vendor.toString() === vendor._id.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Order item not found or not authorized'
      });
    }

    // Update item status
    order.items[itemIndex].status = req.body.status;
    if (req.body.trackingNumber) {
      order.items[itemIndex].trackingNumber = req.body.trackingNumber;
    }

    // Add to timeline
    order.addToTimeline(
      req.body.status,
      `Item "${order.items[itemIndex].title}" status updated by vendor`,
      req.user._id
    );

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order item status updated successfully',
      order
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router; 