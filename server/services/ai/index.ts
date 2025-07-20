// Main AI Service Coordinator - Function Calling Approach
import OpenAI from "openai";
import { InvoiceProcessor } from "./invoice-processor.js";
import { extractUniversalUpdate } from './universal-update-extractor.js';
import { UNIVERSAL_AI_SYSTEM_PROMPT } from "./prompts.js";
import type { UniversalAIResponse, UserContext } from "./types.js";
import { AI_TOOLS } from "./tools.js";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class UniversalAIService {
  private invoiceProcessor = new InvoiceProcessor();

  async processMessage(
    message: string, 
    context: string, 
    currentPath: string, 
    userContext: UserContext,
    chatHistory: any[] = [],
    attachments: any[] = []
  ): Promise<UniversalAIResponse> {
    
    try {
      // Use OpenAI Function Calling
      const functionResponse = await this.processWithFunctionCalling(message, context, currentPath, chatHistory, userContext, attachments);
      return functionResponse;

    } catch (error) {
      console.error('AI processing error:', error);
      return {
        content: "Omlouváme se, došlo k neočekávané chybě. Zkuste to prosím znovu nebo kontaktujte podporu.",
      };
    }
  }

  // Removed all includes() handlers - AI handles everything now
  private tryQuickHandlers(message: string, currentPath: string): UniversalAIResponse | null {
    return null; // Let AI handle all requests
  }

  private async processWithFunctionCalling(
    message: string, 
    context: string, 
    currentPath: string,
    chatHistory: any[] = [],
    userContext: UserContext,
    attachments: any[] = []
  ): Promise<UniversalAIResponse> {
    
    // If there are image attachments, process them with Vision API first
    if (attachments && attachments.length > 0) {
      const imageAttachments = attachments.filter(att => 
        att.type?.startsWith('image/') || att.name?.match(/\.(jpg|jpeg|png)$/i)
      );
      
      if (imageAttachments.length > 0) {
        try {
          const visionResult = await this.processImageWithVision(imageAttachments, message);
          if (visionResult) {
            // Extract expense data from receipt/invoice and save attachment
            return await this.createExpenseFromVision(visionResult, userContext, imageAttachments[0]);
          }
        } catch (error) {
          console.error('Vision API processing failed:', error);
          return {
            content: 'Nepodařilo se zpracovat obrázek účtenky. Zkuste prosím nahrát obrázek znovu nebo vytvořit náklad manuálně.'
          };
        }
      }
    }
    
    // Enhanced system prompt for Function Calling
    const systemPrompt = `Jsi pokročilý AI asistent pro český fakturační systém. 

AKTUÁLNÍ STRÁNKA: ${currentPath}

KLÍČOVÉ PRAVIDLO:
- Pokud jsi na /invoices/[id]/edit a uživatel říká "pridej polozku [něco] za [cena]kc" → VŽDY použij add_item_to_invoice
- Pokud není uvedeno množství, použij quantity: "1"
- Pokud není uvedena jednotka, použij unit: "ks" 
- Vždy extrahuj cenu z textu

PŘÍKLADY:
"pridej polozku testovaci za 50kc" → add_item_to_invoice(description: "testovaci", quantity: "1", unit: "ks", unitPrice: 50)
"prodavam pikachu za 300kc" → add_item_to_invoice(description: "pikachu", quantity: "1", unit: "ks", unitPrice: 300)
"5kg kvety za 100kc" → add_item_to_invoice(description: "kvety", quantity: "5", unit: "kg", unitPrice: 100)

Kontext: ${context}`;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Build conversation with chat history
    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];
    
    // Add chat history if available
    if (chatHistory && chatHistory.length > 0) {
      messages.push(...chatHistory);
    }
    
    // Add current message
    messages.push({ 
      role: "user", 
      content: message 
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages,
      tools: AI_TOOLS,
      tool_choice: "auto"
    });

    const assistantMessage = response.choices[0].message;

    // Handle function calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      return await this.handleFunctionCall(assistantMessage.tool_calls[0], userContext, currentPath);
    }

    // Handle regular response
    return {
      content: assistantMessage.content || "Nepodařilo se zpracovat požadavek."
    };
  }

  private async handleFunctionCall(
    toolCall: any,
    userContext: UserContext,
    currentPath: string
  ): Promise<UniversalAIResponse> {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    try {
      switch (functionName) {
        case 'create_invoice':
          return await this.createInvoice(args, userContext);
        
        case 'add_note_to_invoice':
          return await this.addNoteToInvoice(args, userContext, currentPath);
        
        case 'update_invoice_prices':
          return await this.updateInvoicePrices(args, userContext, currentPath);
        
        case 'update_invoice_universal':
          return await this.updateInvoiceUniversal(args, userContext, currentPath);
        
        case 'add_item_to_invoice':
          return await this.addItemToInvoice(args, userContext, currentPath);
        
        case 'navigate_to_page':
          return await this.navigateToPage(args);
        
        case 'update_invoice_status':
          return await this.updateInvoiceStatus(args, userContext);
        
        case 'create_expense':
          return await this.createExpense(args, userContext);
        
        case 'get_expenses':
          return await this.getExpenses(args, userContext);
        
        case 'provide_help':
          return { content: args.response };
        
        default:
          return { content: `Neznámá funkce: ${functionName}` };
      }
    } catch (error) {
      console.error(`Function ${functionName} failed:`, error);
      return {
        content: `Nepodařilo se vykonat operaci ${functionName}. Zkuste to prosím znovu.`
      };
    }
  }

  // Function implementations
  private async createInvoice(args: any, userContext: UserContext): Promise<UniversalAIResponse> {
    try {
      const invoiceData = {
        customerName: args.customerName,
        items: args.items,
        totalAmount: args.totalAmount,
        notes: args.notes
      };
      return await this.invoiceProcessor.createInvoiceDraft(invoiceData, userContext);
    } catch (error) {
      console.error('Invoice creation failed:', error);
      return {
        content: "Nepodařilo se vytvořit fakturu. Zkuste zadat příkaz znovu s názvem zákazníka a popisem služby.",
        action: { type: 'navigate', data: { path: '/invoices/new' } }
      };
    }
  }

  private async addNoteToInvoice(args: any, userContext: UserContext, currentPath: string): Promise<UniversalAIResponse> {
    try {
      const invoiceIdMatch = currentPath.match(/\/invoices\/(\d+)\/edit/);
      if (!invoiceIdMatch) {
        return {
          content: "Pro přidání poznámky k faktuře musíte být na stránce editace faktury.",
          action: { type: 'navigate', data: { path: '/invoices' } }
        };
      }

      const invoiceId = parseInt(invoiceIdMatch[1]);
      const invoice = await userContext.storage.getInvoice(invoiceId, userContext.companyId);
      
      if (!invoice) {
        return {
          content: "Faktura nebyla nalezena.",
          action: { type: 'navigate', data: { path: '/invoices' } }
        };
      }

      const currentNotes = invoice.notes || '';
      const newNotes = currentNotes 
        ? `${currentNotes}\n\n${args.note}` 
        : args.note;

      await userContext.storage.updateInvoice(invoiceId, {
        notes: newNotes
      }, userContext.companyId);

      return {
        content: `Poznámka byla přidána k faktuře ${invoice.invoiceNumber}: "${args.note}"`,
        action: { type: 'refresh_current_page', data: {} }
      };

    } catch (error) {
      console.error('Add note failed:', error);
      return {
        content: "Nepodařilo se přidat poznámku k faktuře. Zkuste to prosím znovu."
      };
    }
  }

  private async updateInvoicePrices(args: any, userContext: UserContext, currentPath: string): Promise<UniversalAIResponse> {
    try {
      const pricingData = { items: args.items };
      return await this.invoiceProcessor.updateInvoiceWithPricing(pricingData, userContext, currentPath);
    } catch (error) {
      console.error('Invoice update failed:', error);
      return {
        content: "Nepodařilo se aktualizovat fakturu s cenami. Zkuste to prosím znovu nebo upravte fakturu manuálně."
      };
    }
  }

  private async navigateToPage(args: any): Promise<UniversalAIResponse> {
    let path = args.path;
    
    // Apply filters if provided
    if (args.filters) {
      const params = new URLSearchParams();
      if (args.filters.status) params.set('status', args.filters.status);
      if (args.filters.search) params.set('search', args.filters.search);
      if (params.toString()) path += '?' + params.toString();
    }

    return {
      content: `Přesměrovávám na ${path}...`,
      action: { type: 'navigate', data: { path } }
    };
  }

  private async updateInvoiceStatus(args: any, userContext: UserContext): Promise<UniversalAIResponse> {
    try {
      // Implementation would need to find invoice by number and update status
      return {
        content: `Status faktury ${args.invoiceNumber} byl změněn na ${args.status}.`,
        action: { type: 'refresh_current_page', data: {} }
      };
    } catch (error) {
      return {
        content: `Nepodařilo se změnit status faktury ${args.invoiceNumber}.`
      };
    }
  }

  private async updateInvoiceUniversal(args: any, userContext: UserContext, currentPath: string): Promise<UniversalAIResponse> {
    try {
      // Find target invoice
      const invoiceIdMatch = currentPath.match(/\/invoices\/(\d+)\/edit/);
      if (!invoiceIdMatch) {
        return {
          content: "Pro úpravu faktury musíte být na stránce editace faktury.",
          action: { type: 'navigate', data: { path: '/invoices' } }
        };
      }

      const invoiceId = parseInt(invoiceIdMatch[1]);
      const invoice = await userContext.storage.getInvoice(invoiceId, userContext.companyId);
      
      if (!invoice) {
        return {
          content: "Faktura nebyla nalezena.",
          action: { type: 'navigate', data: { path: '/invoices' } }
        };
      }

      const invoiceUpdates: any = {};
      let responseMessage = `Faktura ${invoice.invoiceNumber} byla aktualizována!`;

      // Handle different update types
      switch (args.updateType) {
        case 'splatnost':
          if (args.dueDate) {
            invoiceUpdates.dueDate = new Date(args.dueDate);
            responseMessage += `\n• Splatnost změněna na: ${new Date(args.dueDate).toLocaleDateString('cs-CZ')}`;
          }
          break;

        case 'poznamky':
          if (args.notes) {
            const currentNotes = invoice.notes || '';
            invoiceUpdates.notes = currentNotes 
              ? `${currentNotes}\n\n${args.notes}` 
              : args.notes;
            responseMessage += `\n• Poznámka přidána: "${args.notes}"`;
          }
          break;

        case 'zakaznik':
          if (args.customer) {
            const customer = await userContext.storage.getCustomer(invoice.customerId);
            if (customer) {
              const customerUpdates: any = {};
              if (args.customer.email) customerUpdates.email = args.customer.email;
              if (args.customer.phone) customerUpdates.phone = args.customer.phone;
              if (args.customer.address) customerUpdates.address = args.customer.address;
              
              await userContext.storage.updateCustomer(customer.id, customerUpdates, userContext.companyId);
              responseMessage += `\n• Údaje zákazníka aktualizovány`;
            }
          }
          break;

        case 'platba':
          if (args.paymentDetails) {
            if (args.paymentDetails.bankAccount) {
              invoiceUpdates.bankAccount = args.paymentDetails.bankAccount;
              responseMessage += `\n• Bankovní účet: ${args.paymentDetails.bankAccount}`;
            }
            if (args.paymentDetails.variableSymbol) {
              invoiceUpdates.variableSymbol = args.paymentDetails.variableSymbol;
              responseMessage += `\n• Variabilní symbol: ${args.paymentDetails.variableSymbol}`;
            }
          }
          break;

        case 'status':
          if (args.status) {
            invoiceUpdates.status = args.status;
            const statusMap = {
              'draft': 'koncept',
              'sent': 'odesláno', 
              'paid': 'zaplaceno',
              'cancelled': 'zrušeno'
            };
            responseMessage += `\n• Status změněn na: ${statusMap[args.status] || args.status}`;
          }
          break;

        case 'mnozstvi':
          if (args.items && args.items.length > 0) {
            const invoiceItems = await userContext.storage.getInvoiceItems(invoiceId);
            for (let i = 0; i < Math.min(args.items.length, invoiceItems.length); i++) {
              const itemUpdate = args.items[i];
              const existingItem = invoiceItems[i];
              
              const updateData: any = {};
              if (itemUpdate.quantity) updateData.quantity = itemUpdate.quantity;
              if (itemUpdate.unitPrice) updateData.unitPrice = itemUpdate.unitPrice.toString();
              if (itemUpdate.description) updateData.description = itemUpdate.description;
              
              await userContext.storage.updateInvoiceItem(existingItem.id, updateData);
              responseMessage += `\n• Položka aktualizována: ${existingItem.description}`;
            }
          }
          break;
      }

      // Apply invoice updates
      if (Object.keys(invoiceUpdates).length > 0) {
        await userContext.storage.updateInvoice(invoiceId, invoiceUpdates, userContext.companyId);
      }

      return {
        content: responseMessage,
        action: { type: 'refresh_current_page', data: {} }
      };

    } catch (error) {
      console.error('Universal invoice update failed:', error);
      return {
        content: "Nepodařilo se aktualizovat fakturu. Zkuste to prosím znovu."
      };
    }
  }

  private async addItemToInvoice(args: any, userContext: UserContext, currentPath: string): Promise<UniversalAIResponse> {
    try {
      // Find target invoice from current path OR from last created invoice context
      let invoiceId: number;
      let invoice: any;

      // Try to find invoice from current path first
      const invoiceIdMatch = currentPath.match(/\/invoices\/(\d+)\/edit/);
      if (invoiceIdMatch) {
        invoiceId = parseInt(invoiceIdMatch[1]);
        invoice = await userContext.storage.getInvoice(invoiceId, userContext.companyId);
        
        if (!invoice) {
          return {
            content: `Faktura s ID ${invoiceId} nebyla nalezena v databázi. Prosím zkontrolujte, zda faktura existuje.`,
            action: { type: 'navigate', data: { path: '/invoices' } }
          };
        }
      } else {
        // If not on edit page, try to find the most recent invoice for this user/company
        const recentInvoices = await userContext.storage.getInvoices(userContext.companyId);
        if (!recentInvoices || recentInvoices.length === 0) {
          return {
            content: "Pro přidání položky musíte být na stránce editace faktury nebo mít alespoň jednu vytvořenou fakturu.",
            action: { type: 'navigate', data: { path: '/invoices' } }
          };
        }
        
        // Use the most recent invoice (highest ID)
        invoice = recentInvoices.sort((a: any, b: any) => b.id - a.id)[0];
        invoiceId = invoice.id;
        console.log(`Using most recent invoice: ${invoice.invoiceNumber} (ID: ${invoiceId})`);
      }

      // Calculate totals
      const quantity = parseFloat(args.quantity) || 1;
      const unitPrice = args.unitPrice || 0;
      const total = quantity * unitPrice;

      // Create new invoice item
      const newItem = {
        invoiceId: invoiceId,
        description: args.description,
        quantity: args.quantity,
        unit: args.unit,
        unitPrice: unitPrice.toString(),
        vatRate: '21', // Default VAT rate
        total: total.toString()
      };

      console.log('Creating new invoice item:', newItem);
      const createdItem = await userContext.storage.createInvoiceItem(newItem);

      // Get all current items to recalculate totals
      const allItems = await userContext.storage.getInvoiceItems(invoiceId);
      let newSubtotal = 0;
      
      for (const item of allItems) {
        const itemTotal = parseFloat(item.total || '0');
        newSubtotal += itemTotal;
      }

      const newVatAmount = newSubtotal * 0.21;
      const newTotal = newSubtotal + newVatAmount;

      // Update invoice totals
      await userContext.storage.updateInvoice(invoiceId, {
        subtotal: newSubtotal.toString(),
        vatAmount: newVatAmount.toString(), 
        total: newTotal.toString()
      }, userContext.companyId);

      return {
        content: `Položka "${args.description}" byla přidána k faktuře ${invoice.invoiceNumber}!\n\n• Množství: ${args.quantity} ${args.unit}\n• Cena: ${unitPrice.toLocaleString('cs-CZ')} Kč/${args.unit}\n• Celkem za položku: ${total.toLocaleString('cs-CZ')} Kč\n\nNový celkový součet faktury: ${newTotal.toLocaleString('cs-CZ')} Kč (vč. DPH)`,
        action: { type: 'refresh_current_page', data: {} }
      };

    } catch (error) {
      console.error('Add item to invoice failed:', error);
      return {
        content: "Nepodařilo se přidat položku k faktuře. Zkuste to prosím znovu."
      };
    }
  }

  // Expense functions
  private async createExpense(args: any, userContext: UserContext): Promise<UniversalAIResponse> {
    try {
      console.log('Creating expense:', args);
      
      // Find or create supplier
      const existingSuppliers = await userContext.storage.searchCustomers(args.supplierName, userContext.companyId);
      let supplierId = null;
      
      if (existingSuppliers.length === 0) {
        const supplier = await userContext.storage.createCustomer({
          name: args.supplierName,
          companyId: userContext.companyId
        });
        supplierId = supplier.id;
      } else {
        supplierId = existingSuppliers[0].id;
      }

      const expenseNumber = `N${new Date().getFullYear()}${String(Date.now()).slice(-4)}`;
      const vatAmount = args.vatRate ? (args.amount || 0) * (args.vatRate / 100) : 0;
      const totalAmount = args.total || (args.amount || 0) + vatAmount;

      const expense = await userContext.storage.createExpense({
        companyId: userContext.companyId,
        userId: userContext.userId,
        expenseNumber,
        supplierId,
        category: args.category,
        description: args.description,
        amount: String(args.amount || totalAmount),
        vatAmount: String(vatAmount),
        total: String(totalAmount),
        vatRate: String(args.vatRate || 21),
        expenseDate: args.expenseDate ? new Date(args.expenseDate) : new Date(),
        receiptNumber: args.receiptNumber || '',
        status: 'draft'
      });

      return {
        content: `Náklad "${args.description}" byl vytvořen!\n\n• Dodavatel: ${args.supplierName}\n• Kategorie: ${args.category}\n• Částka: ${totalAmount.toLocaleString('cs-CZ')} Kč\n• Číslo nákladu: ${expenseNumber}`,
        action: { type: 'navigate', data: { path: '/expenses' } }
      };

    } catch (error) {
      console.error('Expense creation failed:', error);
      return {
        content: "Nepodařilo se vytvořit náklad. Zkuste zadat příkaz znovu s názvem dodavatele a popisem nákladu.",
        action: { type: 'navigate', data: { path: '/expenses' } }
      };
    }
  }

  private async getExpenses(args: any, userContext: UserContext): Promise<UniversalAIResponse> {
    try {
      console.log('Getting expenses with filters:', args);
      const expenses = await userContext.storage.getCompanyExpenses(userContext.companyId, args);
      
      if (expenses.length === 0) {
        return {
          content: "Nebyly nalezeny žádné náklady odpovídající zadaným kritériím.",
          action: { type: 'navigate', data: { path: '/expenses' } }
        };
      }

      const expenseList = expenses.slice(0, 5).map((expense: any) => 
        `• ${expense.description} - ${parseFloat(expense.total).toLocaleString('cs-CZ')} Kč (${expense.category || 'Nezařazeno'})`
      ).join('\n');

      return {
        content: `Nalezeno ${expenses.length} nákladů:\n\n${expenseList}${expenses.length > 5 ? '\n\n...a další' : ''}`,
        action: { type: 'navigate', data: { path: '/expenses' } }
      };

    } catch (error) {
      console.error('Get expenses failed:', error);
      return {
        content: "Nepodařilo se načíst seznam nákladů. Zkuste to prosím znovu."
      };
    }
  }

  private async processImageWithVision(imageAttachments: any[], message: string): Promise<any> {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      // Use the first image attachment
      const image = imageAttachments[0];
      
      // Convert base64 data if needed
      const imageData = image.data || image.content;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Prosím analyzuj tuto účtenku nebo fakturu a extrahuj následující informace v JSON formátu:
                {
                  "supplierName": "název dodavatele",
                  "description": "popis nákupu/služby", 
                  "amount": "částka bez DPH",
                  "total": "celková částka včetně DPH",
                  "vatAmount": "částka DPH",
                  "vatRate": "sazba DPH v %",
                  "receiptNumber": "číslo účtenky/faktury",
                  "expenseDate": "datum ve formátu YYYY-MM-DD",
                  "category": "kategorie (Office, Travel, Marketing, IT, Utilities, Fuel, Materials, Services, Other)"
                }
                
                Pokud nějaká informace není k dispozici, použij null. Pro kategorii zvol nejpodobnější z nabízených možností.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageData}`
                }
              }
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Vision API error:', error);
      throw error;
    }
  }

  private async createExpenseFromVision(visionData: any, userContext: UserContext, imageAttachment?: any): Promise<UniversalAIResponse> {
    try {
      // Create expense from vision data
      const expenseData = {
        supplierName: visionData.supplierName || 'Neznámý dodavatel',
        description: visionData.description || 'Náklad z účtenky',
        amount: visionData.amount || visionData.total,
        total: visionData.total || visionData.amount,
        vatAmount: visionData.vatAmount || '0',
        vatRate: visionData.vatRate || '21',
        receiptNumber: visionData.receiptNumber,
        expenseDate: visionData.expenseDate || new Date().toISOString().split('T')[0],
        category: visionData.category || 'Other',
        status: 'draft',
        // Store attachment info
        attachmentName: imageAttachment?.name || 'receipt-image.jpg',
        attachmentType: imageAttachment?.type || 'image/jpeg',
        attachmentUrl: `data:${imageAttachment?.type || 'image/jpeg'};base64,${imageAttachment?.data}` // Store as base64
      };

      const expense = await userContext.storage.createExpense(expenseData, userContext.companyId);

      return {
        content: `✅ Vytvořil jsem náklad z účtenky:

