// Vendor Dashboard JavaScript

class VendorDashboard {
    constructor() {
        this.currentTab = 'overview';
        this.vendorProducts = [];
        this.orders = [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.init();
    }

    init() {
        this.loadSampleData();
        this.setupEventListeners();
        this.updateVendorInfo();
        this.loadDashboardData();
        this.checkAuth();
    }

    checkAuth() {
        if (!this.currentUser || this.currentUser.userType !== 'vendor') {
            alert('Access denied. Please login as a vendor.');
            window.location.href = 'index.html';
            return;
        }
    }

    loadSampleData() {
        // Sample vendor products
        this.vendorProducts = [
            {
                id: 1,
                title: "Wireless Bluetooth Headphones",
                price: 79.99,
                category: "electronics",
                stock: 25,
                status: "active",
                sales: 45,
                rating: 4.5,
                image: "fas fa-headphones"
            },
            {
                id: 2,
                title: "Smart LED Desk Lamp",
                price: 45.99,
                category: "home",
                stock: 12,
                status: "active",
                sales: 23,
                rating: 4.6,
                image: "fas fa-lightbulb"
            },
            {
                id: 3,
                title: "Smartphone Stand",
                price: 15.99,
                category: "electronics",
                stock: 0,
                status: "out-of-stock",
                sales: 67,
                rating: 4.2,
                image: "fas fa-mobile-alt"
            }
        ];

        // Sample orders
        this.orders = [
            {
                id: "ORD001",
                customer: "John Doe",
                products: "Wireless Headphones x2",
                amount: 159.98,
                status: "pending",
                date: "2024-01-15"
            },
            {
                id: "ORD002",
                customer: "Jane Smith",
                products: "LED Desk Lamp x1",
                amount: 45.99,
                status: "processing",
                date: "2024-01-14"
            },
            {
                id: "ORD003",
                customer: "Mike Johnson",
                products: "Smartphone Stand x3",
                amount: 47.97,
                status: "shipped",
                date: "2024-01-13"
            },
            {
                id: "ORD004",
                customer: "Sarah Wilson",
                products: "Wireless Headphones x1",
                amount: 79.99,
                status: "delivered",
                date: "2024-01-12"
            },
            {
                id: "ORD005",
                customer: "Tom Brown",
                products: "LED Desk Lamp x2",
                amount: 91.98,
                status: "cancelled",
                date: "2024-01-11"
            }
        ];
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(tab.dataset.tab);
            });
        });

        // Modal events
        document.getElementById('addProductBtn').addEventListener('click', () => this.showAddProductModal());
        document.getElementById('closeAddProduct').addEventListener('click', () => this.hideAddProductModal());
        document.getElementById('cancelAddProduct').addEventListener('click', () => this.hideAddProductModal());
        
        // Form submissions
        document.getElementById('addProductForm').addEventListener('submit', (e) => this.handleAddProduct(e));
        document.getElementById('storeInfoForm').addEventListener('submit', (e) => this.handleStoreInfo(e));
        document.getElementById('notificationForm').addEventListener('submit', (e) => this.handleNotificationSettings(e));
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Filters
        document.getElementById('categoryFilter').addEventListener('change', () => this.filterProducts());
        document.getElementById('statusFilter').addEventListener('change', () => this.filterProducts());
        document.getElementById('searchProductBtn').addEventListener('click', () => this.searchProducts());
        document.getElementById('productSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchProducts();
        });
        
        // Order filters
        document.getElementById('orderStatusFilter').addEventListener('change', () => this.filterOrders());
        document.getElementById('dateRange').addEventListener('change', () => this.filterOrders());
        
        // Export orders
        document.getElementById('exportOrdersBtn').addEventListener('click', () => this.exportOrders());
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideAddProductModal();
            }
        });
    }

    updateVendorInfo() {
        if (this.currentUser) {
            document.getElementById('vendorName').textContent = this.currentUser.storeName || this.currentUser.name;
        }
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).parentElement.classList.add('active');
        
        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        
        this.currentTab = tabName;
        this.loadTabContent(tabName);
    }

    loadTabContent(tabName) {
        switch(tabName) {
            case 'overview':
                this.loadOverviewData();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'store-settings':
                this.loadStoreSettings();
                break;
        }
    }

    loadDashboardData() {
        this.loadOverviewData();
    }

    loadOverviewData() {
        // Update stats
        const totalRevenue = this.orders
            .filter(order => order.status !== 'cancelled')
            .reduce((sum, order) => sum + order.amount, 0);
        
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('totalOrders').textContent = this.orders.length;
        document.getElementById('totalProducts').textContent = this.vendorProducts.length;
        document.getElementById('totalCustomers').textContent = this.orders.length; // Simplified
        
        // Load recent orders
        this.loadRecentOrders();
        this.loadTopProducts();
    }

    loadRecentOrders() {
        const tbody = document.getElementById('recentOrdersTable');
        const recentOrders = this.orders.slice(0, 5);
        
        tbody.innerHTML = recentOrders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>$${order.amount.toFixed(2)}</td>
                <td><span class="status-badge ${order.status}">${order.status}</span></td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
            </tr>
        `).join('');
    }

    loadTopProducts() {
        const topProducts = [...this.vendorProducts]
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);
        
        const container = document.getElementById('topProductsList');
        container.innerHTML = topProducts.map(product => `
            <div class="product-item">
                <div class="product-image-small">
                    <i class="${product.image}"></i>
                </div>
                <div class="product-details">
                    <div class="product-name">${product.title}</div>
                    <div class="product-sales">${product.sales} sales • $${product.price}</div>
                </div>
            </div>
        `).join('');
    }

    loadProducts() {
        this.renderProducts(this.vendorProducts);
    }

    renderProducts(products) {
        const grid = document.getElementById('vendorProductsGrid');
        
        if (products.length === 0) {
            grid.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">No products found</p>';
            return;
        }
        
        grid.innerHTML = products.map(product => `
            <div class="vendor-product-card">
                <div class="product-image">
                    <i class="${product.image}"></i>
                    <div class="product-status">
                        <span class="status-badge ${product.status}">${product.status.replace('-', ' ')}</span>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-title">${product.title}</div>
                    <div class="product-price">$${product.price}</div>
                    <div class="product-stats">
                        <span>Stock: ${product.stock}</span>
                        <span>Sales: ${product.sales}</span>
                        <span>Rating: ${product.rating}★</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn-small btn-edit" onclick="dashboard.editProduct(${product.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-small btn-delete" onclick="dashboard.deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    filterProducts() {
        const category = document.getElementById('categoryFilter').value;
        const status = document.getElementById('statusFilter').value;
        
        let filtered = this.vendorProducts;
        
        if (category) {
            filtered = filtered.filter(product => product.category === category);
        }
        
        if (status) {
            filtered = filtered.filter(product => product.status === status);
        }
        
        this.renderProducts(filtered);
    }

    searchProducts() {
        const searchTerm = document.getElementById('productSearch').value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.renderProducts(this.vendorProducts);
            return;
        }
        
        const filtered = this.vendorProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
        
        this.renderProducts(filtered);
    }

    loadOrders() {
        this.renderOrders(this.orders);
    }

    renderOrders(orders) {
        const tbody = document.getElementById('ordersTable');
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #666;">No orders found</td></tr>';
            return;
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${order.products}</td>
                <td>$${order.amount.toFixed(2)}</td>
                <td><span class="status-badge ${order.status}">${order.status}</span></td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn view" onclick="dashboard.viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="dashboard.updateOrderStatus('${order.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    filterOrders() {
        const status = document.getElementById('orderStatusFilter').value;
        const dateRange = document.getElementById('dateRange').value;
        
        let filtered = this.orders;
        
        if (status) {
            filtered = filtered.filter(order => order.status === status);
        }
        
        // Simple date filtering (could be enhanced)
        if (dateRange) {
            const today = new Date();
            const filterDate = new Date();
            
            switch(dateRange) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    filterDate.setDate(today.getDate() - 7);
                    break;
                case 'month':
                    filterDate.setMonth(today.getMonth() - 1);
                    break;
                case 'quarter':
                    filterDate.setMonth(today.getMonth() - 3);
                    break;
            }
            
            filtered = filtered.filter(order => new Date(order.date) >= filterDate);
        }
        
        this.renderOrders(filtered);
    }

    loadAnalytics() {
        // Analytics would be loaded here
        // For demo purposes, we're showing placeholder content
        console.log('Loading analytics data...');
    }

    loadStoreSettings() {
        // Load current store settings
        if (this.currentUser) {
            document.getElementById('storeName').value = this.currentUser.storeName || '';
            document.getElementById('storeDescription').value = this.currentUser.storeDescription || '';
            document.getElementById('storeEmail').value = this.currentUser.email || '';
        }
    }

    showAddProductModal() {
        document.getElementById('addProductModal').style.display = 'block';
    }

    hideAddProductModal() {
        document.getElementById('addProductModal').style.display = 'none';
        document.getElementById('addProductForm').reset();
    }

    handleAddProduct(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const newProduct = {
            id: Date.now(), // Simple ID generation
            title: document.getElementById('productTitle').value,
            price: parseFloat(document.getElementById('productPrice').value),
            category: document.getElementById('productCategory').value,
            stock: parseInt(document.getElementById('productStock').value),
            description: document.getElementById('productDescription').value,
            status: 'active',
            sales: 0,
            rating: 0,
            image: this.getCategoryIcon(document.getElementById('productCategory').value)
        };
        
        this.vendorProducts.push(newProduct);
        this.hideAddProductModal();
        this.showNotification('Product added successfully!', 'success');
        
        // Refresh products view if currently active
        if (this.currentTab === 'products') {
            this.loadProducts();
        }
        
        // Update overview stats
        this.loadOverviewData();
    }

    getCategoryIcon(category) {
        const icons = {
            'electronics': 'fas fa-laptop',
            'fashion': 'fas fa-tshirt',
            'home': 'fas fa-home',
            'sports': 'fas fa-dumbbell',
            'books': 'fas fa-book',
            'beauty': 'fas fa-heart'
        };
        return icons[category] || 'fas fa-box';
    }

    editProduct(productId) {
        const product = this.vendorProducts.find(p => p.id === productId);
        if (!product) return;
        
        // For demo, just show an alert
        alert(`Edit product: ${product.title}\n\nThis would open an edit modal in a full implementation.`);
    }

    deleteProduct(productId) {
        const product = this.vendorProducts.find(p => p.id === productId);
        if (!product) return;
        
        if (confirm(`Are you sure you want to delete "${product.title}"?`)) {
            this.vendorProducts = this.vendorProducts.filter(p => p.id !== productId);
            this.showNotification('Product deleted successfully!', 'success');
            
            if (this.currentTab === 'products') {
                this.loadProducts();
            }
            
            this.loadOverviewData();
        }
    }

    viewOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;
        
        alert(`Order Details:\n\nOrder ID: ${order.id}\nCustomer: ${order.customer}\nProducts: ${order.products}\nAmount: $${order.amount.toFixed(2)}\nStatus: ${order.status}\nDate: ${order.date}`);
    }

    updateOrderStatus(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;
        
        const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        const currentIndex = statuses.indexOf(order.status);
        const nextStatus = statuses[currentIndex + 1] || statuses[0];
        
        if (confirm(`Update order ${orderId} status from "${order.status}" to "${nextStatus}"?`)) {
            order.status = nextStatus;
            this.showNotification('Order status updated!', 'success');
            
            if (this.currentTab === 'orders') {
                this.loadOrders();
            }
            
            this.loadOverviewData();
        }
    }

    exportOrders() {
        // Simple CSV export
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Order ID,Customer,Products,Amount,Status,Date\n"
            + this.orders.map(order => 
                `${order.id},${order.customer},"${order.products}",${order.amount},${order.status},${order.date}`
            ).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "orders.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Orders exported successfully!', 'success');
    }

    handleStoreInfo(e) {
        e.preventDefault();
        
        // Update user data
        if (this.currentUser) {
            this.currentUser.storeName = document.getElementById('storeName').value;
            this.currentUser.storeDescription = document.getElementById('storeDescription').value;
            this.currentUser.email = document.getElementById('storeEmail').value;
            this.currentUser.phone = document.getElementById('storePhone').value;
            
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.updateVendorInfo();
            this.showNotification('Store information updated!', 'success');
        }
    }

    handleNotificationSettings(e) {
        e.preventDefault();
        this.showNotification('Notification preferences updated!', 'success');
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
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

// Utility function to go back to main site
function goToMainSite() {
    window.location.href = 'index.html';
}

// Initialize the dashboard
const dashboard = new VendorDashboard();

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