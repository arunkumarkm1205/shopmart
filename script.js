// Multi-Vendor E-commerce Application JavaScript

class ShopKartApp {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.vendors = [];
        this.products = [];
        this.init();
    }

    init() {
        this.loadSampleData();
        this.setupEventListeners();
        this.updateCartDisplay();
        this.loadVendors();
        this.loadProducts();
        this.updateAuthUI();
    }

    loadSampleData() {
        // Sample vendors data
        this.vendors = [
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
            },
            {
                id: 3,
                name: "Home Essentials",
                logo: "fas fa-home",
                rating: 4.7,
                products: 180,
                description: "Everything for your home"
            },
            {
                id: 4,
                name: "Sports Zone",
                logo: "fas fa-dumbbell",
                rating: 4.5,
                products: 120,
                description: "Sports equipment and fitness gear"
            }
        ];

        // Sample products data
        this.products = [
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
                vendor: "Home Essentials",
                vendorId: 3,
                price: 45.99,
                rating: 4.6,
                category: "home",
                image: "fas fa-lightbulb",
                description: "Adjustable LED lamp with USB charging port"
            },
            {
                id: 4,
                title: "Yoga Exercise Mat",
                vendor: "Sports Zone",
                vendorId: 4,
                price: 24.99,
                rating: 4.4,
                category: "sports",
                image: "fas fa-dumbbell",
                description: "Non-slip yoga mat for all fitness activities"
            },
            {
                id: 5,
                title: "Smartphone Stand",
                vendor: "TechHub Electronics",
                vendorId: 1,
                price: 15.99,
                rating: 4.2,
                category: "electronics",
                image: "fas fa-mobile-alt",
                description: "Adjustable phone stand for desk or table"
            },
            {
                id: 6,
                title: "Casual Denim Jeans",
                vendor: "Fashion Forward",
                vendorId: 2,
                price: 59.99,
                rating: 4.7,
                category: "fashion",
                image: "fas fa-tshirt",
                description: "Comfortable slim-fit denim jeans"
            }
        ];
    }

    setupEventListeners() {
        // Navigation and UI events
        document.getElementById('loginBtn').addEventListener('click', () => this.showModal('loginModal'));
        document.getElementById('registerBtn').addEventListener('click', () => this.showModal('registerModal'));
        document.getElementById('closeLogin').addEventListener('click', () => this.hideModal('loginModal'));
        document.getElementById('closeRegister').addEventListener('click', () => this.hideModal('registerModal'));
        
        // Cart events
        document.querySelector('.cart-icon').addEventListener('click', () => this.toggleCart());
        document.getElementById('closeCart').addEventListener('click', () => this.toggleCart());
        document.getElementById('checkoutBtn').addEventListener('click', () => this.checkout());
        
        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => this.performSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        
        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        
        // Category clicks
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                this.filterByCategory(category);
            });
        });
        
        // User type change in registration
        document.querySelectorAll('input[name="regUserType"]').forEach(radio => {
            radio.addEventListener('change', () => this.toggleVendorFields());
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        });
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    toggleVendorFields() {
        const isVendor = document.querySelector('input[name="regUserType"]:checked').value === 'vendor';
        document.getElementById('vendorFields').style.display = isVendor ? 'block' : 'none';
    }

    loadVendors() {
        const vendorsGrid = document.getElementById('vendorsGrid');
        vendorsGrid.innerHTML = '';
        
        this.vendors.forEach(vendor => {
            const vendorCard = document.createElement('div');
            vendorCard.className = 'vendor-card fade-in';
            vendorCard.innerHTML = `
                <div class="vendor-logo">
                    <i class="${vendor.logo}"></i>
                </div>
                <h3>${vendor.name}</h3>
                <div class="vendor-rating">
                    ${this.generateStarRating(vendor.rating)}
                    <span>(${vendor.rating})</span>
                </div>
                <div class="vendor-products">${vendor.products} Products</div>
                <p style="margin-top: 1rem; color: #666;">${vendor.description}</p>
                <button class="btn-primary" style="margin-top: 1rem;" onclick="app.viewVendorProducts(${vendor.id})">
                    View Products
                </button>
            `;
            vendorsGrid.appendChild(vendorCard);
        });
    }

    loadProducts(filteredProducts = null) {
        const productsGrid = document.getElementById('productsGrid');
        productsGrid.innerHTML = '';
        
        const productsToShow = filteredProducts || this.products;
        
        productsToShow.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card fade-in';
            productCard.innerHTML = `
                <div class="product-image">
                    <i class="${product.image}"></i>
                </div>
                <div class="product-info">
                    <div class="product-title">${product.title}</div>
                    <div class="product-vendor">by ${product.vendor}</div>
                    <div class="product-price">$${product.price}</div>
                    <div class="product-rating">
                        ${this.generateStarRating(product.rating)}
                        <span>(${product.rating})</span>
                    </div>
                    <button class="add-to-cart" onclick="app.addToCart(${product.id})">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            `;
            productsGrid.appendChild(productCard);
        });
    }

    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }
        
        this.saveCart();
        this.updateCartDisplay();
        this.showCartNotification();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
        this.renderCartItems();
    }

    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;
        
        item.quantity += change;
        
        if (item.quantity <= 0) {
            this.removeFromCart(productId);
        } else {
            this.saveCart();
            this.updateCartDisplay();
            this.renderCartItems();
        }
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    updateCartDisplay() {
        const cartCount = document.getElementById('cartCount');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        
        const cartTotal = document.getElementById('cartTotal');
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = total.toFixed(2);
    }

    toggleCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        cartSidebar.classList.toggle('open');
        this.renderCartItems();
    }

    renderCartItems() {
        const cartItems = document.getElementById('cartItems');
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Your cart is empty</p>';
            return;
        }
        
        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <i class="${item.image}"></i>
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-price">$${item.price}</div>
                    <div class="quantity-controls">
                        <button class="qty-btn" onclick="app.updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="app.updateQuantity(${item.id}, 1)">+</button>
                        <button class="qty-btn" onclick="app.removeFromCart(${item.id})" style="margin-left: 1rem; color: #ff6b6b;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showCartNotification() {
        // Simple notification - could be enhanced with a toast library
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 1rem 2rem;
            border-radius: 5px;
            z-index: 1003;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = 'Item added to cart!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    performSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.loadProducts();
            return;
        }
        
        const filteredProducts = this.products.filter(product => 
            product.title.toLowerCase().includes(searchTerm) ||
            product.vendor.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
        
        this.loadProducts(filteredProducts);
        
        // Scroll to products section
        document.querySelector('.featured-products').scrollIntoView({
            behavior: 'smooth'
        });
    }

    filterByCategory(category) {
        const filteredProducts = this.products.filter(product => 
            product.category === category
        );
        
        this.loadProducts(filteredProducts);
        
        // Scroll to products section
        document.querySelector('.featured-products').scrollIntoView({
            behavior: 'smooth'
        });
    }

    viewVendorProducts(vendorId) {
        const filteredProducts = this.products.filter(product => 
            product.vendorId === vendorId
        );
        
        this.loadProducts(filteredProducts);
        
        // Scroll to products section
        document.querySelector('.featured-products').scrollIntoView({
            behavior: 'smooth'
        });
    }

    handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const userType = document.querySelector('input[name="userType"]:checked').value;
        
        // Simple validation (in real app, this would be server-side)
        if (email && password) {
            const user = {
                email,
                userType,
                name: email.split('@')[0], // Simple name extraction
                loginTime: new Date().toISOString()
            };
            
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            this.hideModal('loginModal');
            this.updateAuthUI();
            this.showNotification('Login successful!', 'success');
            
            // Reset form
            document.getElementById('loginForm').reset();
        } else {
            this.showNotification('Please fill in all fields', 'error');
        }
    }

    handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const phone = document.getElementById('regPhone').value;
        const userType = document.querySelector('input[name="regUserType"]:checked').value;
        
        let storeName = '';
        let storeDescription = '';
        
        if (userType === 'vendor') {
            storeName = document.getElementById('storeName').value;
            storeDescription = document.getElementById('storeDescription').value;
            
            if (!storeName) {
                this.showNotification('Store name is required for vendors', 'error');
                return;
            }
        }
        
        if (name && email && password && phone) {
            const user = {
                name,
                email,
                phone,
                userType,
                storeName,
                storeDescription,
                registrationTime: new Date().toISOString()
            };
            
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            this.hideModal('registerModal');
            this.updateAuthUI();
            this.showNotification('Registration successful!', 'success');
            
            // Reset form
            document.getElementById('registerForm').reset();
            document.getElementById('vendorFields').style.display = 'none';
        } else {
            this.showNotification('Please fill in all required fields', 'error');
        }
    }

    updateAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        
        if (this.currentUser) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> ${this.currentUser.name}`;
            loginBtn.onclick = () => this.showUserMenu();
            registerBtn.style.display = 'none';
        } else {
            loginBtn.innerHTML = '<i class="fas fa-user"></i> Login';
            loginBtn.onclick = () => this.showModal('loginModal');
            registerBtn.style.display = 'block';
        }
    }

    showUserMenu() {
        // Simple user menu - could be enhanced with a dropdown
        const menu = confirm(`Welcome ${this.currentUser.name}!\n\nChoose an option:\nOK - Logout\nCancel - Close`);
        
        if (menu) {
            this.logout();
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateAuthUI();
        this.showNotification('Logged out successfully', 'success');
    }

    checkout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty', 'error');
            return;
        }
        
        if (!this.currentUser) {
            this.showNotification('Please login to checkout', 'error');
            this.showModal('loginModal');
            return;
        }
        
        // Simple checkout simulation
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderId = 'ORD' + Date.now();
        
        const confirmed = confirm(`Order Summary:\n\nItems: ${this.cart.length}\nTotal: $${total.toFixed(2)}\n\nConfirm order?`);
        
        if (confirmed) {
            // Clear cart
            this.cart = [];
            this.saveCart();
            this.updateCartDisplay();
            this.toggleCart();
            
            this.showNotification(`Order ${orderId} placed successfully!`, 'success');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 1rem 2rem;
            border-radius: 5px;
            z-index: 1003;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Initialize the application
const app = new ShopKartApp();

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style); 