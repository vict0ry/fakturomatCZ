import OpenAI from "openai";
import { INVOICE_EXTRACTION_SYSTEM_PROMPT } from "./prompts.js";
import type { InvoiceData, UserContext } from "./types.js";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class InvoiceProcessor {
  
  async extractInvoiceData(message: string): Promise<InvoiceData> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: INVOICE_EXTRACTION_SYSTEM_PROMPT },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return this.validateInvoiceData(result);
    } catch (error) {
      console.error('Invoice extraction error:', error);
      throw new Error('Failed to extract invoice data');
    }
  }

  async createInvoiceDraft(invoiceData: InvoiceData, userContext: UserContext): Promise<{ content: string; action: any }> {
    console.log('AI Direct Invoice Creation:', invoiceData);

    // Validate required fields
    if (!invoiceData.customerName || !invoiceData.items || invoiceData.items.length === 0) {
      return {
        content: "Nepodařilo se extrahovat potřebné údaje. Zkuste zadat příkaz znovu s názvem zákazníka a produktem.",
        action: { type: 'navigate', data: { path: '/invoices/new' } }
      };
    }

    try {
      // Find or create customer
      const customerId = await this.findOrCreateCustomer(invoiceData.customerName, userContext);
      
      // Create invoice draft
      const invoice = await this.createInvoice(invoiceData, customerId, userContext);
      
      // Create invoice items
      await this.createInvoiceItems(invoice.id, invoiceData.items);
      
      // Generate response
      const itemsText = invoiceData.items.map(item => 
        `• ${item.quantity} ${item.unit} ${item.productName}`
      ).join('\n');
      
      const amountText = invoiceData.totalAmount 
        ? `• Celková částka: ${invoiceData.totalAmount.toLocaleString('cs-CZ')} Kč`
        : `• Částka: bude potřeba doplnit`;

      const itemCount = invoiceData.items.length;
      const multiItemNote = itemCount > 1 ? ` Faktura obsahuje ${itemCount} položek.` : '';
      const amountNote = !invoiceData.totalAmount ? ' Částka bude potřeba doplnit v editačním formuláři.' : '';
      
      return {
        content: `Faktura pro zákazníka "${invoiceData.customerName}" byla úspěšně vytvořena! Číslo faktury: ${invoice.invoiceNumber}.${multiItemNote}${amountNote} Nyní můžete fakturu dokončit v editačním formuláři.`,
        action: { type: 'navigate', data: { path: `/invoices/${invoice.id}/edit` } }
      };

    } catch (error) {
      console.error('Invoice creation error:', error);
      return {
        content: "Omlouváme se, nepodařilo se vytvořit fakturu. Zkuste to prosím znovu nebo použijte formulář.",
        action: { type: 'navigate', data: { path: '/invoices/new' } }
      };
    }
  }

  private validateInvoiceData(data: any): InvoiceData {
    // Handle Czech amount formats like "25k" = 25000
    let totalAmount = data.totalAmount;
    if (typeof totalAmount === 'string') {
      const amountStr = totalAmount.toLowerCase().replace(/\s/g, '');
      if (amountStr.endsWith('k')) {
        totalAmount = parseFloat(amountStr.slice(0, -1)) * 1000;
      } else {
        totalAmount = parseFloat(amountStr) || null;
      }
    }

    return {
      customerName: data.customerName || null,
      items: Array.isArray(data.items) ? data.items.filter(item => 
        item.productName && item.quantity && item.unit
      ) : [],
      totalAmount: typeof totalAmount === 'number' ? totalAmount : null,
      notes: data.notes || ''
    };
  }

  private async findOrCreateCustomer(customerName: string, userContext: UserContext): Promise<number> {
    // Try to find existing customer first
    const customers = await userContext.storage.searchCustomers(customerName, userContext.companyId);
    console.log('Found existing customers:', customers.length);

    if (customers.length > 0) {
      return customers[0].id;
    }

    // Search ARES for company info
    const { fetchCompanyFromAres, searchCompaniesByName } = await import('../ares.js');
    let aresData = null;
    
    // Try to extract ICO from company name or search by name
    const icoMatch = customerName.match(/\d{8}/);
    if (icoMatch) {
      aresData = await fetchCompanyFromAres(icoMatch[0]);
    } else {
      // Search by company name
      const aresResults = await searchCompaniesByName(customerName);
      if (aresResults.length > 0) {
        aresData = aresResults[0];
      }
    }

    console.log('ARES search result:', aresData);

    // Create new customer
    const customerData = {
      name: aresData?.name || customerName,
      ico: aresData?.ico || '',
      dic: aresData?.dic || '',
      email: '',
      phone: '',
      address: aresData?.address || '',
      city: aresData?.city || '',
      postalCode: aresData?.postalCode || '',
      companyId: userContext.companyId
    };

    const customer = await userContext.storage.createCustomer(customerData);
    console.log('Created new customer:', customer.id);
    return customer.id;
  }

  private async createInvoice(invoiceData: InvoiceData, customerId: number, userContext: UserContext) {
    const currentYear = new Date().getFullYear();
    const invoiceNumber = `${currentYear}${String(Date.now()).slice(-4)}`;
    
    const invoiceRecord = {
      companyId: userContext.companyId,
      customerId: customerId,
      type: 'invoice' as const,
      invoiceNumber: invoiceNumber,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      subtotal: invoiceData.totalAmount?.toString() || '0',
      vatAmount: invoiceData.totalAmount ? Math.round(invoiceData.totalAmount * 0.21).toString() : '0',
      total: invoiceData.totalAmount ? Math.round(invoiceData.totalAmount * 1.21).toString() : '0',
      status: 'draft' as const,
      notes: invoiceData.notes || ''
    };

    return await userContext.storage.createInvoice(invoiceRecord);
  }

  private async createInvoiceItems(invoiceId: number, items: any[]) {
    for (const item of items) {
      const itemRecord = {
        invoiceId: invoiceId,
        description: item.description || item.productName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: '0', // Will be filled by user
        vatRate: '21',
        total: '0'
      };

      await userContext.storage.createInvoiceItem(itemRecord);
    }
  }
}