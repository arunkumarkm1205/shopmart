// Admin Panel JavaScript

class AdminPanel {
    constructor() {
        this.currentTab = 'dashboard';
        this.users = [];
        this.vendors = [];
        this.orders = [];
        this.products = [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.init();
    }

    init() {
        this.loadSampleData();
        this.setupEventListeners();
        this.updateAdminInfo();
        this.loadDashboardData();
        this.checkAuth();
    }

    checkAuth() {
        // For demo purposes, allow access if user exists
        // In real implementation, check for admin role
        if (!this.currentUser) {
            alert('Access denied. Please login first.');
            window.location.href = 'index.html';
            return;
        }
    }

    loadSampleData() {
        // Sample users
        this.users = [
            {
                id: 1,
                name: "John Doe",
                email: "john@example.com",
                type: "customer",
                status: "active",
                joinDate: "2024-01-10",
                avatar: "JD"
            },
            {
                id: 2,
                name: "Jane Smith",
                email: "jane@example.com",
                type: "vendor",
                status: "active",
                joinDate: "2024-01-08",
                avatar: "JS"
            },
            {
                id: 3,
                name: "Mike Johnson",
                email: "mike@example.com",
                type: "customer",
                status: "suspended",
                joinDate: "2024-01-05",
                avatar: "MJ"
            },
            {
                id: 4,
                name: "Sarah Wilson",
                email: "sarah@example.com",
                type: "vendor",
                status: "pending",
                joinDate: "2024-01-15",
                avatar: "SW"
            }
        ];

        // Sample vendors
        this.vendors = [
            {
                id: 1,
                name: "TechHub Electronics",
                owner: "Jane Smith",
                email: "jane@example.com",
                status: "active",
                products: 23,
                revenue: 12450.75,
                joinDate: "2024-01-08",
                description: "Premium electronics and gadgets"
            },
            {
                id: 2,
                name: "Fashion Forward",
                owner: "Alex Brown",
                email: "alex@example.com",
                status: "pending",
                products: 0,
                revenue: 0,
                joinDate: "2024-01-15",
                description: "Trendy clothing and accessories"
            },
            {
                id: 3,
                name: "Home Essentials",
                owner: "Emma Davis",
                email: "emma@example.com",
                status: "active",
                products: 18,
                revenue: 8750.30,
                joinDate: "2024-01-12",
                description: "Everything for your home"
            }
        ];

        // Sample orders (platform-wide)
        this.orders = [
            {
                id: "ORD001",
                customer: "John Doe",
                vendor: "TechHub Electronics",
                products: "Wireless Headphones x2",
                amount: 159.98,
                status: "pending",
                date: "2024-01-15"
            },
            {
                id: "ORD002",
                customer: "Mike Johnson",
                vendor: "Home Essentials",
                products: "LED Desk Lamp x1",
                amount: 45.99,
                status: "processing",
                date: "2024-01-14"
            },
            {
                id: "ORD003",
                customer: "Sarah Wilson",
                vendor: "TechHub Electronics",
                products: "Smartphone Stand x3",
                amount: 47.97,
                status: "shipped",
                date: "2024-01-13"
            },
            {
                id: "ORD004",
                customer: "John Doe",
                vendor: "Home Essentials",
                products: "Smart Bulb x4",
                amount: 99.96,
                status: "delivered",
                date: "2024-01-12"
            }
        ];

        // Sample products (platform-wide)
        this.products = [
            {
                id: 1,
                title: "Wireless Bluetooth Headphones",
                vendor: "TechHub Electronics",
                price: 79.99,
                category: "electronics",
                status: "active",
                flagged: false
            },
            {
                id: 2,
                title: "Smart LED Desk Lamp",
                vendor: "Home Essentials",
                price: 45.99,
                category: "home",
                status: "active",
                flagged: false
            },
            {
                id: 3,
                title: "Questionable Product",
                vendor: "Unknown Vendor",
                price: 999.99,
                category: "electronics",
                status: "inactive",
                flagged: true
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
        document.getElementById('addUserBtn').addEventListener('click', () => this.showUserModal());
        document.getElementById('closeUserModal').addEventListener('click', () => this.hideUserModal());
        document.getElementById('cancelUserModal').addEventListener('click', () => this.hideUserModal());
        
        // Form submissions
        document.getElementById('userForm').addEventListener('submit', (e) => this.handleUserForm(e));
        document.getElementById('generalSettingsForm').addEventListener('submit', (e) => this.handleGeneralSettings(e));
        document.getElementById('commissionForm').addEventListener('submit', (e) => this.handleCommissionSettings(e));
        document.getElementById('securityForm').addEventListener('submit', (e) => this.handleSecuritySettings(e));
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Search and filters
        document.getElementById('searchUserBtn').addEventListener('click', () => this.searchUsers());
        document.getElementById('userSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchUsers();
        });
        
        document.getElementById('userTypeFilter').addEventListener('change', () => this.filterUsers());
        document.getElementById('userStatusFilter').addEventListener('change', () => this.filterUsers());
        
        document.getElementById('searchVendorBtn').addEventListener('click', () => this.searchVendors());
        document.getElementById('vendorSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchVendors();
        });
        
        document.getElementById('vendorStatusFilter').addEventListener('change', () => this.filterVendors());
        
        // Export functions
        document.getElementById('exportUsersBtn').addEventListener('click', () => this.exportUsers());
        document.getElementById('exportVendorsBtn').addEventListener('click', () => this.exportVendors());
        document.getElementById('exportAllOrdersBtn').addEventListener('click', () => this.exportOrders());
        
        // Order filters
        document.getElementById('orderStatusFilter').addEventListener('change', () => this.filterOrders());
        document.getElementById('orderDateRange').addEventListener('change', () => this.filterOrders());
        
        // Product filters
        document.getElementById('productCategoryFilter').addEventListener('change', () => this.filterProducts());
        document.getElementById('productStatusFilter').addEventListener('change', () => this.filterProducts());
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideUserModal();
            }
        });
    }

    updateAdminInfo() {
        if (this.currentUser) {
            document.getElementById('adminName').textContent = this.currentUser.name || 'Administrator';
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
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'vendors':
                this.loadVendors();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    loadDashboardData() {
        this.loadDashboard();
    }

    loadDashboard() {
        // Update overview stats
        const totalRevenue = this.orders
            .filter(order => order.status !== 'cancelled')
            .reduce((sum, order) => sum + order.amount, 0);
        
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('totalUsers').textContent = this.users.length;
        document.getElementById('totalVendors').textContent = this.vendors.filter(v => v.status === 'active').length;
        document.getElementById('totalOrders').textContent = this.orders.length;
        
        this.loadRecentOrders();
        this.loadPendingApprovals();
    }

    loadRecentOrders() {
        const tbody = document.getElementById('recentOrdersTable');
        const recentOrders = this.orders.slice(0, 5);
        
        tbody.innerHTML = recentOrders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${order.vendor}</td>
                <td>$${order.amount.toFixed(2)}</td>
                <td><span class="status-badge ${order.status}">${order.status}</span></td>
            </tr>
        `).join('');
    }

    loadPendingApprovals() {
        const container = document.getElementById('pendingApprovals');
        const pendingVendors = this.vendors.filter(v => v.status === 'pending');
        
        if (pendingVendors.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No pending approvals</p>';
            return;
        }
        
        container.innerHTML = pendingVendors.map(vendor => `
            <div class="approval-item">
                <div class="approval-info">
                    <h4>${vendor.name}</h4>
                    <p>Owner: ${vendor.owner} • Applied: ${new Date(vendor.joinDate).toLocaleDateString()}</p>
                </div>
                <div class="approval-actions">
                    <button class="btn-approve" onclick="adminPanel.approveVendor(${vendor.id})">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn-reject" onclick="adminPanel.rejectVendor(${vendor.id})">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadUsers() {
        this.renderUsers(this.users);
    }

    renderUsers(users) {
        const tbody = document.getElementById('usersTable');
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #666;">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">${user.avatar}</div>
                        <div class="user-details">
                            <h4>${user.name}</h4>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="status-badge ${user.type}">${user.type}</span></td>
                <td>
                    <div class="user-status">
                        <span class="status-indicator ${user.status}"></span>
                        ${user.status}
                    </div>
                </td>
                <td>${new Date(user.joinDate).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="adminPanel.viewUser(${user.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="adminPanel.editUser(${user.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn suspend" onclick="adminPanel.suspendUser(${user.id})" title="Suspend">
                            <i class="fas fa-ban"></i>
                        </button>
                        <button class="action-btn delete" onclick="adminPanel.deleteUser(${user.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    loadVendors() {
        this.renderVendors(this.vendors);
    }

    renderVendors(vendors) {
        const grid = document.getElementById('adminVendorsGrid');
        
        if (vendors.length === 0) {
            grid.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">No vendors found</p>';
            return;
        }
        
        grid.innerHTML = vendors.map(vendor => `
            <div class="admin-vendor-card">
                <div class="vendor-status-badge">
                    <span class="status-badge ${vendor.status}">${vendor.status}</span>
                </div>
                <div class="vendor-header">
                    <div class="vendor-avatar">
                        <i class="fas fa-store"></i>
                    </div>
                    <div class="vendor-info">
                        <h3>${vendor.name}</h3>
                        <p>Owner: ${vendor.owner}</p>
                    </div>
                </div>
                <div class="vendor-stats">
                    <div class="vendor-stat">
                        <h4>${vendor.products}</h4>
                        <p>Products</p>
                    </div>
                    <div class="vendor-stat">
                        <h4>$${vendor.revenue.toFixed(0)}</h4>
                        <p>Revenue</p>
                    </div>
                    <div class="vendor-stat">
                        <h4>${Math.floor(Math.random() * 50) + 10}</h4>
                        <p>Orders</p>
                    </div>
                </div>
                <div class="vendor-actions">
                    <button class="btn-small btn-edit" onclick="adminPanel.viewVendor(${vendor.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn-small btn-edit" onclick="adminPanel.editVendor(${vendor.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${vendor.status === 'pending' ? 
                        `<button class="btn-small btn-approve" onclick="adminPanel.approveVendor(${vendor.id})">
                            <i class="fas fa-check"></i> Approve
                        </button>` : ''
                    }
                </div>
            </div>
        `).join('');
    }

    loadOrders() {
        this.renderOrders(this.orders);
    }

    renderOrders(orders) {
        const tbody = document.getElementById('allOrdersTable');
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #666;">No orders found</td></tr>';
            return;
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${order.vendor}</td>
                <td>${order.products}</td>
                <td>$${order.amount.toFixed(2)}</td>
                <td><span class="status-badge ${order.status}">${order.status}</span></td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="adminPanel.viewOrder('${order.id}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="adminPanel.editOrder('${order.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    loadProducts() {
        this.renderProducts(this.products);
    }

    renderProducts(products) {
        const grid = document.getElementById('adminProductsGrid');
        
        if (products.length === 0) {
            grid.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">No products found</p>';
            return;
        }
        
        grid.innerHTML = products.map(product => `
            <div class="admin-product-card">
                ${product.flagged ? '<div class="product-flag">FLAGGED</div>' : ''}
                <div class="product-image">
                    <i class="fas fa-box"></i>
                </div>
                <div class="product-info">
                    <div class="product-title">${product.title}</div>
                    <div class="product-vendor-info">by ${product.vendor}</div>
                    <div class="product-price">$${product.price}</div>
                    <div class="product-actions">
                        <button class="btn-small btn-edit" onclick="adminPanel.viewProduct(${product.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${product.flagged ? 
                            `<button class="btn-small btn-delete" onclick="adminPanel.removeProduct(${product.id})">
                                <i class="fas fa-ban"></i> Remove
                            </button>` : 
                            `<button class="btn-small btn-delete" onclick="adminPanel.flagProduct(${product.id})">
                                <i class="fas fa-flag"></i> Flag
                            </button>`
                        }
                    </div>
                </div>
            </div>
        `).join('');
    }

    loadAnalytics() {
        // Analytics would be loaded here
        console.log('Loading analytics...');
    }

    loadSettings() {
        // Settings are already loaded in HTML
        console.log('Settings loaded');
    }

    // User Management Functions
    showUserModal(userId = null) {
        const modal = document.getElementById('userModal');
        const title = document.getElementById('userModalTitle');
        const form = document.getElementById('userForm');
        
        if (userId) {
            const user = this.users.find(u => u.id === userId);
            if (user) {
                title.textContent = 'Edit User';
                document.getElementById('userName').value = user.name;
                document.getElementById('userEmail').value = user.email;
                document.getElementById('userType').value = user.type;
                document.getElementById('userStatus').value = user.status;
                form.dataset.userId = userId;
            }
        } else {
            title.textContent = 'Add User';
            form.reset();
            delete form.dataset.userId;
        }
        
        modal.style.display = 'block';
    }

    hideUserModal() {
        document.getElementById('userModal').style.display = 'none';
    }

    handleUserForm(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            type: document.getElementById('userType').value,
            status: document.getElementById('userStatus').value
        };
        
        const userId = e.target.dataset.userId;
        
        if (userId) {
            // Edit existing user
            const userIndex = this.users.findIndex(u => u.id == userId);
            if (userIndex !== -1) {
                this.users[userIndex] = { ...this.users[userIndex], ...formData };
                this.showNotification('User updated successfully!', 'success');
            }
        } else {
            // Add new user
            const newUser = {
                id: Date.now(),
                ...formData,
                joinDate: new Date().toISOString().split('T')[0],
                avatar: formData.name.split(' ').map(n => n[0]).join('').toUpperCase()
            };
            this.users.push(newUser);
            this.showNotification('User added successfully!', 'success');
        }
        
        this.hideUserModal();
        if (this.currentTab === 'users') {
            this.loadUsers();
        }
        this.loadDashboard();
    }

    viewUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            alert(`User Details:\n\nName: ${user.name}\nEmail: ${user.email}\nType: ${user.type}\nStatus: ${user.status}\nJoin Date: ${user.joinDate}`);
        }
    }

    editUser(userId) {
        this.showUserModal(userId);
    }

    suspendUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user && confirm(`Suspend user ${user.name}?`)) {
            user.status = user.status === 'suspended' ? 'active' : 'suspended';
            this.showNotification(`User ${user.status === 'suspended' ? 'suspended' : 'activated'}!`, 'success');
            this.loadUsers();
        }
    }

    deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user && confirm(`Delete user ${user.name}? This action cannot be undone.`)) {
            this.users = this.users.filter(u => u.id !== userId);
            this.showNotification('User deleted!', 'success');
            this.loadUsers();
            this.loadDashboard();
        }
    }

    // Vendor Management Functions
    approveVendor(vendorId) {
        const vendor = this.vendors.find(v => v.id === vendorId);
        if (vendor && confirm(`Approve vendor ${vendor.name}?`)) {
            vendor.status = 'active';
            this.showNotification('Vendor approved!', 'success');
            this.loadDashboard();
            if (this.currentTab === 'vendors') {
                this.loadVendors();
            }
        }
    }

    rejectVendor(vendorId) {
        const vendor = this.vendors.find(v => v.id === vendorId);
        if (vendor && confirm(`Reject vendor ${vendor.name}?`)) {
            vendor.status = 'rejected';
            this.showNotification('Vendor rejected!', 'success');
            this.loadDashboard();
            if (this.currentTab === 'vendors') {
                this.loadVendors();
            }
        }
    }

    viewVendor(vendorId) {
        const vendor = this.vendors.find(v => v.id === vendorId);
        if (vendor) {
            alert(`Vendor Details:\n\nName: ${vendor.name}\nOwner: ${vendor.owner}\nEmail: ${vendor.email}\nStatus: ${vendor.status}\nProducts: ${vendor.products}\nRevenue: $${vendor.revenue.toFixed(2)}`);
        }
    }

    editVendor(vendorId) {
        alert('Edit vendor functionality would be implemented here.');
    }

    // Product Management Functions
    viewProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            alert(`Product Details:\n\nTitle: ${product.title}\nVendor: ${product.vendor}\nPrice: $${product.price}\nCategory: ${product.category}\nStatus: ${product.status}\nFlagged: ${product.flagged ? 'Yes' : 'No'}`);
        }
    }

    flagProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product && confirm(`Flag product "${product.title}" for review?`)) {
            product.flagged = true;
            product.status = 'inactive';
            this.showNotification('Product flagged for review!', 'success');
            this.loadProducts();
        }
    }

    removeProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product && confirm(`Remove product "${product.title}"?`)) {
            this.products = this.products.filter(p => p.id !== productId);
            this.showNotification('Product removed!', 'success');
            this.loadProducts();
        }
    }

    // Order Management Functions
    viewOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            alert(`Order Details:\n\nOrder ID: ${order.id}\nCustomer: ${order.customer}\nVendor: ${order.vendor}\nProducts: ${order.products}\nAmount: $${order.amount.toFixed(2)}\nStatus: ${order.status}\nDate: ${order.date}`);
        }
    }

    editOrder(orderId) {
        alert('Edit order functionality would be implemented here.');
    }

    // Filter and Search Functions
    filterUsers() {
        const type = document.getElementById('userTypeFilter').value;
        const status = document.getElementById('userStatusFilter').value;
        
        let filtered = this.users;
        
        if (type) {
            filtered = filtered.filter(user => user.type === type);
        }
        
        if (status) {
            filtered = filtered.filter(user => user.status === status);
        }
        
        this.renderUsers(filtered);
    }

    searchUsers() {
        const searchTerm = document.getElementById('userSearch').value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.renderUsers(this.users);
            return;
        }
        
        const filtered = this.users.filter(user =>
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );
        
        this.renderUsers(filtered);
    }

    filterVendors() {
        const status = document.getElementById('vendorStatusFilter').value;
        
        let filtered = this.vendors;
        
        if (status) {
            filtered = filtered.filter(vendor => vendor.status === status);
        }
        
        this.renderVendors(filtered);
    }

    searchVendors() {
        const searchTerm = document.getElementById('vendorSearch').value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.renderVendors(this.vendors);
            return;
        }
        
        const filtered = this.vendors.filter(vendor =>
            vendor.name.toLowerCase().includes(searchTerm) ||
            vendor.owner.toLowerCase().includes(searchTerm)
        );
        
        this.renderVendors(filtered);
    }

    filterOrders() {
        const status = document.getElementById('orderStatusFilter').value;
        const dateRange = document.getElementById('orderDateRange').value;
        
        let filtered = this.orders;
        
        if (status) {
            filtered = filtered.filter(order => order.status === status);
        }
        
        // Simple date filtering
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

    filterProducts() {
        const category = document.getElementById('productCategoryFilter').value;
        const status = document.getElementById('productStatusFilter').value;
        
        let filtered = this.products;
        
        if (category) {
            filtered = filtered.filter(product => product.category === category);
        }
        
        if (status) {
            if (status === 'flagged') {
                filtered = filtered.filter(product => product.flagged);
            } else {
                filtered = filtered.filter(product => product.status === status);
            }
        }
        
        this.renderProducts(filtered);
    }

    // Export Functions
    exportUsers() {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "ID,Name,Email,Type,Status,Join Date\n"
            + this.users.map(user => 
                `${user.id},${user.name},${user.email},${user.type},${user.status},${user.joinDate}`
            ).join("\n");
        
        this.downloadCSV(csvContent, 'users.csv');
        this.showNotification('Users exported successfully!', 'success');
    }

    exportVendors() {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "ID,Name,Owner,Email,Status,Products,Revenue,Join Date\n"
            + this.vendors.map(vendor => 
                `${vendor.id},${vendor.name},${vendor.owner},${vendor.email},${vendor.status},${vendor.products},${vendor.revenue},${vendor.joinDate}`
            ).join("\n");
        
        this.downloadCSV(csvContent, 'vendors.csv');
        this.showNotification('Vendors exported successfully!', 'success');
    }

    exportOrders() {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Order ID,Customer,Vendor,Products,Amount,Status,Date\n"
            + this.orders.map(order => 
                `${order.id},${order.customer},${order.vendor},"${order.products}",${order.amount},${order.status},${order.date}`
            ).join("\n");
        
        this.downloadCSV(csvContent, 'orders.csv');
        this.showNotification('Orders exported successfully!', 'success');
    }

    downloadCSV(csvContent, filename) {
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Settings Functions
    handleGeneralSettings(e) {
        e.preventDefault();
        this.showNotification('General settings updated!', 'success');
    }

    handleCommissionSettings(e) {
        e.preventDefault();
        this.showNotification('Commission settings updated!', 'success');
    }

    handleSecuritySettings(e) {
        e.preventDefault();
        this.showNotification('Security settings updated!', 'success');
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

// Initialize the admin panel
const adminPanel = new AdminPanel(); 