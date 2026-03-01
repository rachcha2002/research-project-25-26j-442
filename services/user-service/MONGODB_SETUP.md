# MongoDB Setup Guide

Complete guide for setting up MongoDB for the PediTrack User Service.

## Option 1: MongoDB Atlas (Cloud - Recommended)

MongoDB Atlas is a fully managed cloud database service. Free tier available.

### Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click **"Try Free"** or **"Sign In"**
3. Create an account or sign in with Google
4. Complete the registration process

### Step 2: Create a Cluster

1. After logging in, click **"Build a Database"**
2. Choose deployment option:
   - **FREE** tier (M0 Sandbox) - Perfect for development
   - **Shared** tier - For small production apps
   - **Dedicated** tier - For larger production apps
3. Select cloud provider and region (choose one closest to you)
4. Click **"Create Cluster"**
5. Wait for cluster to be created (1-3 minutes)

### Step 3: Create Database User

1. In the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. **Authentication Method**: Password
4. **Username**: Choose a username (e.g., `peditrack_user`)
5. **Password**: Generate secure password or create your own
   - **Important**: Save this password! You'll need it for the connection string
6. **Database User Privileges**: Select **"Atlas admin"** or **"Read and write to any database"**
7. Click **"Add User"**

### Step 4: Configure Network Access

1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. Choose one of:
   - **Add Current IP Address** - Only your current IP (more secure)
   - **Allow Access from Anywhere** (0.0.0.0/0) - For development/testing
   - **Custom IP** - Specific IP addresses
4. Click **"Confirm"**

**⚠️ Security Note**: For production, only whitelist specific IPs. "Allow Access from Anywhere" is convenient for development but less secure.

### Step 5: Get Connection String

1. Click **"Database"** in the left sidebar
2. Find your cluster and click **"Connect"**
3. Choose **"Connect your application"**
4. **Driver**: Node.js
5. **Version**: 4.1 or later
6. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Configure Connection String

1. Replace `<username>` with your database username
2. Replace `<password>` with your database password
3. Add database name after `.net/`: `peditrack_users`
4. Final connection string should look like:
   ```
   mongodb+srv://peditrack_user:YourPassword123@cluster0.xxxxx.mongodb.net/peditrack_users?retryWrites=true&w=majority
   ```
5. Add this to your `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://peditrack_user:YourPassword123@cluster0.xxxxx.mongodb.net/peditrack_users?retryWrites=true&w=majority
   ```

### Step 7: Test Connection

1. Start your service:
   ```bash
   npm start
   ```
2. Look for: `✅ MongoDB connected successfully`
3. The database `peditrack_users` will be automatically created when you create your first user

---

## Option 2: Local MongoDB Installation

For completely local development without internet dependency.

### Windows Installation

