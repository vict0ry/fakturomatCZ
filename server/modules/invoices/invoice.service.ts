import { eq, and, gte, lte, desc, count, sql } from 'drizzle-orm';
import { db } from '../../db';
import { invoices, invoiceItems, customers } from '../../../shared/schema';
import type { Invoice, InsertInvoice, InvoiceItem, InsertInvoiceItem, Customer } from '../../../shared/schema';

export class InvoiceService {
  // Invoice CRUD operations
  async getInvoice(id: number, companyId: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)));
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber: string, companyId: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices)
      .where(and(eq(invoices.invoiceNumber, invoiceNumber), eq(invoices.companyId, companyId)));
    return invoice;
  }

  async getInvoiceByShareToken(shareToken: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices)
      .where(eq(invoices.shareToken, shareToken));
    return invoice;
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

  async deleteInvoice(id: number, companyId: number): Promise<void> {
    // Delete invoice items first
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    // Delete invoice
    await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)));
  }

  async getCompanyInvoices(companyId: number, limit?: number): Promise<Invoice[]> {
    const query = db.select().from(invoices)
      .where(eq(invoices.companyId, companyId))
      .orderBy(desc(invoices.createdAt));
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  async getRecentInvoices(companyId: number, limit: number = 10): Promise<Invoice[]> {
    return this.getCompanyInvoices(companyId, limit);
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

  // Invoice Items
  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [newItem] = await db.insert(invoiceItems).values(item).returning();
    return newItem;
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
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

  // Statistics
  async getInvoiceStats(companyId: number, dateFrom?: Date, dateTo?: Date) {
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

    return {
      revenue: Number(stats.revenue),
      invoiceCount: Number(stats.invoiceCount),
      paidInvoices: Number(stats.paidInvoices),
      unpaidAmount: Number(stats.unpaidAmount),
      overdueCount: Number(stats.overdueCount)
    };
  }
}