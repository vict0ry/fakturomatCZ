// Legacy OpenAI Service - DEPRECATED
// Use server/services/ai/index.ts for new development

import { processUniversalAICommand } from "./ai/index.js";
import type { InvoiceCommand } from "./ai/types.js";
import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

// Legacy function - use UniversalAIService instead
export async function processAICommand(message: string): Promise<{
  response: string;
  command?: InvoiceCommand;
  confidence: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Jste AI asistent pro český fakturační systém. Analyzujte uživatelský požadavek a:
1. Identifikujte akci (create_invoice, search_customer, get_status, other)
2. Extrahujte relevantní informace (název zákazníka, IČO, popis služby, částka)
3. Odpovězte uživateli česky v přátelském tónu
4. Vraťte strukturovaná data ve formátu JSON

Odpovězte JSON ve formátu:
{
  "response": "lidsky čitelná odpověď česky",
  "command": {
    "action": "typ akce",
    "customerName": "název zákazníka pokud uveden",
    "customerIco": "IČO pokud uvedeno",
    "description": "popis služby/produktu",
    "amount": částka jako číslo,
    "currency": "CZK",
    "invoiceType": "invoice"
  },
  "confidence": číslo 0-1 představující jistotu rozpoznání
}`
        },
        {
          role: "user",
          content: message,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      response: result.response || "Omlouváme se, nerozuměl jsem vašemu požadavku.",
      command: result.command,
      confidence: Math.max(0, Math.min(1, result.confidence || 0)),
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      response: "Omlouváme se, došlo k chybě při zpracování vašeho požadavku.",
      confidence: 0,
    };
  }
}

// Re-export new service for backwards compatibility
export { processUniversalAICommand };
export type { InvoiceCommand };