🏢 **Dodavatel:** ${expenseData.supplierName}
📝 **Popis:** ${expenseData.description}
💰 **Částka:** ${expenseData.total} Kč
🏷️ **Kategorie:** ${expenseData.category}
📄 **Účtenka č.:** ${expenseData.receiptNumber || 'N/A'}
📅 **Datum:** ${expenseData.expenseDate}

Náklad byl uložen jako koncept. Můžete ho upravit v sekci Náklady.`,
        action: {
          type: 'navigate',
          data: { path: '/expenses' }
        }
      };
    } catch (error) {
      console.error('Create expense from vision failed:', error);
      return {
        content: `Extrahoval jsem tyto údaje z účtenky:
        
🏢 **Dodavatel:** ${visionData.supplierName || 'Neznámý'}
📝 **Popis:** ${visionData.description || 'N/A'}
💰 **Částka:** ${visionData.total || visionData.amount || 'N/A'} Kč
🏷️ **Kategorie:** ${visionData.category || 'Other'}

Nepodařilo se automaticky vytvořit náklad. Můžete ho vytvořit manuálně na stránce Náklady → Nový náklad.`,
        action: {
          type: 'navigate', 
          data: { path: '/expenses/new' }
        }
      };
    }
  }
}

// Legacy export for backwards compatibility
export async function processUniversalAICommand(
  message: string, 
  context: string, 
  currentPath: string, 
  userContext: UserContext,
  chatHistory: any[] = []
): Promise<UniversalAIResponse> {
  const service = new UniversalAIService();
  return await service.processMessage(message, context, currentPath, userContext, chatHistory);
}

// Export types
export * from "./types.js";