# ShopKart Backend API

A comprehensive Node.js/Express backend for a multi-vendor e-commerce platform with authentication, product management, order processing, and admin functionality.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Multi-Vendor Support**: Separate vendor profiles and dashboards
- **Product Management**: CRUD operations with search, filtering, and categorization
- **Order Processing**: Complete order lifecycle management
- **Admin Panel**: System administration and analytics
- **Security**: Rate limiting, input validation, and secure password hashing
- **File Uploads**: Support for product images and vendor documents

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, bcryptjs, express-rate-limit
- **Validation**: express-validator
- **File Upload**: Multer

## Installation

1. **Clone the repository**
   ```bash
   cd shopkart/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `config.env` and update with your values
   - Set up MongoDB connection string
   - Configure JWT secret

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shopkart
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
UPLOAD_PATH=./uploads
MAX_FILE_UPLOAD=1000000
```

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | User login | Public |
| GET | `/me` | Get current user | Private |
| PUT | `/profile` | Update user profile | Private |
| PUT | `/change-password` | Change password | Private |

### Product Routes (`/api/products`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all products with filtering | Public |
| GET | `/:id` | Get single product | Public |
| POST | `/` | Create new product | Vendor |
| PUT | `/:id` | Update product | Vendor |
| DELETE | `/:id` | Delete product | Vendor |
| GET | `/category/:category` | Get products by category | Public |
| GET | `/search/:query` | Search products | Public |

### Vendor Routes (`/api/vendors`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all vendors | Public |
| GET | `/:id` | Get single vendor | Public |
| GET | `/dashboard/stats` | Get vendor dashboard data | Vendor |
| PUT | `/profile` | Update vendor profile | Vendor |
| GET | `/dashboard/products` | Get vendor's products | Vendor |
| GET | `/dashboard/orders` | Get vendor's orders | Vendor |
| PUT | `/orders/:orderId/items/:itemId` | Update order item status | Vendor |

### Order Routes (`/api/orders`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/` | Create new order | Customer |
| GET | `/` | Get user's orders | Customer |
| GET | `/:id` | Get single order | Customer |
| PUT | `/:id/cancel` | Cancel order | Customer |
| PUT | `/:id/payment` | Update payment status | Customer |
| GET | `/:orderNumber/track` | Track order | Public |

### User Routes (`/api/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all users | Admin |
| GET | `/:id` | Get single user | Admin |
| PUT | `/:id/status` | Update user status | Admin |
| DELETE | `/:id` | Delete user | Admin |

### Admin Routes (`/api/admin`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/dashboard` | Get dashboard statistics | Admin |
| GET | `/vendors` | Get all vendors for management | Admin |
| PUT | `/vendors/:id/status` | Update vendor status | Admin |
| GET | `/orders` | Get all orders | Admin |
| GET | `/orders/:id` | Get single order details | Admin |
| PUT | `/orders/:id/status` | Update order status | Admin |
| GET | `/analytics` | Get system analytics | Admin |

## Data Models

### User Model
- Basic user information
- Authentication credentials
- Role-based access (customer, vendor, admin)
- Profile information and address

### Vendor Model
- Store information and branding
- Business details and verification
- Performance statistics
- Bank details for payments

### Product Model
- Product details and specifications
- Inventory management
- SEO optimization
- Image and variant support

### Order Model
- Order items and pricing
- Shipping and billing addresses
- Payment information
- Status tracking and timeline

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### User Roles

- **Customer**: Can browse products, place orders, manage profile
- **Vendor**: Can manage products, view orders, access dashboard
- **Admin**: Full system access, user management, analytics

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Success Responses

Successful responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {} // Response data
}
```

## Pagination

List endpoints support pagination:

```json
{
  "success": true,
  "count": 20,
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "data": []
}
```

## Filtering and Sorting

### Products
- Filter by category, price range, vendor
- Sort by price, rating, date
- Search by title and description
- Featured products filter

### Orders
- Filter by status, date range
- Sort by date, total amount

### Users/Vendors
- Filter by status, type
- Search by name, email
- Sort by registration date

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: All inputs validated using express-validator
- **Password Security**: Bcrypt hashing with salt
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers protection

## File Upload

- **Product Images**: Multiple images per product
- **Vendor Documents**: Business verification documents
- **File Types**: Images (jpg, png, gif)
- **Size Limit**: 1MB per file
- **Storage**: Local filesystem (configurable)

## Development

### Running Tests
```bash
npm test
```

### Code Structure
```
backend/
├── models/          # Mongoose models
├── routes/          # Express routes
├── middleware/      # Custom middleware
├── uploads/         # File uploads
├── config.env       # Environment variables
└── server.js        # Main server file
```

### Adding New Features

1. Create model in `models/`
2. Add routes in `routes/`
3. Update middleware if needed
4. Add validation rules
5. Update documentation

## Deployment

### Production Setup

1. **Environment**: Set `NODE_ENV=production`
2. **Database**: Use production MongoDB instance
3. **Security**: Update CORS origins
4. **Monitoring**: Add logging and monitoring
5. **SSL**: Enable HTTPS in production

### Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create GitHub issues
- Check documentation
- Review API endpoints

---

**ShopKart Backend API** - Built with ❤️ using Node.js and Express 