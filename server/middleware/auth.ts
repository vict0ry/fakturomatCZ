import { Request, Response, NextFunction } from 'express';

// Simple session middleware (in production, use proper session management)
export const sessions = new Map<string, { userId: number; companyId: number; role?: string }>();

// Development fallback - always reinitialize sessions on server restart
const initializeSessions = () => {
  sessions.clear(); // Clear existing sessions first
  sessions.set('test-session-dev', { userId: 1, companyId: 1, role: 'owner' });  // Company owner može zvát zaměstnance
  sessions.set('f4997d57-a07b-4211-ab8c-4c6c3be71740', { userId: 1, companyId: 1, role: 'admin' });
  sessions.set('DHRypB8x8D1OBnaXeQdkT', { userId: 1, companyId: 1, role: 'owner' }); // Přidám current session
  console.log('🔑 Development sessions initialized with tokens:', Array.from(sessions.keys()));
};

// Initialize sessions on module load
initializeSessions();

// Authentication middleware
export const requireAuth = (req: any, res: Response, next: NextFunction) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionId || req.cookies?.['connect.sid'];
  const session = sessions.get(sessionId || '');
  
  if (!session) {
    const returnTo = encodeURIComponent(req.originalUrl || '/dashboard');
    return res.redirect(`/login?returnTo=${returnTo}`);
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
  
  if (session.role !== 'admin' && session.role !== 'owner') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  req.user = session;
  next();
};