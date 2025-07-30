import { sessions } from './middleware/auth';

export const sessionStorage = {
  createSession: (userId: number): string => {
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessions.set(sessionId, { userId, companyId: 1 }); // Default company for simplicity
    return sessionId;
  },
  
  getSession: (sessionId: string) => {
    return sessions.get(sessionId);
  },
  
  deleteSession: (sessionId: string) => {
    sessions.delete(sessionId);
  }
};