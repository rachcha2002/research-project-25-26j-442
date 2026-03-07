/**
 * Run this script to fix the stripeCustomerId null issue
 * Execute with: node fix-stripe-index.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixStripeCustomerIdIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Step 1: Remove stripeCustomerId field from all documents where it's null
    const result = await collection.updateMany(
      { stripeCustomerId: null },
      { $unset: { stripeCustomerId: "" } }
    );
    console.log(`Updated ${result.modifiedCount} documents - removed null stripeCustomerId fields`);

    // Step 2: Drop the existing index and let Mongoose recreate it
    try {
      await collection.dropIndex('stripeCustomerId_1');
      console.log('Dropped stripeCustomerId_1 index');
    } catch (err) {
      if (err.code === 27) {
        console.log('Index stripeCustomerId_1 does not exist, skipping drop');
      } else {
        throw err;
      }
    }

    console.log('Fix completed successfully! The sparse index will be recreated on next server start.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixStripeCustomerIdIndex();
