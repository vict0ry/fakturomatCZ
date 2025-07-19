// Main AI Service Coordinator
import OpenAI from "openai";
import { InvoiceProcessor } from "./invoice-processor.js";
import { NavigationHandler } from "./navigation-handler.js";
import { UNIVERSAL_AI_SYSTEM_PROMPT } from "./prompts.js";
import type { UniversalAIResponse, UserContext } from "./types.js";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class UniversalAIService {
  private invoiceProcessor = new InvoiceProcessor();
  private navigationHandler = new NavigationHandler();

  async processMessage(
    message: string, 
    context: string, 
    currentPath: string, 
    userContext: UserContext
  ): Promise<UniversalAIResponse> {
    
    try {
      // First, try specific handlers for common actions
      const quickResponse = this.tryQuickHandlers(message, currentPath);
      if (quickResponse) return quickResponse;

      // Use OpenAI for complex processing
      const aiResponse = await this.processWithOpenAI(message, context, currentPath);
      
      // Handle specific actions
      if (aiResponse.action?.type === 'create_invoice_draft') {
        return await this.handleInvoiceCreation(message, userContext);
      }

      return aiResponse;

    } catch (error) {
      console.error('AI processing error:', error);
      return {
        content: "Omlouváme se, došlo k neočekávané chybě. Zkuste to prosím znovu nebo kontaktujte podporu.",
      };
    }
  }

  private tryQuickHandlers(message: string, currentPath: string): UniversalAIResponse | null {
    // Try navigation first
    const navResponse = this.navigationHandler.handleNavigation(message);
    if (navResponse) return navResponse;

    // Try search
    const searchResponse = this.navigationHandler.handleSearch(message);
    if (searchResponse) return searchResponse;

    // Try status updates
    const statusResponse = this.navigationHandler.handleStatusUpdate(message);
    if (statusResponse) return statusResponse;

    // Try help
    const helpResponse = this.navigationHandler.handleHelp(message);
    if (helpResponse) return helpResponse;

    // Try context-specific responses
    if (message.toLowerCase().includes('co je') || message.toLowerCase().includes('kde jsem')) {
      return {
        content: this.navigationHandler.getContextualResponse(currentPath)
      };
    }

    return null;
  }

  private async processWithOpenAI(
    message: string, 
    context: string, 
    currentPath: string
  ): Promise<UniversalAIResponse> {
    
    // Enhanced prompt for better Czech language handling and amount parsing
    const enhancedSystemPrompt = `${UNIVERSAL_AI_SYSTEM_PROMPT}

**SPECIÁLNÍ INSTRUKCE:**
- Rozpoznávej české částky: "25k" = "25000", "5k" = "5000" 
- Zpracovávej diakritiku: "příjmy", "výdaje", "měsíc"
- Při chybějících údajích navrhni co doplnit
- Vždy odpovídej česky s využitím kontextu`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: enhancedSystemPrompt },
        { 
          role: "user", 
          content: `Zpráva: ${message}\nKontext: ${context}\nAktuální stránka: ${currentPath}` 
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{"content": "Nepodařilo se zpracovat požadavek."}');
  }

  private async handleInvoiceCreation(message: string, userContext: UserContext): Promise<UniversalAIResponse> {
    try {
      const invoiceData = await this.invoiceProcessor.extractInvoiceData(message);
      return await this.invoiceProcessor.createInvoiceDraft(invoiceData, userContext);
    } catch (error) {
      console.error('Invoice creation failed:', error);
      return {
        content: "Nepodařilo se vytvořit fakturu. Zkuste zadat příkaz znovu s názvem zákazníka a popisem služby.",
        action: { type: 'navigate', data: { path: '/invoices/new' } }
      };
    }
  }
}

// Legacy export for backwards compatibility
export async function processUniversalAICommand(
  message: string, 
  context: string, 
  currentPath: string, 
  userContext: UserContext
): Promise<UniversalAIResponse> {
  const service = new UniversalAIService();
  return await service.processMessage(message, context, currentPath, userContext);
}

// Export types
export * from "./types.js";