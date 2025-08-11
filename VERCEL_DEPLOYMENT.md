# 🚀 Vercel Deployment Guide for ShopKart

This guide will help you deploy your ShopKart multi-vendor e-commerce platform to Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas Account**: Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas)
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)

## 🗄️ Step 1: Set Up MongoDB Atlas (Database)

Since Vercel is serverless, you need a cloud database. MongoDB Atlas is perfect for this:

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose "M0 Sandbox" (Free tier)
   - Select a cloud provider and region
   - Name your cluster (e.g., "shopkart-cluster")

3. **Create Database User**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (save these!)
   - Set role to "Atlas admin" for simplicity

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is needed for Vercel's dynamic IPs

5. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

## 🔧 Step 2: Prepare Your Code

1. **Update CORS Configuration**
   
   Edit `backend/server.js` line 36 to include your Vercel domain:
   ```javascript
   app.use(cors({
     origin: process.env.NODE_ENV === 'production' 
       ? [process.env.CORS_ORIGIN || 'https://your-app-name.vercel.app'] 
       : ['http://localhost:3000', 'http://127.0.0.1:5500', 'null'],
     credentials: true
   }));
   ```

2. **Create Package.json in Root**
   
   Create `package.json` in the shopkart root directory:
   ```json
   {
     "name": "shopkart",
     "version": "1.0.0",
     "description": "Multi-vendor e-commerce platform",
     "scripts": {
       "build": "echo 'Build complete'",
       "start": "node backend/server.js"
     },
     "dependencies": {}
   }
   ```

## 🚀 Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository
   - Select the `shopkart` folder as the root directory

2. **Configure Build Settings**
   - Framework Preset: "Other"
   - Root Directory: `shopkart` (if not already selected)
   - Build Command: Leave empty or use `echo "Build complete"`
   - Output Directory: Leave empty
   - Install Command: `npm install --prefix backend`

3. **Add Environment Variables**
   
   In the Vercel dashboard, go to your project settings and add these environment variables:
   
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shopkart?retryWrites=true&w=majority
   JWT_SECRET=your_very_secure_jwt_secret_key_minimum_32_characters_long
   JWT_EXPIRE=7d
   UPLOAD_PATH=./uploads
   MAX_FILE_UPLOAD=1000000
   ```
   
   **Important**: Replace the MongoDB URI with your actual Atlas connection string!

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be available at `https://your-app-name.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Directory**
   ```bash
   cd shopkart
   vercel
   ```

4. **Follow the prompts and add environment variables when asked**

## 🔐 Step 4: Configure Environment Variables

Add these environment variables in your Vercel project settings:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Sets production mode |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `your-secret-key` | JWT secret (min 32 characters) |
| `JWT_EXPIRE` | `7d` | JWT token expiration |
| `UPLOAD_PATH` | `./uploads` | File upload directory |
| `MAX_FILE_UPLOAD` | `1000000` | Max file size (1MB) |

## 🌐 Step 5: Update Frontend API Calls

If your frontend JavaScript files have hardcoded API URLs, update them to use your Vercel domain:

```javascript
// Replace localhost URLs with your Vercel domain
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : 'https://your-app-name.vercel.app/api';
```

## ✅ Step 6: Test Your Deployment

1. **Visit your deployed app**: `https://your-app-name.vercel.app`
2. **Test API endpoints**: `https://your-app-name.vercel.app/api/health`
3. **Check all pages**:
   - Homepage: `/`
   - Admin Panel: `/admin-panel.html`
   - Vendor Dashboard: `/vendor-dashboard.html`

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Check MongoDB Atlas connection string
   - Ensure network access is set to "Allow from anywhere"
   - Verify database user credentials

2. **CORS Errors**
   - Update CORS configuration in `backend/server.js`
   - Add your Vercel domain to allowed origins

3. **API Routes Not Working**
   - Check `vercel.json` configuration
   - Ensure all API routes start with `/api/`

4. **Environment Variables Not Loading**
   - Verify environment variables in Vercel dashboard
   - Redeploy after adding new variables

5. **File Upload Issues**
   - Note: Vercel has limitations on file uploads
   - Consider using external storage (AWS S3, Cloudinary)

### Logs and Debugging:

- View deployment logs in Vercel dashboard
- Use `vercel logs` command to see runtime logs
- Check browser console for frontend errors

## 🎉 Success!

Your ShopKart platform should now be live on Vercel! 

**Next Steps:**
1. Set up a custom domain (optional)
2. Configure external file storage for uploads
3. Set up monitoring and analytics
4. Add SSL certificate (automatic with Vercel)

## 📞 Support

If you encounter issues:
1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. MongoDB Atlas documentation: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
3. Review the troubleshooting section above

Happy deploying! 🚀 