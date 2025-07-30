import { UserService } from '../users/user.service';
import { InvoiceService } from '../invoices/invoice.service';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import { users, companies, invoices } from '../../../shared/schema';
import bcrypt from 'bcryptjs';

export class AdminService {
  private userService = new UserService();
  private invoiceService = new InvoiceService();

  // Admin user management
  async getAllUsersWithStats() {
    return this.userService.getAllUsersWithStats();
  }

  async updateUserStatus(userId: number, isActive: boolean) {
    return this.userService.updateUserStatus(userId, isActive);
  }

  async resetUserPassword(userId: number, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.userService.resetUserPassword(userId, hashedPassword);
  }

  async deleteUser(userId: number) {
    // In production, you might want to soft delete or archive
    await db.delete(users).where(eq(users.id, userId));
  }

  // System statistics
  async getSystemStats() {
    const [userStats] = await db.select({
      totalUsers: sql<number>`COUNT(*)`,
      activeUsers: sql<number>`COUNT(CASE WHEN is_active = true THEN 1 END)`,
      adminUsers: sql<number>`COUNT(CASE WHEN role = 'admin' THEN 1 END)`,
    }).from(users);

    const [invoiceStats] = await db.select({
      totalInvoices: sql<number>`COUNT(*)`,
      paidInvoices: sql<number>`COUNT(CASE WHEN status = 'paid' THEN 1 END)`,
      totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0)`,
    }).from(invoices);

    const [companyStats] = await db.select({
      totalCompanies: sql<number>`COUNT(*)`,
    }).from(companies);

    return {
      users: {
        total: Number(userStats.totalUsers),
        active: Number(userStats.activeUsers),
        admins: Number(userStats.adminUsers),
      },
      invoices: {
        total: Number(invoiceStats.totalInvoices),
        paid: Number(invoiceStats.paidInvoices),
        revenue: Number(invoiceStats.totalRevenue),
      },
      companies: {
        total: Number(companyStats.totalCompanies),
      }
    };
  }

  // User search and filtering
  async searchUsers(query: string) {
    return await db.select().from(users)
      .where(sql`
        ${users.email} ILIKE ${'%' + query + '%'} OR 
        ${users.firstName} ILIKE ${'%' + query + '%'} OR 
        ${users.lastName} ILIKE ${'%' + query + '%'} OR
        ${users.username} ILIKE ${'%' + query + '%'}
      `);
  }

  async getUsersByRole(role: string) {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async getInactiveUsers(daysSince: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSince);
    
    return await db.select().from(users)
      .where(sql`${users.lastLogin} < ${cutoffDate} OR ${users.lastLogin} IS NULL`);
  }

  // Company management
  async getAllCompanies() {
    return await db.select().from(companies);
  }

  async updateCompanyStatus(companyId: number, isActive: boolean) {
    // This would require adding isActive to companies table
    // For now, we'll update all users in the company
    await db.update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.companyId, companyId));
  }

  // Security and audit
  async getUserLoginHistory(userId: number) {
    // This would require a login history table
    // For now, return basic info
    const user = await this.userService.getUser(userId);
    return {
      userId,
      lastLogin: user?.lastLogin,
      loginCount: 0, // Would track in separate table
      lastLoginIP: null, // Would track in separate table
    };
  }

  async getSuspiciousActivity() {
    // This would implement security monitoring
    // For now, return empty array
    return [];
  }
}