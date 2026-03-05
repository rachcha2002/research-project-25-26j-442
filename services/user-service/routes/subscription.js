const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { auth } = require('../middleware/auth');

// Monthly price in LKR smallest unit (2000 LKR = 200000)
const MONTHLY_PRICE_AMOUNT = 200000;
const MONTHLY_PRICE_CURRENCY = 'lkr';

/**
 * Helper: Get or create a Stripe customer for a user
 */
async function getOrCreateStripeCustomer(user) {
  // Check if user already has a Stripe customer ID
  if (user.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!customer.deleted) {
        return customer;
      }
    } catch (err) {
      console.log('Stripe customer not found, creating new one');
    }
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: user._id.toString()
    }
  });

  // Save customer ID to user
  user.stripeCustomerId = customer.id;
  user.$skipPasswordHash = true;
  await user.save();

  return customer;
}

/**
 * Helper: Get or create Stripe Price for monthly subscription
 */
async function getOrCreatePrice() {
  // Use env-configured price ID if available
  if (process.env.STRIPE_PRICE_ID) {
    try {
      const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);
      return price;
    } catch (err) {
      console.log('Configured STRIPE_PRICE_ID not found, creating new price');
    }
  }

  // Use list() instead of search() — search() is not available in all regions
  const products = await stripe.products.list({ limit: 100, active: true });
  let product = products.data.find(p => p.name === 'PediTrack PRO Monthly');

  if (!product) {
    // Create new product
    product = await stripe.products.create({
      name: 'PediTrack PRO Monthly',
      description: 'PediTrack PRO subscription - AI-powered baby health insights, growth predictions, and risk assessments.',
    });
  }

  // Find an existing active recurring price on this product
  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  const existingPrice = prices.data.find(p => p.recurring?.interval === 'month');

  if (existingPrice) {
    return existingPrice;
  }

  // Create new monthly price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: MONTHLY_PRICE_AMOUNT,
    currency: MONTHLY_PRICE_CURRENCY,
    recurring: {
      interval: 'month',
    },
  });

  return price;
}

/**
 * Helper: Sync subscription data from Stripe to our database
 */
async function syncSubscriptionFromStripe(stripeSubscription, userId) {
  const user = await User.findById(userId);
  if (!user) return;

  // Get payment method details
  let paymentMethodLast4 = null;
  let paymentMethodBrand = null;
  let stripePaymentMethodId = null;

  if (stripeSubscription.default_payment_method) {
    try {
      const pm = typeof stripeSubscription.default_payment_method === 'string'
        ? await stripe.paymentMethods.retrieve(stripeSubscription.default_payment_method)
        : stripeSubscription.default_payment_method;
      paymentMethodLast4 = pm.card?.last4 || null;
      paymentMethodBrand = pm.card?.brand || null;
      stripePaymentMethodId = pm.id;
    } catch (err) {
      console.log('Could not retrieve payment method:', err.message);
    }
  }

  const isActive = ['active', 'trialing'].includes(stripeSubscription.status);

  // Update subscription record
  const subscriptionData = {
    userId: userId,
    stripeCustomerId: stripeSubscription.customer,
    stripeSubscriptionId: stripeSubscription.id,
    stripePriceId: stripeSubscription.items?.data[0]?.price?.id || null,
    status: stripeSubscription.status,
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    autoRenew: !stripeSubscription.cancel_at_period_end,
    paymentMethodLast4,
    paymentMethodBrand,
    stripePaymentMethodId,
  };

  await Subscription.findOneAndUpdate(
    { userId: userId },
    subscriptionData,
    { upsert: true, new: true }
  );

  // Update user record
  user.isPro = isActive;
  user.subscriptionPlan = isActive ? 'pro_monthly' : 'basic';
  user.subscriptionExpiry = new Date(stripeSubscription.current_period_end * 1000);
  user.$skipPasswordHash = true;
  await user.save();

  return subscriptionData;
}

// ==================== Routes ====================

/**
 * @route   GET /api/subscription/redirect/success
 * @desc    Redirect from Stripe checkout to mobile app deep link (success)
 * @access  Public
 */
