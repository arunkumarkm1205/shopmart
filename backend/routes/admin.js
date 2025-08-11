const express = require('express');
const { query, body, validationResult } = require('express-validator');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', protect, authorize('admin'), async (req, res, next) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalVendors = await Vendor.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Get user type breakdown
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get vendor status breakdown
    const vendorStats = await Vendor.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get order status breakdown
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly revenue for the current year
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          'payment.status': 'completed',
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Get top selling products
    const topProducts = await Product.find()
      .sort({ 'sales.totalSold': -1 })
      .limit(10)
      .populate('vendor', 'storeName')
      .select('title sales vendor');

    // Get top vendors by revenue
    const topVendors = await Vendor.find()
      .sort({ 'stats.totalRevenue': -1 })
      .limit(10)
      .select('storeName stats rating');

    // Recent activities (last 10 orders and users)
    const recentOrders = await Order.find()
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber customer pricing.total status createdAt');

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email userType status createdAt');

    res.status(200).json({
      success: true,
      dashboard: {
        overview: {
          totalUsers,
          totalVendors,
          totalProducts,
          totalOrders
        },
        userStats,
        vendorStats,
        orderStats,
        monthlyRevenue,
        topProducts,
        topVendors,
        recentActivities: {
          recentOrders,
          recentUsers
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get all vendors for admin management
// @route   GET /api/admin/vendors
// @access  Private (Admin only)
router.get('/vendors', protect, authorize('admin'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'active', 'suspended', 'rejected']).withMessage('Invalid status')
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

    let query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.search) {
      query.$or = [
        { storeName: { $regex: req.query.search, $options: 'i' } },
        { storeDescription: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const vendors = await Vendor.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
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

// @desc    Update vendor status
// @route   PUT /api/admin/vendors/:id/status
// @access  Private (Admin only)
router.put('/vendors/:id/status', protect, authorize('admin'), [
  body('status').isIn(['pending', 'active', 'suspended', 'rejected']).withMessage('Invalid status'),
  body('reason').optional().notEmpty().withMessage('Reason cannot be empty')
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

    const { status, reason } = req.body;

    const vendor = await Vendor.findById(req.params.id)
      .populate('user', 'name email');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const oldStatus = vendor.status;
    vendor.status = status;
    await vendor.save();

    // If vendor is being approved, also activate the user
    if (status === 'active' && vendor.user.status !== 'active') {
      await User.findByIdAndUpdate(vendor.user._id, { status: 'active' });
    }

    // If vendor is being suspended/rejected, also suspend the user
    if (['suspended', 'rejected'].includes(status)) {
      await User.findByIdAndUpdate(vendor.user._id, { status: 'suspended' });
    }

    res.status(200).json({
      success: true,
      message: `Vendor status updated from ${oldStatus} to ${status}`,
      vendor: {
        id: vendor._id,
        storeName: vendor.storeName,
        status: vendor.status,
        user: vendor.user
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get all orders for admin management
// @route   GET /api/admin/orders
// @access  Private (Admin only)
router.get('/orders', protect, authorize('admin'), [
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

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    let query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.search) {
      query.$or = [
        { orderNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('customer', 'name email')
      .populate('items.vendor', 'storeName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Order.countDocuments(query);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    res.status(200).json({
      success: true,
      count: orders.length,
      pagination,
      orders
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get single order details for admin
// @route   GET /api/admin/orders/:id
// @access  Private (Admin only)
router.get('/orders/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('items.product', 'title images')
      .populate('items.vendor', 'storeName contact')
      .populate('timeline.updatedBy', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update order status (Admin only)
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin only)
router.put('/orders/:id/status', protect, authorize('admin'), [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).withMessage('Invalid status'),
  body('reason').optional().notEmpty().withMessage('Reason cannot be empty')
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

    const { status, reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Add to timeline
    const message = reason ? `Status updated by admin: ${reason}` : 'Status updated by admin';
    order.addToTimeline(status, message, req.user._id);
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
router.get('/analytics', protect, authorize('admin'), [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']).withMessage('Invalid period')
], async (req, res, next) => {
  try {
    const period = req.query.period || 'month';
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Revenue analytics
    const revenueData = await Order.aggregate([
      {
        $match: {
          'payment.status': 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === 'week' ? '%Y-%m-%d' : '%Y-%m',
              date: '$createdAt'
            }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Product category analytics
    const categoryData = await Order.aggregate([
      {
        $match: {
          'payment.status': 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $group: {
          _id: '$product.category',
          revenue: { $sum: '$items.subtotal' },
          quantity: { $sum: '$items.quantity' }
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]);

    // Vendor performance analytics
    const vendorPerformance = await Order.aggregate([
      {
        $match: {
          'payment.status': 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.vendor',
          revenue: { $sum: '$items.subtotal' },
          orders: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      {
        $unwind: '$vendor'
      },
      {
        $project: {
          storeName: '$vendor.storeName',
          revenue: 1,
          orders: 1
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        period,
        dateRange: {
          start: startDate,
          end: now
        },
        revenue: revenueData,
        categories: categoryData,
        topVendors: vendorPerformance
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router; 