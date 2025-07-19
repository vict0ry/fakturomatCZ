// Main AI Service Coordinator - AI-First Approach
import OpenAI from "openai";
import { InvoiceProcessor } from "./invoice-processor.js";
import { UNIVERSAL_AI_SYSTEM_PROMPT } from "./prompts.js";
import type { UniversalAIResponse, UserContext } from "./types.js";

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
      // Use OpenAI for ALL processing - AI-first approach with chat history
      const aiResponse = await this.processWithOpenAI(message, context, currentPath, chatHistory);
      
      // Handle specific actions based on AI decision
      if (aiResponse.action?.type === 'create_invoice_draft') {
        return await this.handleInvoiceCreation(message, userContext);
      }
      
      if (aiResponse.action?.type === 'update_invoice') {
        return await this.handleInvoiceUpdate(message, userContext, currentPath);
      }

      return aiResponse;

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

  private async processWithOpenAI(
    message: string, 
    context: string, 
    currentPath: string,
    chatHistory: any[] = []
  ): Promise<UniversalAIResponse> {
    
    // Enhanced prompt for better Czech language handling and amount parsing
    const enhancedSystemPrompt = `${UNIVERSAL_AI_SYSTEM_PROMPT}

**SPECIÁLNÍ INSTRUKCE:**
- Rozpoznávej české částky: "25k" = "25000", "5k" = "5000" 
- Zpracovávej diakritiku: "příjmy", "výdaje", "měsíc"
- Při chybějících údajích navrhni co doplnit
- Vždy odpovídej česky s využitím kontextu`;

    // Build conversation with chat history
    const messages: any[] = [
      { role: "system", content: enhancedSystemPrompt }
    ];
    
    // Add chat history if available
    if (chatHistory && chatHistory.length > 0) {
      messages.push(...chatHistory);
    }
    
    // Add current message with context
    messages.push({ 
      role: "user", 
      content: `Zpráva: ${message}\nKontext: ${context}\nAktuální stránka: ${currentPath}` 
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages,
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

  private async handleInvoiceUpdate(message: string, userContext: UserContext, currentPath: string): Promise<UniversalAIResponse> {
    try {
      // Extract pricing information from the message
      const pricingData = await this.invoiceProcessor.extractPricingData(message);
      return await this.invoiceProcessor.updateInvoiceWithPricing(pricingData, userContext, currentPath);
    } catch (error) {
      console.error('Invoice update failed:', error);
      return {
        content: "Nepodařilo se aktualizovat fakturu s cenami. Zkuste to prosím znovu nebo upravte fakturu manuálně.",
        action: { type: 'navigate', data: { path: '/invoices' } }
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