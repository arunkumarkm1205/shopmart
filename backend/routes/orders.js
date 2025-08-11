const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Customer only)
router.post('/', protect, authorize('customer'), [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product').notEmpty().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress.fullName').notEmpty().withMessage('Full name is required'),
  body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.zipCode').notEmpty().withMessage('Zip code is required'),
  body('shippingAddress.country').notEmpty().withMessage('Country is required'),
  body('payment.method').isIn(['credit_card', 'debit_card', 'paypal', 'stripe', 'cash_on_delivery']).withMessage('Invalid payment method')
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

    const { items, shippingAddress, billingAddress, payment, notes } = req.body;

    // Validate and process items
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product)
        .populate('vendor', '_id storeName');

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product} not found`
        });
      }

      if (product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Product "${product.title}" is not available`
        });
      }

      // Check inventory
      if (product.inventory.trackQuantity && product.inventory.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.title}". Available: ${product.inventory.quantity}`
        });
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      processedItems.push({
        product: product._id,
        vendor: product.vendor._id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });

      // Update product inventory
      if (product.inventory.trackQuantity) {
        product.inventory.quantity -= item.quantity;
        await product.save();
      }
    }

    // Calculate totals
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 50 ? 0 : 10; // Free shipping over $50
    const total = subtotal + tax + shipping;

    // Create order
    const order = await Order.create({
      customer: req.user._id,
      items: processedItems,
      shippingAddress,
      billingAddress: billingAddress || { ...shippingAddress, sameAsShipping: true },
      payment: {
        ...payment,
        amount: total
      },
      pricing: {
        subtotal,
        tax,
        shipping,
        total
      },
      notes: notes || {}
    });

    // Add initial timeline entry
    order.addToTimeline('pending', 'Order created', req.user._id);
    await order.save();

    // Update vendor stats
    for (const item of processedItems) {
      await Vendor.findByIdAndUpdate(item.vendor, {
        $inc: {
          'stats.totalOrders': 1,
          'stats.totalRevenue': item.subtotal
        }
      });
    }

    // Populate order details
    await order.populate([
      { path: 'customer', select: 'name email' },
      { path: 'items.product', select: 'title images' },
      { path: 'items.vendor', select: 'storeName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private (Customer only)
router.get('/', protect, authorize('customer'), [
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

    let query = { customer: req.user._id };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const orders = await Order.find(query)
      .populate([
        { path: 'items.product', select: 'title images' },
        { path: 'items.vendor', select: 'storeName' }
      ])
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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private (Customer - own orders only)
router.get('/:id', protect, authorize('customer'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate([
        { path: 'customer', select: 'name email phone' },
        { path: 'items.product', select: 'title images description' },
        { path: 'items.vendor', select: 'storeName contact' },
        { path: 'timeline.updatedBy', select: 'name' }
      ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
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

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private (Customer - own orders only)
router.put('/:id/cancel', protect, authorize('customer'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Restore inventory
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product && product.inventory.trackQuantity) {
        product.inventory.quantity += item.quantity;
        await product.save();
      }
    }

    // Update order status
    order.addToTimeline('cancelled', 'Order cancelled by customer', req.user._id);
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private (Customer - own orders only)
router.put('/:id/payment', protect, authorize('customer'), [
  body('status').isIn(['pending', 'processing', 'completed', 'failed', 'refunded']).withMessage('Invalid payment status'),
  body('transactionId').optional().notEmpty().withMessage('Transaction ID cannot be empty'),
  body('paymentIntentId').optional().notEmpty().withMessage('Payment Intent ID cannot be empty')
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

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Update payment information
    order.payment.status = req.body.status;
    if (req.body.transactionId) order.payment.transactionId = req.body.transactionId;
    if (req.body.paymentIntentId) order.payment.paymentIntentId = req.body.paymentIntentId;

    if (req.body.status === 'completed') {
      order.payment.paidAt = new Date();
      order.addToTimeline('confirmed', 'Payment completed', req.user._id);
    } else if (req.body.status === 'failed') {
      order.addToTimeline('cancelled', 'Payment failed', req.user._id);
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      order
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Track order
// @route   GET /api/orders/:id/track
// @access  Public (with order number)
router.get('/:orderNumber/track', async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .select('orderNumber status timeline shipping items')
      .populate('items.vendor', 'storeName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      tracking: {
        orderNumber: order.orderNumber,
        status: order.status,
        timeline: order.timeline,
        shipping: order.shipping,
        items: order.items.map(item => ({
          title: item.title,
          vendor: item.vendor.storeName,
          status: item.status,
          trackingNumber: item.trackingNumber
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router; 