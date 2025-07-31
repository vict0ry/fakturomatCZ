import { Router } from 'express';
import Stripe from 'stripe';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const router = Router();

/**
 * Create Stripe checkout session for subscription
 */
router.post('/create-checkout-session', requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user already has active subscription, return error
    if (user.subscriptionStatus === 'active') {
      return res.status(400).json({ message: 'User already has active subscription' });
    }

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        metadata: {
          userId: userId.toString(),
          companyId: user.companyId?.toString() || '',
        },
      });
      
      stripeCustomerId = customer.id;
      await storage.updateUser(userId, { stripeCustomerId });
    }

    // Create checkout session with 7-day trial
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'czk',
            product_data: {
              name: 'Doklad.ai - Měsíční předplatné',
              description: '7 dní zdarma, poté 199 Kč měsíčně',
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: 19900, // 199 CZK in haléře
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          userId: userId.toString(),
          companyId: user.companyId?.toString() || '',
        },
      },
      success_url: `${req.protocol}://${req.get('host')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/pricing`,
      allow_promotion_codes: true,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

/**
 * Get subscription status
 */
router.get('/subscription-status', requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let subscriptionData = {
      status: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
      subscriptionStartedAt: user.subscriptionStartedAt,
      planType: user.planType,
      monthlyPrice: user.monthlyPrice,
    };

    // If user has Stripe subscription, get fresh data
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        subscriptionData = {
          ...subscriptionData,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        };
      } catch (stripeError) {
        console.error('Error fetching Stripe subscription:', stripeError);
      }
    }

    res.json(subscriptionData);
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ message: 'Failed to get subscription status' });
  }
});

/**
 * Cancel subscription
 */
router.post('/cancel-subscription', requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    
    if (!user || !user.stripeSubscriptionId) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    // Cancel at period end (so user keeps access until end of billing period)
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await storage.updateUser(userId, {
      subscriptionStatus: 'canceled',
      subscriptionEndedAt: new Date(subscription.current_period_end * 1000),
    });

    res.json({ message: 'Subscription will be canceled at the end of the current period' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
});

/**
 * Stripe webhook handler
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send('Webhook signature verification failed');
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = parseInt(subscription.metadata.userId);
        
        if (!userId) break;

        const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
        const subscriptionStart = new Date(subscription.start_date * 1000);

        await storage.updateUser(userId, {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          trialEndsAt: trialEnd,
          subscriptionStartedAt: subscriptionStart,
        });

        console.log(`✅ Subscription ${subscription.status} for user ${userId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = parseInt(subscription.metadata.userId);
        
        if (!userId) break;

        await storage.updateUser(userId, {
          subscriptionStatus: 'canceled',
          subscriptionEndedAt: new Date(),
        });

        console.log(`❌ Subscription canceled for user ${userId}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription && typeof invoice.subscription === 'string') {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = parseInt(subscription.metadata.userId);
          
          if (userId) {
            await storage.updateUser(userId, {
              subscriptionStatus: 'active',
            });
            console.log(`💳 Payment succeeded for user ${userId}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription && typeof invoice.subscription === 'string') {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = parseInt(subscription.metadata.userId);
          
          if (userId) {
            await storage.updateUser(userId, {
              subscriptionStatus: 'past_due',
            });
            console.log(`❌ Payment failed for user ${userId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;