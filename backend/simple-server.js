const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Simple in-memory data store (for demo purposes)
let users = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@shopkart.com",
    userType: "admin",
    status: "active"
  }
];

let vendors = [
  {
    id: 1,
    name: "TechHub Electronics",
    logo: "fas fa-microchip",
    rating: 4.8,
    products: 150,
    description: "Premium electronics and gadgets"
  },
  {
    id: 2,
    name: "Fashion Forward",
    logo: "fas fa-tshirt",
    rating: 4.6,
    products: 230,
    description: "Trendy clothing and accessories"
  }
];

let products = [
  {
    id: 1,
    title: "Wireless Bluetooth Headphones",
    vendor: "TechHub Electronics",
    vendorId: 1,
    price: 79.99,
    rating: 4.5,
    category: "electronics",
    image: "fas fa-headphones",
    description: "High-quality wireless headphones with noise cancellation"
  },
  {
    id: 2,
    title: "Designer Cotton T-Shirt",
    vendor: "Fashion Forward",
    vendorId: 2,
    price: 29.99,
    rating: 4.3,
    category: "fashion",
    image: "fas fa-tshirt",
    description: "Premium cotton t-shirt with modern design"
  },
  {
    id: 3,
    title: "Smart LED Desk Lamp",
    vendor: "TechHub Electronics",
    vendorId: 1,
    price: 45.99,
    rating: 4.6,
    category: "home",
    image: "fas fa-lightbulb",
    description: "Adjustable LED lamp with USB charging port"
  },
  {
    id: 4,
    title: "Yoga Exercise Mat",
    vendor: "Fashion Forward",
    vendorId: 2,
    price: 24.99,
    rating: 4.4,
    category: "sports",
    image: "fas fa-dumbbell",
    description: "Non-slip yoga mat for all fitness levels"
  }
];

let orders = [];

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'null'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ShopKart API is running (Demo Mode)',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple demo login
  const user = users.find(u => u.email === email);
  if (user) {
    res.json({
      success: true,
      message: 'Login successful',
      token: 'demo-token-' + Date.now(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        status: user.status
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, userType, storeName } = req.body;
  
  const newUser = {
    id: users.length + 1,
    name,
    email,
    userType: userType || 'customer',
    status: 'active'
  };
  
  users.push(newUser);
  
  if (userType === 'vendor' && storeName) {
    vendors.push({
      id: vendors.length + 1,
      name: storeName,
      logo: "fas fa-store",
      rating: 0,
      products: 0,
      description: "New vendor store"
    });
  }
  
  res.json({
    success: true,
    message: 'Registration successful',
    token: 'demo-token-' + Date.now(),
    user: newUser
  });
});

// Product routes
app.get('/api/products', (req, res) => {
  let filteredProducts = [...products];
  
  // Filter by category
  if (req.query.category) {
    filteredProducts = filteredProducts.filter(p => p.category === req.query.category);
  }
  
  // Search
  if (req.query.search) {
    const searchTerm = req.query.search.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.title.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm)
    );
  }
  
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    count: paginatedProducts.length,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(filteredProducts.length / limit),
      totalProducts: filteredProducts.length,
      hasNextPage: endIndex < filteredProducts.length,
      hasPrevPage: page > 1
    },
    products: paginatedProducts
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  if (product) {
    res.json({ success: true, product });
  } else {
    res.status(404).json({ success: false, message: 'Product not found' });
  }
});

// Vendor routes
app.get('/api/vendors', (req, res) => {
  res.json({
    success: true,
    count: vendors.length,
    vendors
  });
});

app.get('/api/vendors/:id', (req, res) => {
  const vendor = vendors.find(v => v.id == req.params.id);
  if (vendor) {
    const vendorProducts = products.filter(p => p.vendorId == req.params.id);
    res.json({ 
      success: true, 
      vendor: {
        ...vendor,
        products: vendorProducts
      }
    });
  } else {
    res.status(404).json({ success: false, message: 'Vendor not found' });
  }
});

// Order routes
app.post('/api/orders', (req, res) => {
  const newOrder = {
    id: orders.length + 1,
    orderNumber: `ORD${String(orders.length + 1).padStart(6, '0')}`,
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  orders.push(newOrder);
  
  res.json({
    success: true,
    message: 'Order created successfully',
    order: newOrder
  });
});

app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    count: orders.length,
    orders
  });
});

// Handle undefined routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 ShopKart API server running on port ${PORT}`);
  console.log('📦 Demo Mode: Using in-memory data (no database required)');
  console.log('🌐 API Health: http://localhost:5000/api/health');
  console.log('📊 Sample Data: Products, Vendors, and Users loaded');
  console.log('✅ Ready to accept requests from frontend!');
});

module.exports = app; 