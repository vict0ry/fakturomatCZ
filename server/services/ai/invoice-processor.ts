import OpenAI from "openai";
import { INVOICE_EXTRACTION_SYSTEM_PROMPT, PRICING_EXTRACTION_SYSTEM_PROMPT } from "./prompts.js";
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
    if (!invoiceData.customerName) {
      return {
        content: "Pro vytvoření faktury potřebuji alespoň název zákazníka a popis služby. Zkuste zadat příkaz znovu s názvem zákazníka.",
        action: { type: 'navigate', data: { path: '/invoices/new' } }
      };
    }

    // Ensure we have at least one item
    if (!invoiceData.items || invoiceData.items.length === 0) {
      invoiceData.items = [{
        productName: 'Služby',
        quantity: '1',
        unit: 'ks',
        description: 'Služby dle dohody'
      }];
    }

    try {
      // Find or create customer with ARES lookup
      const { customerId, customerInfo, aresInfo } = await this.findOrCreateCustomerWithInfo(invoiceData.customerName, userContext);
      
      // Create invoice draft
      const invoice = await this.createInvoice(invoiceData, customerId, userContext);
      
      // Log invoice creation to history
      await userContext.storage.createInvoiceHistory({
        invoiceId: invoice.id,
        companyId: userContext.companyId,
        userId: userContext.userId,
        action: 'created',
        description: `Faktura ${invoice.invoiceNumber} byla vytvořena prostřednictvím AI`,
        metadata: JSON.stringify({ 
          customerName: invoiceData.customerName,
          source: 'ai_chat',
          itemCount: invoiceData.items?.length || 0
        })
      });
      
      // Create invoice items
      await this.createInvoiceItems(invoice.id, invoiceData.items, userContext);
      
      // Generate response with ARES information
      const itemCount = invoiceData.items.length;
      const multiItemNote = itemCount > 1 ? ` Faktura obsahuje ${itemCount} položky.` : '';
      const amountNote = !invoiceData.totalAmount ? ' Částka bude potřeba doplnit v editačním formuláři.' : '';
      
      // Special handling for amount display
      let amountDisplay = '';
      if (invoiceData.totalAmount) {
        amountDisplay = ` Celková částka: ${invoiceData.totalAmount.toLocaleString('cs-CZ')} Kč.`;
      }
      
      // Add item details for multi-item invoices
      let itemDetails = '';
      if (itemCount > 1) {
        itemDetails = ` Položky: ${invoiceData.items.map(item => `${item.quantity} ${item.unit} ${item.productName}`).join(', ')}.`;
      }

      // ARES verification information
      let aresMessage = '';
      if (aresInfo) {
        aresMessage = ` ✅ Zákazník ověřen v ARES registru: ${aresInfo.name}${aresInfo.ico ? ', IČO: ' + aresInfo.ico : ''}${aresInfo.address ? ', ' + aresInfo.address : ''}.`;
      } else if (!customerInfo.existingCustomer) {
        aresMessage = ` ⚠️ Zákazník nebyl nalezen v ARES registru - údaje bude třeba doplnit ručně.`;
      }
      
      return {
        content: `Faktura pro zákazníka "${invoiceData.customerName}" byla úspěšně vytvořena! Číslo faktury: ${invoice.invoiceNumber}.${aresMessage}${multiItemNote}${itemDetails}${amountDisplay}${amountNote} Nyní můžete fakturu dokončit v editačním formuláři.`,
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

  async extractPricingData(message: string): Promise<any> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: PRICING_EXTRACTION_SYSTEM_PROMPT },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result;
    } catch (error) {
      console.error('Pricing extraction error:', error);
      throw new Error('Failed to extract pricing data');
    }
  }

  async updateInvoiceWithData(updateData: any, userContext: UserContext, currentPath?: string): Promise<{ content: string; action: any }> {
    try {
      console.log('Update data received:', JSON.stringify(updateData, null, 2));
      console.log('Current path:', currentPath);
      
      let targetInvoice: any = null;
      
      // Check if user is in invoice edit route
      const editMatch = currentPath?.match(/\/invoices\/(\d+)\/edit/);
      if (editMatch) {
        const invoiceId = parseInt(editMatch[1]);
        targetInvoice = await userContext.storage.getInvoice(invoiceId, userContext.companyId);
        console.log('Found invoice from route:', targetInvoice?.id);
      }
      
      // Fallback to most recent invoice
      if (!targetInvoice) {
        const recentInvoices = await userContext.storage.getRecentInvoices(userContext.companyId, 1);
        if (!recentInvoices || recentInvoices.length === 0) {
          return {
            content: "Nenašel jsem žádnou fakturu k aktualizaci. Zkuste přejít na editaci konkrétní faktury.",
            action: { type: 'navigate', data: { path: '/invoices' } }
          };
        }
        targetInvoice = recentInvoices[0];
        console.log('Using most recent invoice:', targetInvoice?.id);
      }
      
      // Get current invoice items
      const currentItems = await userContext.storage.getInvoiceItems(targetInvoice.id);
      console.log('Current invoice items:', currentItems);
      
      if (!pricingData || !pricingData.items || !Array.isArray(pricingData.items)) {
        console.error('Invalid pricing data structure:', pricingData);
        return {
          content: "Nepodařilo se rozpoznat cenové informace. Zkuste zadat ceny ve formátu: 'kvety 12000 za kg, bong 1200 za ks'",
          action: { type: 'navigate', data: { path: `/invoices/${targetInvoice.id}/edit` } }
        };
      }
      
      // Update items with pricing
      let totalAmount = 0;
      const updatedItems = [];
      
      for (const item of currentItems) {
        // Use description field for matching
        const price = await this.findPriceForItem(item.description || '', pricingData.items);
        const itemTotal = price * parseFloat(item.quantity);
        totalAmount += itemTotal;
        
        const updatedItem = {
          ...item,
          unitPrice: price,
          totalPrice: itemTotal
        };
        
        await userContext.storage.updateInvoiceItem(item.id, {
          unitPrice: price.toString(),
          total: itemTotal.toString()
        });
        
        updatedItems.push(updatedItem);
      }
      
      // Update invoice total
      await userContext.storage.updateInvoice(targetInvoice.id, {
        totalAmount,
        subtotal: totalAmount,
        vatAmount: totalAmount * 0.21, // 21% VAT
        finalAmount: totalAmount * 1.21
      }, userContext.companyId);
      
      const itemsText = updatedItems.map(item => 
        `• ${item.quantity} ks ${item.description} - ${item.unitPrice.toLocaleString('cs-CZ')} Kč/ks = ${item.totalPrice.toLocaleString('cs-CZ')} Kč`
      ).join('\n');
      
      return {
        content: `Faktura ${targetInvoice.invoiceNumber} byla aktualizována s cenami!\n\n${itemsText}\n\nCelková částka: ${totalAmount.toLocaleString('cs-CZ')} Kč (bez DPH)\nS DPH (21%): ${(totalAmount * 1.21).toLocaleString('cs-CZ')} Kč`,
        action: { type: 'navigate', data: { path: `/invoices/${targetInvoice.id}/edit` } }
      };
      
    } catch (error) {
      console.error('Invoice pricing update error:', error);
      return {
        content: "Nepodařilo se aktualizovat fakturu s cenami. Zkuste to prosím znovu.",
        action: { type: 'navigate', data: { path: '/invoices' } }
      };
    }
  }

  private async findPriceForItem(productName: string, pricingItems: any[]): Promise<number> {
    console.log('Finding price for product:', productName);
    console.log('Available pricing items:', pricingItems);
    
    if (!pricingItems || !Array.isArray(pricingItems)) {
      console.error('Invalid pricingItems:', pricingItems);
      return 0;
    }
    
    if (!productName || typeof productName !== 'string') {
      console.error('Invalid productName:', productName);
      return 0;
    }
    
    const normalizedProductName = productName.toLowerCase();
    console.log('Normalized product name:', normalizedProductName);
    
    for (let i = 0; i < pricingItems.length; i++) {
      const pricingItem = pricingItems[i];
      console.log(`Checking pricing item ${i}:`, pricingItem);
      
      if (!pricingItem) {
        console.log('Skipping null/undefined pricing item');
        continue;
      }
      
      if (!pricingItem.productName) {
        console.log('Skipping pricing item without productName');
        continue;
      }
      
      if (typeof pricingItem.productName !== 'string') {
        console.log('Skipping pricing item with non-string productName:', typeof pricingItem.productName);
        continue;
      }
      
      const normalizedPricingName = pricingItem.productName.toLowerCase();
      console.log('Normalized pricing name:', normalizedPricingName);
      
      // Enhanced matching for Czech products
      const isMatch = await this.matchesProduct(normalizedProductName, normalizedPricingName);
      console.log(`Match result for "${normalizedProductName}" vs "${normalizedPricingName}": ${isMatch}`);
      
      if (isMatch) {
        console.log('Found match! Price:', pricingItem.unitPrice);
        return pricingItem.unitPrice || 0;
      }
    }
    
    console.log('No price found for product:', productName);
    return 0; // Default price if not found
  }

  private async matchesProduct(productName: string, pricingName: string): Promise<boolean> {
    console.log(`AI matching "${productName}" vs "${pricingName}"`);
    
    // Direct match first (fast path)
    if (productName.includes(pricingName) || pricingName.includes(productName)) {
      console.log('Direct match found');
      return true;
    }
    
    // Use AI for intelligent product matching
    try {
      const prompt = `Rozhodní jestli tyto dva české texty popisují stejný produkt nebo službu:

Text 1: "${productName}"
Text 2: "${pricingName}"

Pravidla:
- Ignoruj slova jako "prodávám", "nabízím", "za", čísla a jednotky
- Zaměř se pouze na hlavní produkt/službu
- Zohledni české tvary slov (drtička = drtičky)
- Zohledni synonyma a podobné produkty

Odpověz pouze "ANO" nebo "NE".`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        max_tokens: 5,
        temperature: 0.1
      });

      const result = response.choices[0].message.content?.trim() || '';
      const match = result.toUpperCase() === 'ANO';
      console.log(`AI match result: ${match} (response: "${result}")`);
      return match;
    } catch (error) {
      console.error('AI matching failed:', error);
      // Simple fallback only if AI fails
      return productName.includes(pricingName) || pricingName.includes(productName);
    }
  }

  private validateInvoiceData(data: any): InvoiceData {
    console.log('Validating invoice data:', JSON.stringify(data, null, 2));
    
    // Calculate total from items if totalAmount not provided
    let totalAmount = data.totalAmount;
    
    // First try to get totalAmount from data
    if (typeof totalAmount === 'string') {
      const amountStr = totalAmount.toLowerCase().replace(/\s/g, '');
      if (amountStr.endsWith('k')) {
        totalAmount = parseFloat(amountStr.slice(0, -1)) * 1000;
      } else {
        totalAmount = parseFloat(amountStr) || null;
      }
    }
    
    // If no totalAmount, calculate from items
    if (!totalAmount && data.items && Array.isArray(data.items)) {
      totalAmount = 0;
      for (const item of data.items) {
        if (item.unitPrice && typeof item.unitPrice === 'number') {
          const quantity = parseFloat(item.quantity) || 1;
          totalAmount += item.unitPrice * quantity;
        }
      }
      console.log('Calculated totalAmount from items:', totalAmount);
    }
    
    // Also check if customer name contains amount format
    if (!totalAmount && data.customerName) {
      const nameMatch = data.customerName.match(/(\d+)k/i);
      if (nameMatch) {
        totalAmount = parseFloat(nameMatch[1]) * 1000;
      }
    }

    // Process items with fallback for service descriptions
    let items = Array.isArray(data.items) ? data.items.filter((item: any) => 
      item.productName && item.quantity && item.unit
    ) : [];
    
    // If no items but we have notes with service keywords, create service item
    if (items.length === 0 && data.notes) {
      const servicePattern = /(za|služby|práci|konzultace|dodávku)/i;
      if (servicePattern.test(data.notes)) {
        items = [{
          productName: 'Služby',
          quantity: '1',
          unit: 'ks',
          description: data.notes
        }];
      }
    }

    return {
      customerName: data.customerName || null,
      items: items,
      totalAmount: typeof totalAmount === 'number' ? totalAmount : null,
      notes: data.notes || ''
    };
  }

  private async findOrCreateCustomer(customerName: string, userContext: UserContext): Promise<number> {
    const result = await this.findOrCreateCustomerWithInfo(customerName, userContext);
    return result.customerId;
  }

  private async findOrCreateCustomerWithInfo(customerName: string, userContext: UserContext): Promise<{
    customerId: number;
    customerInfo: { existingCustomer: boolean };
    aresInfo: any;
  }> {
    // Try to find existing customer first
    const customers = await userContext.storage.searchCustomers(customerName, userContext.companyId);
    console.log('Found existing customers:', customers.length);

    if (customers.length > 0) {
      return {
        customerId: customers[0].id,
        customerInfo: { existingCustomer: true },
        aresInfo: null
      };
    }

    // Search ARES for company info
    const { fetchCompanyFromAres, searchCompaniesByName } = await import('../ares.js');
    let aresData = null;
    
    // Try to extract ICO from company name or search by name
    const icoMatch = customerName.match(/\d{8}/);
    if (icoMatch) {
      console.log('Searching ARES by ICO:', icoMatch[0]);
      aresData = await fetchCompanyFromAres(icoMatch[0]);
    } else {
      // Search by company name
      console.log('Searching ARES by name:', customerName);
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
      dic: (aresData as any)?.dic || '',
      email: '',
      phone: '',
      address: aresData?.address || '',
      city: aresData?.city || '',
      postalCode: (aresData as any)?.postalCode || '',
      companyId: userContext.companyId
    };

    const customer = await userContext.storage.createCustomer(customerData);
    console.log('Created new customer:', customer.id);
    
    return {
      customerId: customer.id,
      customerInfo: { existingCustomer: false },
      aresInfo: aresData
    };
  }

  private async createInvoice(invoiceData: InvoiceData, customerId: number, userContext: UserContext) {

    
    const currentYear = new Date().getFullYear();
    const invoiceNumber = `${currentYear}${String(Date.now()).slice(-4)}`;
    
    const invoiceRecord = {
      companyId: userContext.companyId, // Use correct company from user context
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

  private async createInvoiceItems(invoiceId: number, items: any[], userContext: UserContext) {
    for (const item of items) {
      const unitPrice = item.unitPrice || 0;
      const quantity = parseFloat(item.quantity) || 1;
      const itemTotal = unitPrice * quantity;
      
      const itemRecord = {
        invoiceId: invoiceId,
        description: item.description || item.productName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: unitPrice.toString(),
        vatRate: '21',
        total: itemTotal.toString()
      };

      console.log('Creating invoice item:', itemRecord);
      await userContext.storage.createInvoiceItem(itemRecord);
    }
  }
}