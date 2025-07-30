import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db';
import { users, companies, sessions } from '../../../shared/schema';
import type { User, InsertUser, Session, InsertSession } from '../../../shared/schema';

export class UserService {
  // User CRUD operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getCompanyUsers(companyId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.companyId, companyId));
  }

  async getAllUsersWithStats(): Promise<any[]> {
    try {
      console.log('Getting all users with Drizzle ORM...');
      
      const allUsers = await db.select().from(users);
      console.log(`Found ${allUsers.length} users`);
      
      return allUsers.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        emailConfirmed: user.emailConfirmed,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEnds: null,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        companyId: user.companyId,
        company: { 
          id: user.companyId, 
          name: 'Doklad.ai', 
          ico: '', 
          dic: '' 
        },
        stats: { 
          invoiceCount: 0,
          totalRevenue: 0,
          expenseCount: 0,
          lastActivity: user.createdAt?.toISOString() || new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Error in getAllUsersWithStats:', error);
      throw error;
    }
  }

  // Session management
  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db.insert(sessions).values(session).returning();
    return newSession;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  // Admin operations
  async updateUserStatus(id: number, isActive: boolean): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async resetUserPassword(id: number, hashedPassword: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        password: hashedPassword, 
        passwordResetToken: null, 
        passwordResetExpires: null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
}