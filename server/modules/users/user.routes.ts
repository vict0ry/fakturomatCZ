import { Router } from 'express';
import { UserService } from './user.service';
import { requireAuth, requireAdmin } from '../../middleware/auth';

const router = Router();
const userService = new UserService();

// Get current user
router.get('/me', requireAuth, async (req: any, res) => {
  try {
    const user = await userService.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't send password
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
});

// Update current user
router.patch('/me', requireAuth, async (req: any, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    
    const updatedUser = await userService.updateUser(req.session.userId, {
      firstName,
      lastName,
      email,
    });
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Get company users (admin only)
router.get('/company', requireAuth, async (req: any, res) => {
  try {
    const currentUser = await userService.getUser(req.session.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const users = await userService.getCompanyUsers(currentUser.companyId || 1);
    
    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Error getting company users:', error);
    res.status(500).json({ message: 'Failed to get company users' });
  }
});

export { router as userRoutes };