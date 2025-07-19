import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import type { User } from "@shared/schema";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Chybí autentizace' });
    }

    const sessionId = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Chybí session ID' });
    }

    // For development, use a test session
    if (sessionId === 'test-session-dev') {
      // Create or get a development user
      let user = await storage.getUserByUsername('dev-user');
      
      if (!user) {
        // Create development company and user
        const company = await storage.createCompany({
          name: 'Development Company',
          ico: '12345678',
          address: 'Testovací 123',
          city: 'Praha',
          postalCode: '11000',
          country: 'CZ',
          email: 'dev@test.com',
        });

        user = await storage.createUser({
          companyId: company.id,
          username: 'dev-user',
          email: 'dev@test.com',
          password: 'dev-password',
          firstName: 'Development',
          lastName: 'User',
          role: 'admin',
        });
      }

      req.user = user;
      return next();
    }

    // Get session from database
    const session = await storage.getSession(sessionId);
    
    if (!session) {
      return res.status(401).json({ error: 'Neplatná session' });
    }

    // Check if session is expired
    if (session.expiresAt && session.expiresAt < new Date()) {
      await storage.deleteSession(sessionId);
      return res.status(401).json({ error: 'Session vypršela' });
    }

    // Get user
    const user = await storage.getUser(session.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Uživatel nenalezen' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Uživatel je neaktivní' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Chyba při autentizaci' });
  }
}