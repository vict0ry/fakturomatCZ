import { 
  companies, users, customers, invoices, invoiceItems, chatMessages, reminders, sessions, invoiceHistory,
  expenses, expenseItems, bankAccounts, userInvitations,
  type Company, type User, type Customer, type Invoice, type InvoiceItem, 
  type ChatMessage, type Reminder, type Session, type InvoiceHistory,
  type Expense, type ExpenseItem, type BankAccount, type UserInvitation,
  type InsertCompany, type InsertUser, type InsertCustomer, type InsertInvoice, 
  type InsertInvoiceItem, type InsertChatMessage, type InsertReminder, type InsertSession, 
  type InsertInvoiceHistory, type InsertExpense, type InsertExpenseItem, type InsertBankAccount,
  type InsertUserInvitation
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike, gte, lte, count, or, isNull, not } from "drizzle-orm";

export interface IStorage {
  // Companies
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getCompanyUsers(companyId: number): Promise<User[]>;
  getAllUsersWithStats(): Promise<any[]>;
  getAllUsers(filters?: { page?: number; limit?: number; search?: string; status?: string }): Promise<User[]>;
  getAllCompanies(filters?: { page?: number; limit?: number; search?: string }): Promise<Company[]>;
  getSystemStats(): Promise<any>;
  
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
  getCustomers(companyId: number, filters?: { page?: number; limit?: number; search?: string }): Promise<Customer[]>;
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
  
  // Bank Accounts
  getBankAccount(id: number): Promise<BankAccount | undefined>;
  getBankAccountsByCompany(companyId: number): Promise<BankAccount[]>;
  createBankAccount(bankAccount: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: number, bankAccount: Partial<InsertBankAccount>): Promise<BankAccount>;
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

