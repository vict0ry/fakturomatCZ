import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

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