1. **Download MongoDB**
   - Go to [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
   - Select **Windows** platform
   - Download MSI installer

2. **Install MongoDB**
   - Run the downloaded MSI file
   - Choose **"Complete"** installation
   - Install **MongoDB Compass** (GUI tool) - Recommended
   - Install as **Windows Service** (recommended)

3. **Start MongoDB**
   - MongoDB should start automatically as a service
   - Or manually run:
     ```bash
     "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
     ```

4. **Configure Connection String**
   - Add to `.env`:
     ```env
     MONGODB_URI=mongodb://localhost:27017/peditrack_users
     ```

### macOS Installation (using Homebrew)

```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Configure .env
MONGODB_URI=mongodb://localhost:27017/peditrack_users
```

### Linux Installation (Ubuntu/Debian)

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Configure .env
MONGODB_URI=mongodb://localhost:27017/peditrack_users
```

---

## Database Structure

The service will automatically create these collections when needed:

### Collections

#### `users`
Stores user account information, authentication data, and profile details.

**Indexes**:
- `email` (unique)
- `googleId` (unique, sparse)

**Sample Document**:
```json
{
  "_id": ObjectId("..."),
  "email": "user@example.com",
  "password": "$2a$10$...", // Hashed
  "name": "John Doe",
  "phone": "+1234567890",
  "profilePicture": "https://...",
  "googleId": "1234567890",
  "isEmailVerified": false,
  "defaultBabyProfile": ObjectId("..."),
  "refreshTokens": [],
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

#### `babyprofiles`
Stores baby profile information linked to users.

**Indexes**:
- `userId` (indexed)
- Compound: `userId + createdAt` (for sorting)

**Sample Document**:
```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),
  "name": "Emma Doe",
  "dateOfBirth": ISODate("2023-06-15"),
  "gender": "female",
  "photo": "https://...",
  "bloodType": "O+",
  "allergies": ["Peanuts", "Dairy"],
  "medicalNotes": "Premature birth",
  "isDefault": true,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

---

## Manual Index Creation (Optional)

Indexes are automatically created by Mongoose, but you can create them manually:

### Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Select `peditrack_users` database
4. Select `users` collection
5. Click **"Indexes"** tab
6. Click **"Create Index"**
7. Add indexes as needed

### Using MongoDB Shell

```javascript
// Connect to database
use peditrack_users

// Create indexes on users collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ googleId: 1 }, { unique: true, sparse: true })

// Create indexes on babyprofiles collection
db.babyprofiles.createIndex({ userId: 1 })
db.babyprofiles.createIndex({ userId: 1, createdAt: -1 })

// Verify indexes
db.users.getIndexes()
db.babyprofiles.getIndexes()
```

---

## Troubleshooting

### Connection Issues

**Error**: `MongoServerError: bad auth : authentication failed`
- **Solution**: Check your username and password in the connection string
- Ensure the database user has correct permissions

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`
- **Solution**: 
  - MongoDB service is not running (for local)
  - Check your IP is whitelisted (for Atlas)
  - Verify connection string format

**Error**: `getaddrinfo ENOTFOUND`
- **Solution**: Check your internet connection
- Verify the cluster hostname in connection string

### Atlas Network Access

If you can't connect to Atlas:
1. Go to **Network Access** in Atlas
2. Ensure your IP address is whitelisted
3. Try "Allow Access from Anywhere" for testing

### Local MongoDB Not Starting

**Windows**:
```bash
# Check if MongoDB service is running
sc query MongoDB

# Start service
net start MongoDB
```

**macOS/Linux**:
```bash
# Check status
sudo systemctl status mongod

# Start service
sudo systemctl start mongod
```

---

## Security Best Practices

### Production Checklist

✅ **Use strong database passwords**
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols

✅ **Restrict IP access**
- Only whitelist necessary IPs
- Never use 0.0.0.0/0 in production

✅ **Use environment variables**
- Never commit connection strings to git
- Keep .env file secure and private

✅ **Enable authentication**
- Always use username/password
- Consider enabling additional security features

✅ **Regular backups**
- Set up automatic backups in Atlas
- Test backup restoration

✅ **Monitor database**
- Set up alerts for unusual activity
- Monitor connection attempts

---

## Database Maintenance

### Backup (Atlas)

1. Go to **Clusters** in Atlas
2. Click on your cluster
3. Go to **"Backups"** tab
4. Enable **"Cloud Backups"**
5. Configure backup schedule

### Monitoring

**Atlas Dashboard**:
- View real-time metrics
- Monitor connections
- Check query performance

**Application Logs**:
```javascript
// Enable Mongoose debug mode in development
mongoose.set('debug', true);
```

---

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Node.js Driver](https://mongodb.github.io/node-mongodb-native/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB University (Free Courses)](https://university.mongodb.com/)

---

## Quick Reference

### Common Commands

```bash
# Start local MongoDB (Windows)
net start MongoDB

# Start local MongoDB (macOS/Linux)
sudo systemctl start mongod

# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"

# Connect to database
mongosh "mongodb+srv://cluster.mongodb.net/peditrack_users" --username <user>
```

### Connection String Format

```
mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
```

### Environment Variable

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/peditrack_users?retryWrites=true&w=majority
```
