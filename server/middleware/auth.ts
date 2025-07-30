import { Request, Response, NextFunction } from 'express';

// Simple session middleware (in production, use proper session management)
export const sessions = new Map<string, { userId: number; companyId: number; role?: string }>();

// Development fallback - always reinitialize sessions on server restart
const initializeSessions = () => {
  sessions.clear(); // Clear existing sessions first
  sessions.set('test-session-dev', { userId: 1, companyId: 1 });
  sessions.set('f4997d57-a07b-4211-ab8c-4c6c3be71740', { userId: 1, companyId: 1, role: 'admin' });
  console.log('🔑 Development sessions initialized');
};

// Initialize sessions on module load
initializeSessions();

// Authentication middleware
export const requireAuth = (req: any, res: Response, next: NextFunction) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const session = sessions.get(sessionId || '');
  
  if (!session) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  req.user = session;
  next();
};

// Admin authorization middleware
export const requireAdmin = (req: any, res: Response, next: NextFunction) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const session = sessions.get(sessionId || '');
  
  if (!session) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (session.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  req.user = session;
  next();
};