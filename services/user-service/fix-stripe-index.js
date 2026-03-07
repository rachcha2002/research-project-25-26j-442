require('dotenv').config();
const mongoose = require('mongoose');

async function fixStripeCustomerId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Remove stripeCustomerId field from all documents where it's null
    const result = await collection.updateMany(
      { stripeCustomerId: null },
      { $unset: { stripeCustomerId: "" } }
    );
    console.log(`Fixed ${result.modifiedCount} users with null stripeCustomerId`);

    // Drop the existing index so it can be recreated properly
    try {
      await collection.dropIndex('stripeCustomerId_1');
      console.log('Dropped old stripeCustomerId_1 index');
    } catch (err) {
      if (err.code === 27) {
        console.log('Index stripeCustomerId_1 does not exist, skipping');
      } else {
        console.log('Index drop skipped:', err.codeName || err.message);
      }
    }

    console.log('Fix completed! Restart user-service to apply changes.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixStripeCustomerId();
