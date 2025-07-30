import { UserService } from '../modules/users/user.service';

const userService = new UserService();

// Require authentication
export const requireAuth = async (req: any, res: any, next: any) => {
  try {
    // Check for Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = await userService.getSession(token);
      
      if (session && session.userId) {
        req.session = { userId: session.userId };
        return next();
      }
    }
    
    // Check session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Require admin role
export const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    // First check auth
    await new Promise((resolve, reject) => {
      requireAuth(req, res, (err: any) => {
        if (err) reject(err);
        else resolve(null);
      });
    });
    
    // Check if user is admin
    const user = await userService.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Authorization error' });
  }
};