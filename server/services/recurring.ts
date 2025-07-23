import { storage } from '../storage';
import type { InsertInvoice, Invoice } from '@shared/schema';

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number; // Every X days/weeks/months/etc
  endDate?: Date;
  maxOccurrences?: number;
}

export interface RecurringInvoice {
  id: number;
  companyId: number;
  templateInvoiceId: number;
  customerId: number;
  pattern: RecurringPattern;
  nextGenerationDate: Date;
  isActive: boolean;
  generatedCount: number;
  lastGeneratedAt?: Date;
  createdAt: Date;
}

export class RecurringInvoiceService {
  /**
   * Create a new recurring invoice schedule
   */
  static async createRecurring(
    templateInvoice: Invoice,
    pattern: RecurringPattern
  ): Promise<RecurringInvoice> {
    try {
      const nextDate = this.calculateNextDate(new Date(), pattern);
      
      const recurringData = {
        companyId: templateInvoice.companyId,
        templateInvoiceId: templateInvoice.id,
        customerId: templateInvoice.customerId,
        pattern: JSON.stringify(pattern),
        nextGenerationDate: nextDate,
        isActive: true,
        generatedCount: 0,
        createdAt: new Date()
      };
      
      return await storage.createRecurringInvoice(recurringData);
    } catch (error) {
      console.error('Error creating recurring invoice:', error);
      throw new Error('Failed to create recurring invoice');
    }
  }
  
  /**
   * Generate invoices that are due to be created
   */
  static async generateDueInvoices(): Promise<Invoice[]> {
    try {
      const dueRecurring = await storage.getDueRecurringInvoices();
      const generatedInvoices: Invoice[] = [];
      
      for (const recurring of dueRecurring) {
        try {
          const templateInvoice = await storage.getInvoice(recurring.templateInvoiceId);
          if (!templateInvoice) continue;
          
          // Create new invoice based on template
          const newInvoice = await this.generateInvoiceFromTemplate(
            templateInvoice,
            recurring
          );
          
          generatedInvoices.push(newInvoice);
          
          // Update recurring schedule
          await this.updateRecurringAfterGeneration(recurring);
          
        } catch (error) {
          console.error(`Error generating invoice for recurring ${recurring.id}:`, error);
        }
      }
      
      return generatedInvoices;
    } catch (error) {
      console.error('Error generating due invoices:', error);
      throw new Error('Failed to generate due invoices');
    }
  }
  
  /**
   * Generate a new invoice from a template
   */
  private static async generateInvoiceFromTemplate(
    template: Invoice,
    recurring: RecurringInvoice
  ): Promise<Invoice> {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 14); // 14 days from issue
    
    // Generate new invoice number
    const invoiceNumber = await this.generateNextInvoiceNumber(template.companyId);
    
    const newInvoiceData: InsertInvoice = {
      companyId: template.companyId,
      userId: template.userId,
      customerId: template.customerId,
      type: template.type,
      invoiceNumber: invoiceNumber,
      issueDate: today,
      dueDate: dueDate,
      subtotal: template.subtotal,
      vatAmount: template.vatAmount,
      total: template.total,
      currency: template.currency,
      paymentMethod: template.paymentMethod,
      bankAccount: template.bankAccount,
      variableSymbol: invoiceNumber.replace(/\D/g, ''),
      constantSymbol: template.constantSymbol,
      specificSymbol: template.specificSymbol,
      deliveryMethod: template.deliveryMethod,
      deliveryAddress: template.deliveryAddress,
      warranty: template.warranty,
      orderNumber: template.orderNumber,
      notes: `Automaticky vygenerovaná opakující se faktura na základě šablony ${template.invoiceNumber}`,
      isReverseCharge: template.isReverseCharge,
      status: 'draft'
    };
    
    // Create the invoice
    const newInvoice = await storage.createInvoice(newInvoiceData);
    
    // Copy invoice items
    const templateItems = await storage.getInvoiceItems(template.id);
    for (const item of templateItems) {
      await storage.addInvoiceItem(newInvoice.id, {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        total: item.total
      });
    }
    
    return newInvoice;
  }
  
  /**
   * Update recurring invoice after generation
   */
  private static async updateRecurringAfterGeneration(
    recurring: RecurringInvoice
  ): Promise<void> {
    const pattern = JSON.parse(recurring.pattern);
    const nextDate = this.calculateNextDate(recurring.nextGenerationDate, pattern);
    
    const newCount = recurring.generatedCount + 1;
    
    // Check if we should deactivate
    let isActive = recurring.isActive;
    if (pattern.maxOccurrences && newCount >= pattern.maxOccurrences) {
      isActive = false;
    }
    if (pattern.endDate && nextDate > new Date(pattern.endDate)) {
      isActive = false;
    }
    
    await storage.updateRecurringInvoice(recurring.id, {
      nextGenerationDate: nextDate,
      generatedCount: newCount,
      lastGeneratedAt: new Date(),
      isActive: isActive
    });
  }
  
  /**
   * Calculate next generation date based on pattern
   */
  private static calculateNextDate(
    currentDate: Date, 
    pattern: RecurringPattern
  ): Date {
    const nextDate = new Date(currentDate);
    
    switch (pattern.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + pattern.interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (pattern.interval * 7));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + (pattern.interval * 3));
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + pattern.interval);
        break;
    }
    
    return nextDate;
  }
  
  /**
   * Generate next invoice number
   */
  private static async generateNextInvoiceNumber(companyId: number): Promise<string> {
    const year = new Date().getFullYear();
    const lastInvoice = await storage.getLastInvoiceNumber(companyId, year);
    
    let nextNumber = 1;
    if (lastInvoice) {
      const match = lastInvoice.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    return `${year}${nextNumber.toString().padStart(4, '0')}`;
  }
  
  /**
   * Get all recurring invoices for a company
   */
  static async getRecurringInvoices(companyId: number): Promise<RecurringInvoice[]> {
    return await storage.getRecurringInvoices(companyId);
  }
  
  /**
   * Cancel a recurring invoice
   */
  static async cancelRecurring(id: number): Promise<void> {
    await storage.updateRecurringInvoice(id, { isActive: false });
  }
  
  /**
   * Update recurring invoice pattern
   */
  static async updateRecurring(
    id: number, 
    pattern: RecurringPattern
  ): Promise<void> {
    const nextDate = this.calculateNextDate(new Date(), pattern);
    
    await storage.updateRecurringInvoice(id, {
      pattern: JSON.stringify(pattern),
      nextGenerationDate: nextDate
    });
  }
}

// Cron job simulation - in production this would be a proper cron job
export function startRecurringInvoiceProcessor() {
  // Check for due invoices every hour
  setInterval(async () => {
    try {
      console.log('Checking for due recurring invoices...');
      const generatedInvoices = await RecurringInvoiceService.generateDueInvoices();
      
      if (generatedInvoices.length > 0) {
        console.log(`Generated ${generatedInvoices.length} recurring invoices`);
      }
    } catch (error) {
      console.error('Error in recurring invoice processor:', error);
    }
  }, 60 * 60 * 1000); // Every hour
  
  console.log('Recurring invoice processor started');
}