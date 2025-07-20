import OpenAI from "openai";
import { INVOICE_EXTRACTION_SYSTEM_PROMPT } from './prompts.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractUniversalUpdate(message: string, currentPath?: string): Promise<any> {
  try {
    const systemPrompt = `Analyzuj tento česky text a extrahuj informace pro aktualizaci faktury.

Vrať JSON podle typu změny:

{
  "updateType": "splatnost|ceny|poznamky|zakaznik|platba|mnozstvi|status|obecne",
  "dueDate": "ISO datum pro splatnost (např. 2025-01-31)",
  "notes": "text poznámky",
  "customer": { "email": "nový email zákazníka" },
  "paymentDetails": { 
    "bankAccount": "číslo účtu", 
    "variableSymbol": "variabilní symbol" 
  },
  "items": [{"quantity": "nové množství", "unitPrice": cena, "description": "popis"}],
  "status": "draft|sent|paid|cancelled",
  "pricingItems": [{"productName": "název", "unitPrice": cena}] // jen pro ceny
}

PRAVIDLA ROZPOZNÁVÁNÍ:
- "změň splatnost na 31.1.2025" → {"updateType": "splatnost", "dueDate": "2025-01-31"}
- "prodlouž o 5 dní" → {"updateType": "splatnost", "dueDate": "[aktuální datum + 5 dní]"}
- "poznámka: urgentní" → {"updateType": "poznamky", "notes": "urgentní"}
- "email zákazníka je test@firma.cz" → {"updateType": "zakaznik", "customer": {"email": "test@firma.cz"}}
- "účet 123456789/0800" → {"updateType": "platba", "paymentDetails": {"bankAccount": "123456789/0800"}}
- "variabilní symbol 123" → {"updateType": "platba", "paymentDetails": {"variableSymbol": "123"}}
- "změň množství na 5kg" → {"updateType": "mnozstvi", "items": [{"quantity": "5"}]}
- "kvety 15000, olej 8000" → {"updateType": "ceny", "pricingItems": [{"productName": "kvety", "unitPrice": 15000}, {"productName": "olej", "unitPrice": 8000}]}
- "označ jako zaplaceno" → {"updateType": "status", "status": "paid"}
- "změň na koncept" → {"updateType": "status", "status": "draft"}

DŮLEŽITÉ:
- Pro datum splatnosti vždy použij ISO formát (YYYY-MM-DD)
- Pro "prodlouž o X dní" spočítej nové datum
- Rozpoznej "25k" jako 25000
- Zpracovávej české znaky správně`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    console.log('Universal update extraction result:', result);
    return result;
  } catch (error) {
    console.error('Universal update extraction error:', error);
    throw new Error('Failed to extract update data');
  }
}