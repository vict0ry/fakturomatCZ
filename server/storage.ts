import { 
  companies, users, customers, invoices, invoiceItems, chatMessages, reminders, sessions, invoiceHistory,
  type Company, type User, type Customer, type Invoice, type InvoiceItem, 
  type ChatMessage, type Reminder, type Session, type InvoiceHistory,
  type InsertCompany, type InsertUser, type InsertCustomer, type InsertInvoice, 
  type InsertInvoiceItem, type InsertChatMessage, type InsertReminder, type InsertSession, type InsertInvoiceHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // Companies
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getCompanyUsers(companyId: number): Promise<User[]>;
  
  // Sessions
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  deleteSession(id: string): Promise<void>;
  
  // Customers
  getCustomer(id: number, companyId: number): Promise<Customer | undefined>;
  getCustomerByIco(ico: string, companyId: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>, companyId: number): Promise<Customer>;
  getCompanyCustomers(companyId: number): Promise<Customer[]>;
  searchCustomers(query: string, companyId: number): Promise<Customer[]>;
  getInactiveCustomers(companyId: number, daysSince: number): Promise<Customer[]>;
  
  // Invoices
  getInvoice(id: number, companyId: number): Promise<Invoice | undefined>;
  getInvoiceWithDetails(id: number, companyId: number): Promise<(Invoice & { items: InvoiceItem[], customer: Customer }) | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>, companyId: number): Promise<Invoice>;
  updateInvoiceStatus(id: number, status: string): Promise<Invoice>;
  getCompanyInvoices(companyId: number, filters?: {
    status?: string;
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
    customerId?: number;
  }): Promise<(Invoice & { customer: Customer })[]>;
  getOverdueInvoices(companyId: number): Promise<(Invoice & { customer: Customer })[]>;
  getRecentInvoices(companyId: number, limit: number): Promise<(Invoice & { customer: Customer })[]>;
  
  // Invoice Items
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem>;
  deleteInvoiceItem(id: number): Promise<void>;
  
  // Chat Messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(companyId: number, userId: number, limit: number): Promise<ChatMessage[]>;

  // Invoice History
  createInvoiceHistory(history: InsertInvoiceHistory): Promise<InvoiceHistory>;
  getInvoiceHistory(invoiceId: number): Promise<InvoiceHistory[]>;
  
  // Invoice counting
  getInvoiceCount(companyId: number, year: number): Promise<number>;
  
  // Reminders
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  getInvoiceReminders(invoiceId: number): Promise<Reminder[]>;
  getCompanyReminders(companyId: number): Promise<Reminder[]>;
  
  // Public invoice sharing
  generateInvoiceShareToken(invoiceId: number, companyId: number, expiresInDays?: number): Promise<string>;
  getInvoiceByShareToken(token: string): Promise<Invoice | undefined>;
  incrementInvoiceShareViewCount(token: string): Promise<void>;
  disableInvoiceSharing(invoiceId: number, companyId: number): Promise<void>;
  
  // Company users
  getCompanyUsers(companyId: number): Promise<User[]>;

  // Statistics
  getCompanyStats(companyId: number, dateFrom?: Date, dateTo?: Date): Promise<{
    revenue: number;
    invoiceCount: number;
    paidInvoices: number;
    unpaidAmount: number;
    overdueCount: number;
    activeCustomers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Companies
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db
      .insert(companies)
      .values(company)
      .returning();
    return newCompany;
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
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

  // Sessions
  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db
      .insert(sessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session || undefined;
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  // Customers
  async getCustomer(id: number, companyId: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.id, id), eq(customers.companyId, companyId)));
    return customer || undefined;
  }

  async getCustomerByIco(ico: string, companyId: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.ico, ico), eq(customers.companyId, companyId)));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>, companyId: number): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(and(eq(customers.id, id), eq(customers.companyId, companyId)))
      .returning();
    return updatedCustomer;
  }

  async getCompanyCustomers(companyId: number): Promise<Customer[]> {
    return await db.select().from(customers)
      .where(and(eq(customers.companyId, companyId), eq(customers.isActive, true)))
      .orderBy(desc(customers.createdAt));
  }

  async searchCustomers(query: string, companyId: number): Promise<Customer[]> {
    return await db.select().from(customers)
      .where(and(
        eq(customers.companyId, companyId),
        eq(customers.isActive, true),
        ilike(customers.name, `%${query}%`)
      ))
      .orderBy(desc(customers.createdAt));
  }

  async getInactiveCustomers(companyId: number, daysSince: number): Promise<Customer[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSince);
    
    const results = await db.select({ customer: customers })
      .from(customers)
      .leftJoin(invoices, eq(customers.id, invoices.customerId))
      .where(and(
        eq(customers.companyId, companyId),
        eq(customers.isActive, true)
      ))
      .groupBy(customers.id)
      .having(sql`MAX(${invoices.createdAt}) < ${cutoffDate} OR MAX(${invoices.createdAt}) IS NULL`);
    
    return results.map(r => r.customer);
  }

  // Invoices
  async getInvoice(id: number, companyId: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)));
    return invoice || undefined;
  }

  async getInvoiceWithDetails(id: number, companyId: number): Promise<(Invoice & { items: InvoiceItem[], customer: Customer }) | undefined> {
    const [invoice] = await db.select().from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)));
    
    if (!invoice) return undefined;
    
    const items = await db.select().from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));
    
    return {
      ...invoice.invoices,
      items,
      customer: invoice.customers!
    };
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>, companyId: number): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)))
      .returning();
    return updatedInvoice;
  }

  async updateInvoiceStatus(id: number, status: string): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ status, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async getCompanyInvoices(companyId: number, filters?: {
    status?: string;
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
    customerId?: number;
  }): Promise<(Invoice & { customer: Customer })[]> {
    const conditions = [eq(invoices.companyId, companyId)];
    
    if (filters) {
      if (filters.status) {
        conditions.push(eq(invoices.status, filters.status));
      }
      if (filters.type) {
        conditions.push(eq(invoices.type, filters.type));
      }
      if (filters.customerId) {
        conditions.push(eq(invoices.customerId, filters.customerId));
      }
      if (filters.dateFrom) {
        conditions.push(gte(invoices.issueDate, filters.dateFrom));
      }
      if (filters.dateTo) {
        conditions.push(lte(invoices.issueDate, filters.dateTo));
      }
    }
    
    const results = await db.select().from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(desc(invoices.createdAt));
    
    return results.map(r => ({
      ...r.invoices,
      customer: r.customers!
    }));
  }

  async getOverdueInvoices(companyId: number): Promise<(Invoice & { customer: Customer })[]> {
    const today = new Date();
    const results = await db.select().from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(
        eq(invoices.companyId, companyId),
        eq(invoices.status, 'sent'),
        sql`${invoices.dueDate} < ${today}`
      ))
      .orderBy(invoices.dueDate);
    
    return results.map(r => ({
      ...r.invoices,
      customer: r.customers!
    }));
  }

  async getRecentInvoices(companyId: number, limit: number): Promise<(Invoice & { customer: Customer })[]> {
    const results = await db.select().from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.companyId, companyId))
      .orderBy(desc(invoices.createdAt))
      .limit(limit);
    
    return results.map(r => ({
      ...r.invoices,
      customer: r.customers!
    }));
  }

  // Invoice Items
  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [newItem] = await db
      .insert(invoiceItems)
      .values(item)
      .returning();
    return newItem;
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem> {
    const [updatedItem] = await db
      .update(invoiceItems)
      .set(item)
      .where(eq(invoiceItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteInvoiceItem(id: number): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.id, id));
  }

  // Chat Messages
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getChatMessages(companyId: number, userId: number, limit: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(and(eq(chatMessages.companyId, companyId), eq(chatMessages.userId, userId)))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  // Reminders
  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const [newReminder] = await db
      .insert(reminders)
      .values(reminder)
      .returning();
    return newReminder;
  }

  async getInvoiceReminders(invoiceId: number): Promise<Reminder[]> {
    return await db.select().from(reminders)
      .where(eq(reminders.invoiceId, invoiceId))
      .orderBy(desc(reminders.createdAt));
  }

  async getCompanyReminders(companyId: number): Promise<Reminder[]> {
    return await db.select().from(reminders)
      .where(eq(reminders.companyId, companyId))
      .orderBy(desc(reminders.createdAt));
  }
  
  // Public invoice sharing implementation
  async generateInvoiceShareToken(invoiceId: number, companyId: number, expiresInDays: number = 30): Promise<string> {
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    await db.update(invoices)
      .set({
        shareToken: token,
        shareTokenExpiresAt: expiresAt,
        shareTokenCreatedAt: new Date(),
        isPublicSharingEnabled: true,
        shareViewCount: 0
      })
      .where(and(eq(invoices.id, invoiceId), eq(invoices.companyId, companyId)));
    
    return token;
  }

  async getInvoiceByShareToken(token: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select()
      .from(invoices)
      .where(and(
        eq(invoices.shareToken, token),
        eq(invoices.isPublicSharingEnabled, true),
        gte(invoices.shareTokenExpiresAt, new Date())
      ));
    
    return invoice || undefined;
  }

  async incrementInvoiceShareViewCount(token: string): Promise<void> {
    await db.update(invoices)
      .set({ shareViewCount: sql`${invoices.shareViewCount} + 1` })
      .where(eq(invoices.shareToken, token));
  }

  async disableInvoiceSharing(invoiceId: number, companyId: number): Promise<void> {
    await db.update(invoices)
      .set({
        isPublicSharingEnabled: false,
        shareToken: null,
        shareTokenExpiresAt: null
      })
      .where(and(eq(invoices.id, invoiceId), eq(invoices.companyId, companyId)));
  }

  // Invoice History
  async createInvoiceHistory(history: InsertInvoiceHistory): Promise<InvoiceHistory> {
    const [newHistory] = await db
      .insert(invoiceHistory)
      .values(history)
      .returning();
    return newHistory;
  }

  async getInvoiceHistory(invoiceId: number): Promise<InvoiceHistory[]> {
    return await db.select({
      id: invoiceHistory.id,
      invoiceId: invoiceHistory.invoiceId,
      companyId: invoiceHistory.companyId,
      userId: invoiceHistory.userId,
      action: invoiceHistory.action,
      oldValue: invoiceHistory.oldValue,
      newValue: invoiceHistory.newValue,
      description: invoiceHistory.description,
      recipientEmail: invoiceHistory.recipientEmail,
      metadata: invoiceHistory.metadata,
      createdAt: invoiceHistory.createdAt,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      }
    })
    .from(invoiceHistory)
    .leftJoin(users, eq(invoiceHistory.userId, users.id))
    .where(eq(invoiceHistory.invoiceId, invoiceId))
    .orderBy(desc(invoiceHistory.createdAt));
  }

  async getInvoiceCount(companyId: number, year: number): Promise<number> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    
    const [result] = await db.select({ count: count() })
      .from(invoices)
      .where(and(
        eq(invoices.companyId, companyId),
        gte(invoices.createdAt, startOfYear),
        lte(invoices.createdAt, endOfYear)
      ));
    
    return Number(result.count) || 0;
  }

  // Statistics
  async getCompanyStats(companyId: number, dateFrom?: Date, dateTo?: Date): Promise<{
    revenue: number;
    invoiceCount: number;
    paidInvoices: number;
    unpaidAmount: number;
    overdueCount: number;
    activeCustomers: number;
  }> {
    const conditions = [eq(invoices.companyId, companyId)];
    
    if (dateFrom && dateTo) {
      conditions.push(gte(invoices.issueDate, dateFrom));
      conditions.push(lte(invoices.issueDate, dateTo));
    }

    const [stats] = await db.select({
      revenue: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.total} ELSE 0 END), 0)`,
      invoiceCount: count(),
      paidInvoices: sql<number>`COUNT(CASE WHEN ${invoices.status} = 'paid' THEN 1 END)`,
      unpaidAmount: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} != 'paid' THEN ${invoices.total} ELSE 0 END), 0)`,
      overdueCount: sql<number>`COUNT(CASE WHEN ${invoices.status} = 'sent' AND ${invoices.dueDate} < NOW() THEN 1 END)`,
    }).from(invoices).where(and(...conditions));

    const customerStats = await db.select({
      activeCustomers: sql<number>`COUNT(DISTINCT ${customers.id})`,
    }).from(customers)
      .leftJoin(invoices, eq(customers.id, invoices.customerId))
      .where(and(
        eq(customers.companyId, companyId),
        eq(customers.isActive, true)
      ));

    const customerCount = customerStats[0] || { activeCustomers: 0 };

    return {
      revenue: Number(stats.revenue) || 0,
      invoiceCount: Number(stats.invoiceCount) || 0,
      paidInvoices: Number(stats.paidInvoices) || 0,
      unpaidAmount: Number(stats.unpaidAmount) || 0,
      overdueCount: Number(stats.overdueCount) || 0,
      activeCustomers: Number(customerCount.activeCustomers) || 0,
    };
  }
}

export const storage = new DatabaseStorage();