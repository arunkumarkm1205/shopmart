const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    maxlength: [100, 'Store name cannot be more than 100 characters']
  },
  storeDescription: {
    type: String,
    required: [true, 'Store description is required'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  logo: {
    type: String,
    default: 'default-store-logo.png'
  },
  banner: {
    type: String,
    default: 'default-store-banner.jpg'
  },
  category: {
    type: String,
    required: [true, 'Store category is required'],
    enum: ['electronics', 'fashion', 'home', 'sports', 'books', 'beauty', 'automotive', 'toys', 'health', 'other']
  },
  businessInfo: {
    businessName: String,
    businessType: {
      type: String,
      enum: ['individual', 'partnership', 'corporation', 'llc'],
      default: 'individual'
    },
    taxId: String,
    businessAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  contact: {
    phone: String,
    email: String,
    website: String,
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String
    }
  },
  bankDetails: {
    accountNumber: String,
    routingNumber: String,
    accountHolderName: String,
    bankName: String
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected'],
    default: 'pending'
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  stats: {
    totalProducts: {
      type: Number,
      default: 0
    },
    totalSales: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    }
  },
  policies: {
    returnPolicy: String,
    shippingPolicy: String,
    privacyPolicy: String
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['business_license', 'tax_certificate', 'identity_proof', 'address_proof']
    },
    filename: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
VendorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Vendor', VendorSchema); 