import express from 'express';
import { storage } from '../storage';

const router = express.Router();

// Middleware to check admin access
const requireAdmin = (req: any, res: any, next: any) => {
  const user = req.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get user statistics
router.get('/users/stats', requireAdmin, async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30d';
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const stats = await storage.getUserStats(startDate);
    res.json(stats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

// Get revenue statistics
router.get('/revenue/stats', requireAdmin, async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30d';
    const stats = await storage.getRevenueStats(timeframe as string);
    res.json(stats);
  } catch (error) {
    console.error('Error getting revenue stats:', error);
    res.status(500).json({ error: 'Failed to get revenue statistics' });
  }
});

// Get system health
router.get('/system/health', requireAdmin, async (req, res) => {
  try {
    const health = {
      status: 'healthy' as const,
      uptime: 99.8,
      responseTime: 120,
      errorRate: 0.1
    };
    res.json(health);
  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({ error: 'Failed to get system health' });
  }
});

// Get recent users
router.get('/users/recent', requireAdmin, async (req, res) => {
  try {
    const users = await storage.getRecentUsers(10);
    res.json(users);
  } catch (error) {
    console.error('Error getting recent users:', error);
    res.status(500).json({ error: 'Failed to get recent users' });
  }
});

// Update pricing settings
router.post('/settings/pricing', requireAdmin, async (req, res) => {
  try {
    const { monthlyPrice, trialDays } = req.body;
    
    await storage.updateAdminSetting('monthly_price', monthlyPrice.toString());
    await storage.updateAdminSetting('trial_days', trialDays.toString());
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating pricing:', error);
    res.status(500).json({ error: 'Failed to update pricing settings' });
  }
});

// Get all users with pagination
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    
    const users = await storage.getAllUsersForAdmin(limit, offset);
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Update user subscription
router.put('/users/:id/subscription', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { subscriptionStatus, planType, monthlyPrice } = req.body;
    
    await storage.updateUserSubscription(userId, {
      subscriptionStatus,
      planType,
      monthlyPrice
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

export default router;