router.get('/redirect/success', (req, res) => {
  const { session_id } = req.query;
  const appScheme = process.env.APP_SCHEME || 'peditrack';
  
  // Redirect to app's deep link with session ID
  const deepLink = `${appScheme}://subscription-success${session_id ? `?session_id=${session_id}` : ''}`;
  
  // Send HTML that redirects to the deep link
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Redirecting...</title>
        <meta http-equiv="refresh" content="0;url=${deepLink}">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #7C3AED 0%, #6366F1 100%); color: white; text-align: center; }
          .container { padding: 20px; }
          h1 { font-size: 24px; margin-bottom: 10px; }
          p { font-size: 16px; opacity: 0.9; }
          a { color: white; text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎉 Payment Successful!</h1>
          <p>Redirecting you back to PediTrack...</p>
          <p><a href="${deepLink}">Click here if not redirected automatically</a></p>
        </div>
        <script>window.location.href = "${deepLink}";</script>
      </body>
    </html>
  `);
});

/**
 * @route   GET /api/subscription/redirect/cancel
 * @desc    Redirect from Stripe checkout to mobile app deep link (cancel)
 * @access  Public
 */
router.get('/redirect/cancel', (req, res) => {
  const appScheme = process.env.APP_SCHEME || 'peditrack';
  const deepLink = `${appScheme}://subscription-cancel`;
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Redirecting...</title>
        <meta http-equiv="refresh" content="0;url=${deepLink}">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #F3F4F6; color: #374151; text-align: center; }
          .container { padding: 20px; }
          h1 { font-size: 24px; margin-bottom: 10px; }
          p { font-size: 16px; opacity: 0.8; }
          a { color: #7C3AED; text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Checkout Cancelled</h1>
          <p>Redirecting you back to PediTrack...</p>
          <p><a href="${deepLink}">Click here if not redirected automatically</a></p>
        </div>
        <script>window.location.href = "${deepLink}";</script>
      </body>
    </html>
  `);
});

/**
 * @route   POST /api/subscription/create-checkout
 * @desc    Create a Stripe Checkout session for monthly PRO subscription
 * @access  Private
 */
router.post('/create-checkout', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already subscribed
    if (user.isPro) {
      return res.status(400).json({ error: 'You already have an active PRO subscription' });
    }

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(user);

    // Get or create the price
    const price = await getOrCreatePrice();

    // Build redirect URLs that point to our server endpoints (Stripe requires HTTPS)
    // These endpoints will then redirect to the mobile app's deep links
    // NOTE: For development, use ngrok to expose this server and set SERVER_URL env var
    // Example: ngrok http 5002 -> set SERVER_URL=https://abc123.ngrok.io
    const serverBaseUrl = process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;
    
    // Validate that we have an HTTPS URL for Stripe (except localhost for test mode)
    const isLocalhost = serverBaseUrl.includes('localhost') || serverBaseUrl.includes('127.0.0.1');
    const isHttps = serverBaseUrl.startsWith('https://');
    
    if (!isHttps && !isLocalhost) {
      console.warn('⚠️  Stripe requires HTTPS URLs for redirects.');
      console.warn('   For development, run: ngrok http 5002');
      console.warn('   Then set SERVER_URL environment variable to the ngrok URL');
      console.warn(`   Current SERVER_URL: ${serverBaseUrl}`);
    }
    
    const successUrl = `${serverBaseUrl}/api/subscription/redirect/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${serverBaseUrl}/api/subscription/redirect/cancel`;
    
    console.log('Stripe redirect URLs:', { successUrl, cancelUrl });

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price: price.id,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          userId: user._id.toString(),
        },
      },
      metadata: {
        userId: user._id.toString(),
      },
      // Save the payment method for future use
      payment_method_collection: 'always',
    });

    res.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * @route   GET /api/subscription/status
 * @desc    Get current subscription status
 * @access  Private
 */
router.get('/status', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.userId });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.json({
        success: true,
        subscription: {
          status: 'none',
          isPro: false,
          autoRenew: false,
          paymentMethodLast4: null,
          paymentMethodBrand: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        }
      });
    }

    // Fetch fresh data from Stripe
    try {
      const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      await syncSubscriptionFromStripe(stripeSub, req.userId);
      // Re-fetch after sync
      const updatedSub = await Subscription.findOne({ userId: req.userId });

      return res.json({
        success: true,
        subscription: {
          status: updatedSub.status,
          isPro: ['active', 'trialing'].includes(updatedSub.status),
          autoRenew: updatedSub.autoRenew,
          paymentMethodLast4: updatedSub.paymentMethodLast4,
          paymentMethodBrand: updatedSub.paymentMethodBrand,
          currentPeriodStart: updatedSub.currentPeriodStart,
          currentPeriodEnd: updatedSub.currentPeriodEnd,
          cancelAtPeriodEnd: updatedSub.cancelAtPeriodEnd,
          lastPaymentDate: updatedSub.lastPaymentDate,
          lastPaymentAmount: updatedSub.lastPaymentAmount,
        }
      });
    } catch (stripeErr) {
      // If Stripe fetch fails, return cached data
      return res.json({
        success: true,
        subscription: {
          status: subscription.status,
          isPro: ['active', 'trialing'].includes(subscription.status),
          autoRenew: subscription.autoRenew,
          paymentMethodLast4: subscription.paymentMethodLast4,
          paymentMethodBrand: subscription.paymentMethodBrand,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          lastPaymentDate: subscription.lastPaymentDate,
          lastPaymentAmount: subscription.lastPaymentAmount,
        }
      });
    }
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

/**
 * @route   PUT /api/subscription/auto-renew
 * @desc    Toggle auto-renewal on/off
 * @access  Private
 */
router.put('/auto-renew', auth, async (req, res) => {
  try {
    const { autoRenew } = req.body;
    if (typeof autoRenew !== 'boolean') {
      return res.status(400).json({ error: 'autoRenew must be a boolean value' });
    }

    const subscription = await Subscription.findOne({ userId: req.userId });
    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Update on Stripe: cancel_at_period_end = !autoRenew
    const stripeSub = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: !autoRenew,
    });

    // Sync back
    await syncSubscriptionFromStripe(stripeSub, req.userId);

    const updatedSub = await Subscription.findOne({ userId: req.userId });

    res.json({
      success: true,
      message: autoRenew
        ? 'Auto-renewal enabled. Your subscription will renew automatically.'
        : 'Auto-renewal disabled. Your subscription will expire at the end of the billing period.',
      subscription: {
        autoRenew: updatedSub.autoRenew,
        cancelAtPeriodEnd: updatedSub.cancelAtPeriodEnd,
        currentPeriodEnd: updatedSub.currentPeriodEnd,
      }
    });
  } catch (error) {
    console.error('Toggle auto-renew error:', error);
    res.status(500).json({ error: 'Failed to update auto-renewal setting' });
  }
});

/**
 * @route   POST /api/subscription/pay-now
 * @desc    Re-subscribe using saved payment method (manual pay)
 * @access  Private
 */
router.post('/pay-now', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscription = await Subscription.findOne({ userId: req.userId });
    if (!subscription || !subscription.stripePaymentMethodId) {
      return res.status(400).json({
        error: 'No saved payment method found. Please use checkout to subscribe.',
        needsCheckout: true,
      });
    }

    // Check if user already has an active subscription
    if (subscription.stripeSubscriptionId) {
      try {
        const existingSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
        if (['active', 'trialing'].includes(existingSub.status)) {
          // Re-enable auto-renew if it was canceled at period end
          if (existingSub.cancel_at_period_end) {
            const reactivated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
              cancel_at_period_end: false,
            });
            await syncSubscriptionFromStripe(reactivated, req.userId);
            return res.json({
              success: true,
              message: 'Subscription reactivated successfully!',
            });
          }
          return res.status(400).json({ error: 'You already have an active subscription' });
        }
      } catch (err) {
        // Subscription doesn't exist on Stripe anymore, create new one
      }
    }

    // Get the price
    const price = await getOrCreatePrice();

    // Create new subscription with saved payment method
    const customer = await getOrCreateStripeCustomer(user);

    // Attach payment method to customer if not already
    try {
      await stripe.paymentMethods.attach(subscription.stripePaymentMethodId, {
        customer: customer.id,
      });
    } catch (err) {
      // Payment method might already be attached
      if (err.code !== 'resource_already_exists') {
        console.log('Payment method attach note:', err.message);
      }
    }

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: subscription.stripePaymentMethodId,
      },
    });

    // Create subscription
    const newSub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      default_payment_method: subscription.stripePaymentMethodId,
      metadata: {
        userId: user._id.toString(),
      },
    });

    await syncSubscriptionFromStripe(newSub, req.userId);

    res.json({
      success: true,
      message: 'Subscription created successfully with your saved card!',
    });
  } catch (error) {
    console.error('Pay now error:', error);

    // If payment method is invalid/expired
    if (error.code === 'card_declined' || error.code === 'expired_card') {
      return res.status(400).json({
        error: 'Your saved card was declined. Please use checkout to add a new payment method.',
        needsCheckout: true,
      });
    }

    res.status(500).json({ error: 'Failed to process payment' });
  }
});

/**
 * @route   POST /api/subscription/cancel
 * @desc    Cancel subscription (at period end)
 * @access  Private
 */
router.post('/cancel', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.userId });
    if (!subscription || !subscription.stripeSubscriptionId) {
      // If the user manually got marked as Pro in DB, auto-heal their account status back to Free
      const user = await User.findById(req.userId);
      if (user && user.isPro) {
        user.isPro = false;
        user.subscriptionPlan = 'basic';
        user.$skipPasswordHash = true;
        await user.save();
        
        if (subscription) {
          subscription.status = 'none';
          subscription.cancelAtPeriodEnd = false;
          subscription.autoRenew = false;
          await subscription.save();
        }

        return res.json({
          success: true,
          message: 'Subscription successfully removed (downgraded to Free).',
          subscription: {
            status: 'none',
            cancelAtPeriodEnd: false,
            currentPeriodEnd: null,
          }
        });
      }

      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel at period end (user keeps access until period ends)
    const stripeSub = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await syncSubscriptionFromStripe(stripeSub, req.userId);

    const updatedSub = await Subscription.findOne({ userId: req.userId });

    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current billing period.',
      subscription: {
        status: updatedSub.status,
        cancelAtPeriodEnd: updatedSub.cancelAtPeriodEnd,
        currentPeriodEnd: updatedSub.currentPeriodEnd,
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * @route   POST /api/subscription/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (verified by Stripe signature)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      // In development without webhook secret, parse body directly
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      console.warn('⚠️  Webhook signature verification skipped (no STRIPE_WEBHOOK_SECRET set)');
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`📩 Stripe webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;

        if (userId && session.subscription) {
          const stripeSub = await stripe.subscriptions.retrieve(session.subscription);
          await syncSubscriptionFromStripe(stripeSub, userId);
          console.log(`✅ Checkout completed for user ${userId}`);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = stripeSub.metadata?.userId;

          if (userId) {
            await syncSubscriptionFromStripe(stripeSub, userId);

            // Update last payment info
            await Subscription.findOneAndUpdate(
              { userId },
              {
                lastPaymentDate: new Date(invoice.status_transitions?.paid_at * 1000 || Date.now()),
                lastPaymentAmount: invoice.amount_paid / 100,
              }
            );
            console.log(`💰 Invoice paid for user ${userId}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = stripeSub.metadata?.userId;

          if (userId) {
            await syncSubscriptionFromStripe(stripeSub, userId);
            console.log(`❌ Payment failed for user ${userId}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object;
        const userId = stripeSub.metadata?.userId;

        if (userId) {
          // Mark subscription as expired
          await Subscription.findOneAndUpdate(
            { userId },
            { status: 'expired', autoRenew: false, cancelAtPeriodEnd: false }
          );

          // Update user
          const user = await User.findById(userId);
          if (user) {
            user.isPro = false;
            user.subscriptionPlan = 'basic';
            user.$skipPasswordHash = true;
            await user.save();
          }
          console.log(`🗑️ Subscription deleted for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const stripeSub = event.data.object;
        const userId = stripeSub.metadata?.userId;
        if (userId) {
          await syncSubscriptionFromStripe(stripeSub, userId);
          console.log(`🔄 Subscription updated for user ${userId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
  }

  // Always return 200 to acknowledge receipt
  res.json({ received: true });
});

/**
 * @route   POST /api/subscription/verify-session
 * @desc    Verify a completed checkout session and sync subscription
 * @access  Private
 */
router.post('/verify-session', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Verify the session belongs to this user
    if (session.metadata?.userId !== req.userId.toString()) {
      return res.status(403).json({ error: 'Session does not belong to this user' });
    }

    if (session.subscription) {
      const stripeSub = await stripe.subscriptions.retrieve(session.subscription);
      await syncSubscriptionFromStripe(stripeSub, req.userId);
    }

    // Get updated user
    const user = await User.findById(req.userId).select('-password -refreshTokens');

    res.json({
      success: true,
      message: 'Subscription verified successfully!',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({ error: 'Failed to verify checkout session' });
  }
});

/**
 * @route   POST /api/subscription/apply-demo-coupon
 * @desc    Upgrades user to PRO for free using a demo coupon code
 * @access  Private
 */
router.post('/apply-demo-coupon', auth, async (req, res) => {
  try {
    const { code } = req.body;
    if (code !== '18473') {
      return res.status(400).json({ error: 'Invalid coupon code' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isPro = true;
    user.subscriptionPlan = 'pro_monthly';
    user.$skipPasswordHash = true;
    await user.save();

    // Create a mock subscription record
    const subscriptionData = {
      userId: req.userId,
      stripeCustomerId: 'demo_cust_' + Math.random().toString(36).substring(7),
      stripeSubscriptionId: null, // intentionally null so cancel auto-heal handles it
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      autoRenew: false,
      cancelAtPeriodEnd: true, // Will automatically expire
      paymentMethodBrand: 'Demo',
      paymentMethodLast4: '0000',
    };

    await Subscription.findOneAndUpdate(
      { userId: req.userId },
      subscriptionData,
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Demo PRO activated successfully!',
    });
  } catch (error) {
    console.error('Demo coupon error:', error);
    res.status(500).json({ error: 'Failed to apply demo coupon' });
  }
});

module.exports = router;
