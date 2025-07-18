import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface InvoiceCommand {
  action: "create_invoice" | "search_customer" | "get_status" | "other";
  customerName?: string;
  customerIco?: string;
  description?: string;
  amount?: number;
  currency?: string;
  invoiceType?: "invoice" | "proforma" | "credit_note";
}

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

export async function processUniversalAICommand(
  message: string, 
  context: string, 
  currentPath: string, 
  companyId: number, 
  userId: number
): Promise<{
  content: string;
  action?: {
    type: 'navigate' | 'search' | 'create_invoice' | 'fill_form';
    data: any;
  };
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Jste pokročilý AI asistent pro český fakturační systém. Analyzujte uživatelský požadavek a:

1. Rozpoznejte záměr:
   - Navigace: "zobraz faktury", "jdi na dashboard", "přejdi na zákazníky"
   - Vyhledávání: "najdi faktury od CreativeLand", "zobraz neplacené faktury", "najdi zákazníka s IČO"
   - Vytvoření: "vytvoř fakturu pro XYZ", "pridej zákazníka", "nová faktura"
   - Obecné dotazy: "jak funguje systém", "nápověda"

2. Extrahujte relevantní informace:
   - Názvy firem, IČO, částky
   - Časová období (měsíc, rok, datum)
   - Stavy faktur (neplacené, zaplacené, po splatnosti)
   - Typy dokumentů (faktura, proforma, dobropis)

3. Určete akci:
   - navigate: přesměrování na jinou stránku
   - search: vyhledávání s filtry
   - create_invoice: vytvoření faktury s předvyplněnými daty
   - fill_form: vyplnění formuláře (jen pro registraci)

Kontext: ${context}
Aktuální stránka: ${currentPath}

Odpovězte JSON ve formátu:
{
  "content": "lidsky čitelná odpověď česky",
  "action": {
    "type": "typ akce",
    "data": {
      "path": "/cílová/cesta",
      "filters": {"parametr": "hodnota"},
      "formData": {"pole": "hodnota"}
    }
  }
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
      content: result.content || "Nerozuměl jsem vašemu požadavku. Zkuste to prosím znovu.",
      action: result.action
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      content: "Omlouváme se, došlo k chybě při zpracování vašeho požadavku."
    };
  }
}

export async function processPublicAICommand(
  message: string, 
  context: string
): Promise<{
  content: string;
  action?: {
    type: 'fill_form' | 'navigate';
    data: any;
  };
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Jste AI asistent pro registraci do českého fakturačního systému. Analyzujte uživatelský požadavek a:

1. Pokud uživatel zadá email a IČO, vyhledejte data firmy z ARES
2. Připravte předvyplnění registračního formuláře
3. Pomozte s přihlášením nebo přesměrováním na registraci

Kontext: ${context}

Pokud uživatel zadá IČO (8 číslic), připravte akci fill_form s daty pro automatické vyplnění.

Odpovězte JSON ve formátu:
{
  "content": "lidsky čitelná odpověď česky",
  "action": {
    "type": "fill_form",
    "data": {
      "ico": "IČO firmy",
      "email": "email uživatele",
      "autoFetch": true
    }
  }
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
      content: result.content || "Pomohu vám s registrací. Zadejte email a IČO vaší firmy.",
      action: result.action
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      content: "Omlouváme se, došlo k chybě při zpracování vašeho požadavku."
    };
  }
}

export async function generateInvoiceDescription(customerName: string, amount: number): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Vygenerujte stručný a profesionální popis pro fakturu v češtině. Odpovězte pouze popisem bez dalšího textu."
        },
        {
          role: "user",
          content: `Zákazník: ${customerName}, Částka: ${amount} Kč`
        },
      ],
    });

    return response.choices[0].message.content || "Poskytnuté služby";
  } catch (error) {
    console.error("OpenAI description generation error:", error);
    return "Poskytnuté služby";
  }
}
