import { Router } from 'express';
import { AdminService } from './admin.service';
import { requireAdmin } from '../../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();
const adminService = new AdminService();

// Get all users with stats
router.get('/users', requireAdmin, async (req: any, res) => {
  try {
    const users = await adminService.getAllUsersWithStats();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Update user status (ban/unban)
router.patch('/users/:id/status', requireAdmin, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { isActive } = req.body;
    
    const updatedUser = await adminService.updateUserStatus(userId, isActive);
    res.json({ user: updatedUser, message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Reset user password
router.patch('/users/:id/password', requireAdmin, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const updatedUser = await adminService.resetUserPassword(userId, newPassword);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Delete user
router.delete('/users/:id', requireAdmin, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    await adminService.deleteUser(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get system statistics
router.get('/stats', requireAdmin, async (req: any, res) => {
  try {
    const stats = await adminService.getSystemStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting system stats:', error);
    res.status(500).json({ message: 'Failed to get system stats' });
  }
});

// Search users
router.get('/users/search', requireAdmin, async (req: any, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }
    
    const users = await adminService.searchUsers(q as string);
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
});

export { router as adminRoutes };