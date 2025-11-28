# MongoDB Setup Guide

This guide will help you set up MongoDB for the Health Analytics Service. You have two options: **Local MongoDB Installation** or **MongoDB Atlas (Cloud)**.

## Option 1: Local MongoDB Installation (Windows)

### Step 1: Download MongoDB

1. Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Select:
   - **Version**: Latest stable version (e.g., 7.0.x)
   - **Platform**: Windows
   - **Package**: MSI
3. Click **Download**

### Step 2: Install MongoDB

1. Run the downloaded `.msi` installer
2. Choose **Complete** installation
3. Install MongoDB as a Service:
   - Check "Install MongoDB as a Service"
   - Service Name: `MongoDB`
   - Data Directory: `C:\Program Files\MongoDB\Server\7.0\data`
   - Log Directory: `C:\Program Files\MongoDB\Server\7.0\log`
4. **Important**: Install MongoDB Compass (GUI tool) - check this option
5. Complete the installation

### Step 3: Verify Installation

1. Open Command Prompt (Run as Administrator)
2. Check if MongoDB service is running:
   ```bash
   sc query MongoDB
   ```
   You should see `STATE: 4 RUNNING`

3. Test MongoDB connection:
   ```bash
   mongosh
   ```
   You should see the MongoDB shell prompt

4. Exit the shell:
   ```
   exit
   ```

### Step 4: Configure Connection String

Your `.env` file is already configured to use local MongoDB:
```
MONGODB_URI=mongodb://localhost:27017/peditrack-health-analytics
```

This will create a database named `peditrack-health-analytics` automatically when you first start the service.

---

## Option 2: MongoDB Atlas (Cloud) - Recommended for Production

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Verify your email address

### Step 2: Create a Cluster

1. After logging in, click **"Build a Database"**
2. Choose **FREE** tier (M0 Sandbox)
3. Select your preferred cloud provider and region (closest to you)
4. Cluster Name: `peditrack-cluster` (or any name)
5. Click **"Create Cluster"** (this takes 1-3 minutes)

### Step 3: Create Database User

1. In the **Security** section, click **"Database Access"**
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: Choose a username (e.g., `peditrack-admin`)
5. Password: Generate a secure password (save it!)
6. Database User Privileges: **Read and write to any database**
7. Click **"Add User"**

### Step 4: Configure Network Access

1. In the **Security** section, click **"Network Access"**
2. Click **"Add IP Address"**
3. For development: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - For production, you should restrict this to specific IP addresses
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go back to **"Database"** section
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string, it looks like:
   ```
   mongodb+srv://<username>:<password>@peditrack-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Update .env File

1. Open your `.env` file
2. Replace the `MONGODB_URI` with your Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://peditrack-admin:YOUR_PASSWORD@peditrack-cluster.xxxxx.mongodb.net/peditrack-health-analytics?retryWrites=true&w=majority
   ```
   
   Replace:
   - `<username>` with your database username
   - `<password>` with your database password
   - Add `/peditrack-health-analytics` before the `?` to specify the database name

---

## Testing the Connection

### Start the Service

1. Navigate to the service directory:
   ```bash
   cd services/health-analytics-service
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. You should see:
   ```
   ✅ MongoDB connected successfully
   🚀 Health Analytics Service running on port 5001
   📍 Environment: development
   🔗 Health check: http://localhost:5001/health
   ```

### Test the Health Endpoint

Open your browser or use curl:
```bash
curl http://localhost:5001/health
```

You should get:
```json
{"status":"OK","timestamp":"2024-11-25T..."}
```

---

## MongoDB Compass (GUI Tool)

MongoDB Compass provides a visual interface to manage your database.

### Connecting with Compass

1. Open MongoDB Compass
2. Connection String:
   - **Local**: `mongodb://localhost:27017`
   - **Atlas**: Use the connection string from Atlas (without database name)
3. Click **Connect**

### Viewing Your Data

1. After connecting, you'll see your databases
2. Click on `peditrack-health-analytics`
3. You can view collections: `babies`, `measurements`, `healthrecords`, `medications`, `aiinsights`

---

## Troubleshooting

### Local MongoDB Issues

**Problem**: MongoDB service won't start
- **Solution**: Run Command Prompt as Administrator:
  ```bash
  net start MongoDB
  ```

**Problem**: "MongoServerError: command hostInfo requires authentication"
- **Solution**: Your local MongoDB is running with authentication. Update connection string to:
  ```
  mongodb://username:password@localhost:27017/peditrack-health-analytics
  ```

### Atlas Issues

**Problem**: "MongoServerError: bad auth"
- **Solution**: Double-check username and password in connection string

**Problem**: "Connection timeout"
- **Solution**: Check Network Access settings in Atlas, ensure your IP is whitelisted

**Problem**: "SSL/TLS connection error"
- **Solution**: Ensure you're using `mongodb+srv://` (not `mongodb://`) for Atlas

---

## Next Steps

Once MongoDB is connected successfully:
1. Test the API endpoints using Postman or curl
2. Create a baby profile
3. Add measurements
4. Generate AI insights

Refer to `API_DOCS.md` for detailed API documentation.
