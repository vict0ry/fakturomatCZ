import { Router } from 'express';
import { storage } from '../storage';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require admin authentication
router.use(requireAdmin);

// GET /api/admin/users - Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status } = req.query;
    
    const users = await storage.getAllUsers({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      status: status as string
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/companies - Get all companies (admin only)
router.get('/companies', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    
    const companies = await storage.getAllCompanies({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string
    });
    
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/stats - Get system statistics (admin only)
router.get('/stats', async (req, res) => {
  try {
    const stats = await storage.getSystemStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/admin/users/:id - Update user (admin only)
router.patch('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updateData = req.body;
    
    const updatedUser = await storage.updateUser(userId, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/admin/users/:id/ban - Ban/unban user (admin only)
router.patch('/users/:id/ban', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { banned = true } = req.body;
    
    const updatedUser = await storage.updateUser(userId, { isActive: !banned });
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      message: banned ? 'User banned successfully' : 'User unbanned successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error banning/unbanning user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;