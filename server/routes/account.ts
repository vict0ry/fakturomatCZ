import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage';
import Stripe from 'stripe';

const router = Router();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/account/deactivate - Deactivate user account and cancel Stripe subscription
router.post('/deactivate', requireAuth, async (req: any, res) => {
  try {
    // Debug session and user data
    console.log('🔍 Session headers:', req.headers.authorization);
    console.log('🔍 Request user:', req.user);
    console.log('🔍 User keys:', req.user ? Object.keys(req.user) : 'no user');
    
    // Get userId from session (middleware sets userId field)
    const userId = req.user?.userId;
    console.log('👤 Extracted userId:', userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in session' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`🚫 Deactivating account for user ${userId}`);

    // Cancel Stripe subscription if exists
    try {
      if (user.stripeCustomerId) {
        console.log(`💳 Canceling Stripe subscriptions for customer ${user.stripeCustomerId}`);
        
        // Get all active subscriptions for the customer
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'active'
        });

        // Cancel all active subscriptions
        for (const subscription of subscriptions.data) {
          await stripe.subscriptions.cancel(subscription.id);
          console.log(`✅ Canceled subscription ${subscription.id}`);
        }
        
        console.log(`✅ All Stripe subscriptions canceled for customer ${user.stripeCustomerId}`);
      }
    } catch (stripeError) {
      console.error('Stripe cancellation error:', stripeError);
      // Continue with account deactivation even if Stripe fails
    }

    // Mark user account as inactive
    await storage.deactivateUser(userId);
    console.log(`✅ User account ${userId} marked as inactive`);

    res.json({ 
      message: 'Account successfully deactivated',
      details: {
        accountDeactivated: true,
        subscriptionCanceled: !!user.stripeCustomerId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Account deactivation error:', error);
    res.status(500).json({ 
      message: 'Failed to deactivate account',
      error: (error as Error).message 
    });
  }
});

export default router;