  // Expenses
  getExpense(id: number, companyId: number): Promise<Expense | undefined>;
  getExpenseWithDetails(id: number, companyId: number): Promise<(Expense & { items: ExpenseItem[], supplier: Customer }) | undefined>;
  createExpense(expense: InsertExpense, companyId?: number): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>, companyId: number): Promise<Expense>;
  getCompanyExpenses(companyId: number, filters?: {
    status?: string;
    category?: string;
    dateFrom?: Date;
    dateTo?: Date;
    supplierId?: number;
  }): Promise<(Expense & { supplier: Customer })[]>;
  getRecentExpenses(companyId: number, limit: number): Promise<(Expense & { supplier: Customer })[]>;

  // Expense Items
  createExpenseItem(item: InsertExpenseItem): Promise<ExpenseItem>;
  getExpenseItems(expenseId: number): Promise<ExpenseItem[]>;
  updateExpenseItem(id: number, item: Partial<InsertExpenseItem>): Promise<ExpenseItem>;
  deleteExpenseItem(id: number): Promise<void>;
  
  // User Invitations
  createUserInvitation(invitation: Omit<InsertUserInvitation, 'id' | 'invitationToken' | 'expiresAt' | 'createdAt' | 'updatedAt'>): Promise<UserInvitation>;
  getPendingInvitationByEmail(email: string, companyId: number): Promise<UserInvitation | undefined>;
  getCompanyInvitations(companyId: number): Promise<UserInvitation[]>;
  getInvitationByToken(token: string): Promise<UserInvitation | undefined>;
  acceptInvitation(token: string, password: string): Promise<User>;
  revokeInvitation(invitationId: number, companyId: number): Promise<void>;
  sendInvitationEmail(invitation: UserInvitation): Promise<void>;
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

  async getUserById(id: number): Promise<User | undefined> {
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

  async getUserByEmailConfirmationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.emailConfirmationToken, token));
    return user || undefined;
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
    return user || undefined;
  }

  async getCompanyUsers(companyId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.companyId, companyId));
  }

  async getAllUsersWithStats(): Promise<any[]> {
    // Delegate to UserService
    const { UserService } = await import('./modules/users/user.service');
    const userService = new UserService();
    return userService.getAllUsersWithStats();
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
  // Expenses implementation
  async getExpense(id: number, companyId: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.companyId, companyId)));
    return expense || undefined;
  }

  async getExpenseWithDetails(id: number, companyId: number): Promise<(Expense & { items: ExpenseItem[], supplier: Customer }) | undefined> {
    const [expense] = await db.select()
      .from(expenses)
      .leftJoin(customers, eq(expenses.supplierId, customers.id))
      .where(and(eq(expenses.id, id), eq(expenses.companyId, companyId)));

    if (!expense.expenses) return undefined;

    const items = await db.select().from(expenseItems)
      .where(eq(expenseItems.expenseId, id));

    return {
      ...expense.expenses,
      supplier: expense.customers!,
      items
    };
  }

  async createExpense(expense: InsertExpense, companyId?: number): Promise<Expense> {
    // Ensure companyId is set if provided as parameter
    if (companyId && !expense.companyId) {
      expense.companyId = companyId;
    }
    
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>, companyId: number): Promise<Expense> {
    console.log('UpdateExpense called with:', { id, expense, companyId });
    
    // Remove undefined fields that might cause database issues
    const cleanExpense = Object.fromEntries(
      Object.entries(expense).filter(([_, value]) => value !== undefined)
    );
    
    console.log('Clean expense data for update:', cleanExpense);
    
    const [updatedExpense] = await db.update(expenses)
      .set({ ...cleanExpense, updatedAt: new Date() })
      .where(and(eq(expenses.id, id), eq(expenses.companyId, companyId)))
      .returning();
    return updatedExpense;
  }

  async getCompanyExpenses(companyId: number, filters?: {
    status?: string;
    category?: string;
    dateFrom?: Date;
    dateTo?: Date;
    supplierId?: number;
  }): Promise<(Expense & { supplier: Customer })[]> {
    let query = db.select({
      expenses: expenses,
      supplier: customers
    })
    .from(expenses)
    .leftJoin(customers, eq(expenses.supplierId, customers.id))
    .where(eq(expenses.companyId, companyId));

    // Additional filters can be added here later

    const result = await query.orderBy(desc(expenses.createdAt));
    return result.map(row => ({ ...row.expenses, supplier: row.supplier! }));
  }

  async getRecentExpenses(companyId: number, limit: number): Promise<(Expense & { supplier: Customer })[]> {
    const result = await db.select({
      expenses: expenses,
      supplier: customers
    })
    .from(expenses)
    .leftJoin(customers, eq(expenses.supplierId, customers.id))
    .where(eq(expenses.companyId, companyId))
    .orderBy(desc(expenses.createdAt))
    .limit(limit);

    return result.map(row => ({ ...row.expenses, supplier: row.supplier! }));
  }

  async createExpenseItem(item: InsertExpenseItem): Promise<ExpenseItem> {
    const [newItem] = await db.insert(expenseItems).values(item).returning();
    return newItem;
  }

  async getExpenseItems(expenseId: number): Promise<ExpenseItem[]> {
    return await db.select().from(expenseItems).where(eq(expenseItems.expenseId, expenseId));
  }

  async updateExpenseItem(id: number, item: Partial<InsertExpenseItem>): Promise<ExpenseItem> {
    const [updatedItem] = await db.update(expenseItems)
      .set(item)
      .where(eq(expenseItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteExpenseItem(id: number): Promise<void> {
    await db.delete(expenseItems).where(eq(expenseItems.id, id));
  }

  // Invoice by customer methods
  async getInvoicesByCustomer(customerId: number, companyId: number): Promise<Invoice[]> {
    const result = await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(
        eq(invoices.customerId, customerId),
        eq(invoices.companyId, companyId)
      ))
      .orderBy(desc(invoices.issueDate));

    return result.map(row => ({
      ...row.invoices,
      customer: row.customers || undefined
    }));
  }

  // SaaS Admin Methods
  async getUserStats(startDate: Date) {
    const [totalUsers] = await db.select({ count: sql`count(*)` }).from(users);
    const [activeUsers] = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));
    const [trialUsers] = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.subscriptionStatus, 'trial'));
    const [paidUsers] = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.subscriptionStatus, 'active'));
    const [newUsersThisMonth] = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(gte(users.createdAt, startDate));

    return {
      totalUsers: totalUsers.count || 0,
      activeUsers: activeUsers.count || 0,
      trialUsers: trialUsers.count || 0,
      paidUsers: paidUsers.count || 0,
      newUsersThisMonth: newUsersThisMonth.count || 0,
      churnRate: 2.5
    };
  }

  async getRevenueStats(timeframe: string) {
    const [paidUsers] = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.subscriptionStatus, 'active'));

    const averagePrice = 199;
    const monthlyRevenue = Number(paidUsers.count || 0) * averagePrice;
    const yearlyRevenue = monthlyRevenue * 12;

    return {
      monthlyRevenue,
      yearlyRevenue,
      averageRevenuePerUser: averagePrice,
      growthRate: 15.5
    };
  }

  async getRecentUsers(limit: number = 10) {
    return await db.select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit);
  }

  async updateAdminSetting(key: string, value: string) {
    const { adminSettings } = await import('@shared/schema');
    await db.insert(adminSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: adminSettings.key,
        set: { value, updatedAt: new Date() }
      });
  }

  async getAllUsersForAdmin(limit: number, offset: number) {
    return await db.select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateUserSubscription(userId: number, updates: any) {
    await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }



  async updateUserLastLogin(userId: number) {
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, userId));
  }

  // Admin methods
  async getAdminUserStats(startDate: Date, endDate: Date) {
    const totalUsersQuery = await db.select({ count: sql`count(*)` }).from(users);
    const totalUsers = totalUsersQuery[0]?.count || 0;

    const newUsersQuery = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(gte(users.createdAt, startDate));
    const newUsers = newUsersQuery[0]?.count || 0;

    const activeUsersQuery = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.subscriptionStatus, 'active'));
    const activeUsers = activeUsersQuery[0]?.count || 0;

    const trialUsersQuery = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.subscriptionStatus, 'trial'));
    const trialUsers = trialUsersQuery[0]?.count || 0;

    return {
      totalUsers,
      newUsers,
      activeUsers,
      trialUsers,
      conversionRate: Number(totalUsers) > 0 ? ((Number(activeUsers) / Number(totalUsers)) * 100).toFixed(1) : '0'
    };
  }

  async getAdminRevenueStats(startDate: Date, endDate: Date) {
    const activeUsersQuery = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.subscriptionStatus, 'active'));
    const activeUsers = activeUsersQuery[0]?.count || 0;

    const averagePrice = 199; // Default price
    const monthlyRevenue = Number(activeUsers) * averagePrice;
    const yearlyRevenue = monthlyRevenue * 12;

    // Calculate previous period for growth
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    
    const prevActiveQuery = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(and(
        eq(users.subscriptionStatus, 'active'),
        lte(users.subscriptionStartedAt, startDate)
      ));
    const prevActiveUsers = prevActiveQuery[0]?.count || 0;
    const prevRevenue = Number(prevActiveUsers) * averagePrice;

    const growth = prevRevenue > 0 ? 
      (((monthlyRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : 
      '0';

    return {
      monthlyRevenue,
      yearlyRevenue,
      activeSubscriptions: activeUsers,
      averageRevenuePerUser: averagePrice,
      growth: `${growth}%`,
      churnRate: '2.5%' // Mock for now
    };
  }

  // New required methods for admin and customer routes
  async getAllUsers(filters?: { page?: number; limit?: number; search?: string; status?: string }): Promise<User[]> {
    let query = db.select().from(users);
    
    if (filters?.search) {
      query = query.where(or(
        ilike(users.username, `%${filters.search}%`),
        ilike(users.email, `%${filters.search}%`),
        ilike(users.firstName, `%${filters.search}%`),
        ilike(users.lastName, `%${filters.search}%`)
      ));
    }
    
    if (filters?.status) {
      query = query.where(eq(users.subscriptionStatus, filters.status));
    }
    
    query = query.orderBy(desc(users.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
      if (filters?.page && filters.page > 1) {
        query = query.offset((filters.page - 1) * filters.limit);
      }
    }
    
    return await query;
  }

  async getAllCompanies(filters?: { page?: number; limit?: number; search?: string }): Promise<Company[]> {
    let query = db.select().from(companies);
    
    if (filters?.search) {
      query = query.where(or(
        ilike(companies.name, `%${filters.search}%`),
        ilike(companies.ico, `%${filters.search}%`),
        ilike(companies.email, `%${filters.search}%`)
      ));
    }
    
    query = query.orderBy(desc(companies.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
      if (filters?.page && filters.page > 1) {
        query = query.offset((filters.page - 1) * filters.limit);
      }
    }
    
    return await query;
  }

  async getSystemStats(): Promise<any> {
    const totalUsersQuery = await db.select({ count: sql`count(*)` }).from(users);
    const totalUsers = Number(totalUsersQuery[0]?.count || 0);

    const totalCompaniesQuery = await db.select({ count: sql`count(*)` }).from(companies);
    const totalCompanies = Number(totalCompaniesQuery[0]?.count || 0);

    const totalInvoicesQuery = await db.select({ count: sql`count(*)` }).from(invoices);
    const totalInvoices = Number(totalInvoicesQuery[0]?.count || 0);

    const activeUsersQuery = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));
    const activeUsers = Number(activeUsersQuery[0]?.count || 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newUsersThisMonthQuery = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(gte(users.createdAt, thisMonth));
    const newUsersThisMonth = Number(newUsersThisMonthQuery[0]?.count || 0);

    return {
      totalUsers,
      totalCompanies,
      totalInvoices,
      activeUsers,
      newUsersThisMonth,
      conversionRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0'
    };
  }

  async getCustomers(companyId: number, filters?: { page?: number; limit?: number; search?: string }): Promise<Customer[]> {
    let query = db.select().from(customers).where(eq(customers.companyId, companyId));
    
    if (filters?.search) {
      query = query.where(and(
        eq(customers.companyId, companyId),
        or(
          ilike(customers.name, `%${filters.search}%`),
          ilike(customers.email, `%${filters.search}%`),
          ilike(customers.ico, `%${filters.search}%`)
        )
      ));
    }
    
    query = query.orderBy(desc(customers.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
      if (filters?.page && filters.page > 1) {
        query = query.offset((filters.page - 1) * filters.limit);
      }
    }
    
    return await query;
  }
  // Bank Accounts
  async getBankAccount(id: number): Promise<BankAccount | undefined> {
    const [bankAccount] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return bankAccount || undefined;
  }

  async getBankAccountsByCompany(companyId: number): Promise<BankAccount[]> {
    return await db.select().from(bankAccounts)
      .where(and(eq(bankAccounts.companyId, companyId), eq(bankAccounts.isActive, true)))
      .orderBy(desc(bankAccounts.createdAt));
  }

  async createBankAccount(bankAccount: InsertBankAccount): Promise<BankAccount> {
    const [newBankAccount] = await db
      .insert(bankAccounts)
      .values(bankAccount)
      .returning();
    return newBankAccount;
  }

  async updateBankAccount(id: number, bankAccount: Partial<InsertBankAccount>): Promise<BankAccount> {
    const [updatedBankAccount] = await db
      .update(bankAccounts)
      .set({ ...bankAccount, updatedAt: new Date() })
      .where(eq(bankAccounts.id, id))
      .returning();
    return updatedBankAccount;
  }

  // User Invitations
  async createUserInvitation(invitation: Omit<InsertUserInvitation, 'id' | 'invitationToken' | 'expiresAt' | 'createdAt' | 'updatedAt'>): Promise<UserInvitation> {
    const { randomUUID } = await import('crypto');
    const invitationToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

    const [newInvitation] = await db
      .insert(userInvitations)
      .values({
        ...invitation,
        invitationToken,
        expiresAt
      })
      .returning();
    return newInvitation;
  }

  async getPendingInvitationByEmail(email: string, companyId: number): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(
        and(
          eq(userInvitations.email, email),
          eq(userInvitations.companyId, companyId),
          eq(userInvitations.status, 'pending')
        )
      );
    return invitation || undefined;
  }

  async getCompanyInvitations(companyId: number): Promise<UserInvitation[]> {
    return await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.companyId, companyId))
      .orderBy(desc(userInvitations.createdAt));
  }

  async getInvitationByToken(token: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.invitationToken, token));
    return invitation || undefined;
  }

  async acceptInvitation(token: string, password: string): Promise<User> {
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer valid');
    }

    if (new Date() > invitation.expiresAt) {
      throw new Error('Invitation has expired');
    }

    // Create the user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 10);

    const newUser = await this.createUser({
      companyId: invitation.companyId,
      username: invitation.email,
      email: invitation.email,
      password: hashedPassword,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      role: invitation.role,
      accessLevel: invitation.accessLevel,
      emailConfirmed: true
    });

    // Mark invitation as accepted
    await db
      .update(userInvitations)
      .set({
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: newUser.id,
        updatedAt: new Date()
      })
      .where(eq(userInvitations.id, invitation.id));

    return newUser;
  }

  async revokeInvitation(invitationId: number, companyId: number): Promise<void> {
    await db
      .update(userInvitations)
      .set({
        status: 'revoked',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userInvitations.id, invitationId),
          eq(userInvitations.companyId, companyId)
        )
      );
  }

  async sendInvitationEmail(invitation: UserInvitation): Promise<void> {
    // Skip email sending for now and just log the invitation
    console.log(`📧 Would send invitation email to ${invitation.email} for company ${invitation.companyId}`);
  }
}

export const storage = new DatabaseStorage();