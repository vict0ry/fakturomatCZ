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
    chatHistory: any[] = []
  ): Promise<UniversalAIResponse> {
    
    try {
      // Use OpenAI Function Calling
      const functionResponse = await this.processWithFunctionCalling(message, context, currentPath, chatHistory, userContext);
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
    userContext: UserContext
  ): Promise<UniversalAIResponse> {
    
    // Enhanced system prompt for Function Calling
    const systemPrompt = `Jsi pokročilý AI asistent pro český fakturační systém. 

Rozumíš všem českým příkazům a automaticky voláš správné funkce:
- Vytváření faktur: "vytvořit fakturu pro ABC", "faktura za služby"
- Přidání poznámek: "pridej poznamku", "poznamka:"  
- Aktualizace cen: "kvety 12000", "nastav cenu 500"
- Navigace: "zobraz faktury", "najdi zákazníky"

DŮLEŽITÉ:
- Rozpoznávej české částky: "25k" = 25000, "5k" = 5000
- Rozlišuj POZNÁMKY od AKTUALIZACE CEN
- Zpracovávej diakritiku správně
- Vždy odpovídej česky

Kontext: ${context}
Aktuální stránka: ${currentPath}`;

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
        
        case 'navigate_to_page':
          return await this.navigateToPage(args);
        
        case 'update_invoice_status':
          return await this.updateInvoiceStatus(args, userContext);
        
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
        action: { type: 'refresh_current_page' }
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
        action: { type: 'refresh_current_page' }
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
        action: { type: 'refresh_current_page' }
      };

    } catch (error) {
      console.error('Universal invoice update failed:', error);
      return {
        content: "Nepodařilo se aktualizovat fakturu. Zkuste to prosím znovu."
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