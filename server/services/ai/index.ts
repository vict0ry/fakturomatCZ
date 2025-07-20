// Main AI Service Coordinator - Function Calling Approach
import OpenAI from "openai";
import { InvoiceProcessor } from "./invoice-processor.js";
import { extractUniversalUpdate } from './universal-update-extractor.js';
import { UNIVERSAL_AI_SYSTEM_PROMPT } from "./prompts.js";
import type { UniversalAIResponse, UserContext } from "./types.js";
import { AI_TOOLS } from "./prompts.js";

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
      console.log('Processing attachments:', attachments.length, 'attachments found');
      
      const imageAttachments = attachments.filter(att => 
        att.type?.startsWith('image/') || att.name?.match(/\.(jpg|jpeg|png)$/i)
      );
      
      console.log('Image attachments found:', imageAttachments.length);
      
      if (imageAttachments.length > 0) {
        try {
          console.log('Starting Vision API processing...');
          const visionResult = await this.processImageWithVision(imageAttachments, message);
          console.log('Vision API result:', visionResult);
          
          if (visionResult) {
            console.log('Creating expense from vision data...');
            // Extract expense data from receipt/invoice and save attachment
            return await this.createExpenseFromVision(visionResult, userContext, imageAttachments[0]);
          } else {
            console.log('Vision result is empty or null');
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

        case 'analyze_business_insights':
          return await this.analyzeBusinessInsights(args, userContext);

        case 'predict_payment_risk':
          return await this.predictPaymentRisk(args, userContext);

        case 'optimize_email_campaign':
          return await this.optimizeEmailCampaign(args, userContext);

        case 'generate_smart_report':
          return await this.generateSmartReport(args, userContext);

        case 'smart_expense_categorization':
          return await this.smartExpenseCategorization(args, userContext);
        
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
      console.log('Vision API processing started');
      console.log('Image attachment structure:', JSON.stringify(imageAttachments[0], null, 2));
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      // Use the first image attachment
      const image = imageAttachments[0];
      
      // Convert base64 data if needed
      const imageData = image.data || image.content;
      console.log('Image data length:', imageData ? imageData.length : 'null');
      
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

      const content = response.choices[0].message.content || '{}';
      console.log('Vision API raw response:', content);
      return JSON.parse(content);
    } catch (error) {
      console.error('Vision API error:', error);
      console.error('Error details:', (error as Error).message);
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
        attachmentUrl: `data:${imageAttachment?.type || 'image/jpeg'};base64,${imageAttachment?.content}` // Store as base64
      };

      // Use the same logic as createExpense function to properly handle supplier
      const existingSuppliers = await userContext.storage.searchCustomers(expenseData.supplierName, userContext.companyId);
      let supplierId = null;
      
      if (existingSuppliers.length === 0) {
        const supplier = await userContext.storage.createCustomer({
          name: expenseData.supplierName,
          companyId: userContext.companyId
        });
        supplierId = supplier.id;
      } else {
        supplierId = existingSuppliers[0].id;
      }

      const expenseNumber = `N${new Date().getFullYear()}${String(Date.now()).slice(-4)}`;
      
      const totalAmount = parseFloat(String(expenseData.total || expenseData.amount || 0));
      const vatAmount = parseFloat(String(expenseData.vatAmount || 0));
      
      const expense = await userContext.storage.createExpense({
        companyId: userContext.companyId,
        userId: userContext.userId,
        expenseNumber,
        supplierId,
        category: expenseData.category,
        description: expenseData.description,
        amount: String(totalAmount),
        vatAmount: String(vatAmount),
        total: String(totalAmount),
        vatRate: String(expenseData.vatRate || '21'),
        expenseDate: new Date(expenseData.expenseDate),
        receiptNumber: expenseData.receiptNumber || '',
        status: 'draft'
      });

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

  // Advanced AI Analytics Functions - Added as class methods
  private async analyzeBusinessInsights(args: any, userContext: UserContext): Promise<UniversalAIResponse> {
    try {
      const invoices = await userContext.storage.getInvoices(userContext.companyId);
      const customers = await userContext.storage.getCustomers(userContext.companyId);
      const expenses = await userContext.storage.getCompanyExpenses(userContext.companyId);

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const analysisPrompt = `Analyzuj následující obchodní data a poskytni inteligentní insights:

FAKTURY (${invoices.length}): ${JSON.stringify(invoices.slice(0, 20))}
ZÁKAZNÍCI (${customers.length}): ${JSON.stringify(customers.slice(0, 10))}  
NÁKLADY (${expenses.length}): ${JSON.stringify(expenses.slice(0, 20))}

Vytvoř JSON odpověď s těmito insights:
{
  "revenue_trend": "trend příjmů",
  "top_customers": ["nejlepší zákazníci podle příjmů"],
  "payment_patterns": "analýza platebních vzorů", 
  "cost_analysis": "analýza nákladů a efektivity",
  "recommendations": ["3-5 konkrétních doporučení"],
  "risks": ["identifikovaná rizika"],
  "opportunities": ["obchodní příležitosti"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });

      const insights = JSON.parse(response.choices[0].message.content);
      
      return {
        content: `📊 Inteligentní analýza vašeho podnikání

🔹 Trend příjmů: ${insights.revenue_trend}

👥 TOP zákazníci: ${insights.top_customers.join(', ')}

💰 Platební vzory: ${insights.payment_patterns}

📈 Analýza nákladů: ${insights.cost_analysis}

✨ Doporučení:
• ${insights.recommendations.join('\n• ')}

⚠️ Rizika:
• ${insights.risks.join('\n• ')}

🚀 Příležitosti:
• ${insights.opportunities.join('\n• ')}`,
        action: { type: 'navigate', data: { path: '/dashboard' } }
      };
    } catch (error) {
      console.error('Business analysis failed:', error);
      return {
        content: "Nepodařilo se vykonat analýzu podnikání. Zkuste to později."
      };
    }
  }

  private async predictPaymentRisk(args: any, userContext: UserContext): Promise<UniversalAIResponse> {
    try {
      let customer;
      
      if (args.customerId) {
        customer = await userContext.storage.getCustomer(args.customerId, userContext.companyId);
      } else if (args.customerName) {
        const customers = await userContext.storage.searchCustomers(args.customerName, userContext.companyId);
        customer = customers[0];
      }

      if (!customer) {
        return {
          content: "Zákazník nebyl nalezen. Zadejte prosím přesné jméno nebo ID zákazníka."
        };
      }

      const customerInvoices = await userContext.storage.getInvoices(userContext.companyId, { customerId: customer.id });

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const predictionPrompt = `Analyzuj platební riziko zákazníka na základě těchto údajů:

ZÁKAZNÍK: ${JSON.stringify(customer)}
HISTORIE FAKTUR: ${JSON.stringify(customerInvoices)}

Vytvoř JSON odhad rizika:
{
  "risk_score": "1-10 (1=nízké, 10=vysoké riziko)",
  "risk_level": "low/medium/high", 
  "payment_history": "analýza platební historie",
  "average_delay": "průměrné zpoždění ve dnech",
  "recommendations": ["doporučení pro snížení rizika"],
  "suggested_credit_limit": "doporučený úvěrový limit v Kč"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: predictionPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 800,
      });

      const riskAnalysis = JSON.parse(response.choices[0].message.content);
      
      return {
        content: `🎯 Analýza platebního rizika zákazníka ${customer.name}

📊 Rizikové skóre: ${riskAnalysis.risk_score}/10 (${riskAnalysis.risk_level})

📈 Platební historie: ${riskAnalysis.payment_history}

⏰ Průměrné zpoždění: ${riskAnalysis.average_delay} dní

💡 Doporučení:
• ${riskAnalysis.recommendations.join('\n• ')}

💰 Navrhovaný limit: ${riskAnalysis.suggested_credit_limit}`,
        action: { type: 'navigate', data: { path: '/customers' } }
      };
    } catch (error) {
      console.error('Payment risk prediction failed:', error);
      return {
        content: "Nepodařilo se analyzovat platební riziko. Zkuste to později."
      };
    }
  }

  private async optimizeEmailCampaign(args: any, userContext: UserContext): Promise<UniversalAIResponse> {
    try {
      const overdueInvoices = await userContext.storage.getOverdueInvoices(userContext.companyId);
      
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const optimizationPrompt = `Optimalizuj email kampaň pro typ "${args.campaignType}":

NEUHRAZENÉ FAKTURY: ${JSON.stringify(overdueInvoices.slice(0, 10))}

Vytvoř JSON s optimalizací:
{
  "subject_lines": ["3 optimální subject lines pro ${args.campaignType}"],
  "best_send_times": ["optimální časy odeslání"], 
  "personalization_tips": ["tipy pro personalizaci"],
  "email_templates": {
    "polite_reminder": "zdvořilá upomínka",
    "urgent_notice": "naléhavé oznámení",
    "final_warning": "poslední varování"
  },
  "success_predictions": "předpoklad úspěšnosti kampaní v %"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: optimizationPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 1200,
      });

      const optimization = JSON.parse(response.choices[0].message.content);
      
      return {
        content: `📧 Optimalizace email kampaně (${args.campaignType})

📝 Nejlepší subject lines:
• ${optimization.subject_lines.join('\n• ')}

⏰ Optimální časy: ${optimization.best_send_times.join(', ')}

🎯 Personalizace:
• ${optimization.personalization_tips.join('\n• ')}

📈 Předpoklad úspěšnosti: ${optimization.success_predictions}`,
        action: { type: 'navigate', data: { path: '/settings' } }
      };
    } catch (error) {
      console.error('Email optimization failed:', error);
      return {
        content: "Nepodařilo se optimalizovat email kampaň. Zkuste to později."
      };
    }
  }

  private async generateSmartReport(args: any, userContext: UserContext): Promise<UniversalAIResponse> {
    try {
      const invoices = await userContext.storage.getInvoices(userContext.companyId);
      const customers = await userContext.storage.getCustomers(userContext.companyId);
      const expenses = await userContext.storage.getCompanyExpenses(userContext.companyId);

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const reportPrompt = `Vygeneruj inteligentní ${args.reportType} report na základě těchto dat:

FAKTURY: ${JSON.stringify(invoices.slice(0, 30))}
ZÁKAZNÍCI: ${JSON.stringify(customers.slice(0, 20))}
NÁKLADY: ${JSON.stringify(expenses.slice(0, 30))}

Vytvoř JSON report:
{
  "executive_summary": "shrnutí pro vedení",
  "key_metrics": {
    "total_revenue": "celkové příjmy v Kč",
    "profit_margin": "zisková marže v %", 
    "top_customer_revenue": "příjmy od TOP zákazníka",
    "expense_ratio": "poměr nákladů k příjmům v %"
  },
  "trends": ["klíčové trendy"],
  "forecasts": ["předpovědi na další období"],
  "action_items": ["doporučené akce"],
  "detailed_analysis": "detailní analýza"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: reportPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const report = JSON.parse(response.choices[0].message.content);
      
      return {
        content: `📈 Inteligentní ${args.reportType.toUpperCase()} Report

📋 Shrnutí pro vedení: ${report.executive_summary}

📊 Klíčové metriky:
• Celkové příjmy: ${report.key_metrics.total_revenue}
• Zisková marže: ${report.key_metrics.profit_margin}
• TOP zákazník: ${report.key_metrics.top_customer_revenue}
• Poměr nákladů: ${report.key_metrics.expense_ratio}

📈 Trendy:
• ${report.trends.join('\n• ')}

🔮 Předpovědi:
• ${report.forecasts.join('\n• ')}

✅ Doporučené akce:
• ${report.action_items.join('\n• ')}

🔍 Detailní analýza: ${report.detailed_analysis}`,
        action: { type: 'navigate', data: { path: '/analytics' } }
      };
    } catch (error) {
      console.error('Smart report generation failed:', error);
      return {
        content: "Nepodařilo se vygenerovat inteligentní report. Zkuste to později."
      };
    }
  }

  private async smartExpenseCategorization(args: any, userContext: UserContext): Promise<UniversalAIResponse> {
    try {
      const expenses = await userContext.storage.getCompanyExpenses(userContext.companyId);
      
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const categorizationPrompt = `Kategorizuj tento náklad inteligentně:

NOVÝ NÁKLAD:
- Popis: "${args.expenseDescription}"
- Dodavatel: "${args.supplierName}"

EXISTUJÍCÍ NÁKLADY PRO KONTEXT: ${JSON.stringify(expenses.slice(0, 20))}

Vytvoř JSON:
{
  "suggested_category": "nejlepší kategorie z: Office, Travel, Marketing, IT, Utilities, Fuel, Materials, Services, Other",
  "confidence": "1-10 jak si jsi jistý",
  "reasoning": "zdůvodnění volby kategorie",
  "similar_expenses": ["podobné existující náklady"],
  "duplicate_risk": "riziko duplicity (low/medium/high)",
  "tax_deductible": "true/false - daňová uznatelnost"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: categorizationPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 800,
      });

      const categorization = JSON.parse(response.choices[0].message.content);
      
      return {
        content: `🏷️ Inteligentní kategorizace nákladu

📝 Navrhovaná kategorie: ${categorization.suggested_category} (jistota: ${categorization.confidence}/10)

💡 Zdůvodnění: ${categorization.reasoning}

🔍 Podobné náklady: ${categorization.similar_expenses.join(', ')}

⚠️ Riziko duplicity: ${categorization.duplicate_risk}

💼 Daňová uznatelnost: ${categorization.tax_deductible ? 'Ano' : 'Ne'}`,
        action: { type: 'navigate', data: { path: '/expenses' } }
      };
    } catch (error) {
      console.error('Smart categorization failed:', error);
      return {
        content: "Nepodařilo se kategorizovat náklad. Zkuste to později."
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
  chatHistory: any[] = [],
  attachments: any[] = []
): Promise<UniversalAIResponse> {
  const service = new UniversalAIService();
  return await service.processMessage(message, context, currentPath, userContext, chatHistory, attachments);
}

// Export types
export * from "./types.js";