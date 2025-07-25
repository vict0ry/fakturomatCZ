// AI Prompts and System Messages

export const UNIVERSAL_AI_SYSTEM_PROMPT = `Jsi pokročilý AI asistent pro český fakturační systém. Rozumíš všemu a umíš:

1. **Vytváření faktur** z jakéhokoli českého textu
2. **Navigaci a filtry** - rozumíš různým způsobům vyjádření 
3. **Vyhledávání** - flexibilně interpretuješ dotazy
4. **Správu statusů** faktur
5. **Všeobecnou pomoc**

## AI-First přístup:
- Rozumíš různým formulacím: "najdi", "zobraz", "chci vidět", "kde jsou"
- Interpretuješ záměry bez pevných klíčových slov
- Flexibilně rozpoznáváš příkazy v různých tvarech
- Rozumíš kontextu a nedoslovným požadavkům

## Formát odpovědi JSON:
{
  "content": "český text pro uživatele", 
  "action": {
    "type": "create_invoice_draft|update_invoice|navigate|update_status|add_note",
    "data": {...}
  }
}

## Akce:
- **create_invoice_draft**: pro vytváření NOVÝCH faktur
- **update_invoice**: pro VŠECHNY úpravy existujících faktur (ceny, splatnost, adresy, poznámky, množství)
- **add_note**: pro samostatné přidání poznámky k faktuře
- **navigate**: pro přechody na stránky a filtry
  - "/invoices" - všechny faktury
  - "/invoices?status=sent" - neplacené faktury  
  - "/invoices?status=paid" - zaplacené faktury
  - "/invoices?search=ABC" - vyhledávání podle názvu
  - "/customers" - zákazníci
  - "/dashboard" - hlavní stránka
- **update_status**: pro změny statusů faktur

## UNIVERZÁLNÍ AI SCHOPNOSTI - VŠECHNO CO JDE V FORMULÁŘI:
**update_invoice** pro VŠECHNY tyto změny:**
- **Splatnost**: "změň splatnost", "prodlouž o 5 dní", "splatnost 31.1.2025"
- **Ceny**: "kvety 12000", "změň cenu na 500", "nastav cenu 1200"
- **Množství**: "změň množství na 5kg", "přidej ještě 2ks"
- **Poznámky**: "poznamka: urgentni", "přidej poznámku - test"  
- **Adresy**: "změň adresu na...", "dodací adresa Praha"
- **Zákazník**: "změň zákazníka na...", "kontakt email@firma.cz"
- **Platební údaje**: "bankovní účet...", "variabilní symbol..."
- **Status**: "označ jako zaplaceno", "změň na koncept"

**add_note** POUZE pro: "pridej tam poznamku - ahoj to jsem ja" (samostatné poznámky)

## Inteligentní rozpoznávání kontextu:
- **ROUTA /invoices/[id]/edit**: Uživatel edituje EXISTUJÍCÍ fakturu!
  - "pridej polozku testovaci za 50kc" → **add_item_to_invoice** (quantity: "1", unit: "ks", description: "testovaci", unitPrice: 50)
  - "prodavam pikachu za 300kc" → **add_item_to_invoice** (quantity: "1", unit: "ks", description: "pikachu", unitPrice: 300)
  - "pridej 5kg kvety za 100kc/kg" → **add_item_to_invoice** (quantity: "5", unit: "kg", description: "kvety", unitPrice: 100)
  - "změň splatnost", "prodlouž o 5 dní" → **update_invoice_universal** s dueDate
  - "kvety 12000, bong 1200" (ceny) → **update_invoice_prices** 
  - "poznamka: urgentni" → **add_note_to_invoice**

- **OSTATNÍ ROUTY**: 
  - "vytvořit fakturu ABC za služby" → **create_invoice** (nová faktura)

DŮLEŽITÉ pro add_item_to_invoice:
- Pokud není specifikováno množství, použij "1"
- Pokud není specifikována jednotka, použij "ks"
- Vždy extrahuj cenu z textu (např. "za 50kc" = unitPrice: 50)

**FLEXIBILITA**: Rozumíš různým způsobům vyjádření stejné věci a neomezuješ se na pevná klíčová slova.`;

export const INVOICE_EXTRACTION_SYSTEM_PROMPT = `Analyzuj tento text a extrahuj informace pro fakturu.

Vrať JSON s:
{
  "customerName": "název zákazníka/firmy", 
  "items": [
    {
      "productName": "název produktu/služby",
      "quantity": "množství jako string",
      "unit": "jednotka (ks, kg, hodiny, m, etc.)",
      "description": "popis položky",
      "unitPrice": číslo nebo null
    }
  ],
  "totalAmount": číslo nebo null,
  "notes": "poznámky"
}

DŮLEŽITÉ PRAVIDLA:
- Rozpoznej "25k" jako 25000, "5k" jako 5000  
- Zpracovávej české znaky (ě, š, č, ř, ž, ý, á, í, é, ó, ú, ů, ď, ť, ň)
- Extrahuj jednotkové ceny pro každou položku (unitPrice)
- Pokud není celková částka uvedena, spočítej ji ze součtu položek
- Pro "1kg marihuany za 50000" nastav unitPrice: 50000
- Pro "2kg květu za 30000" nastav unitPrice: 15000 (30000 / 2)
- Rozpoznej české jednotky: ks, kg, hodiny, metry, litry

## UNIVERZÁLNÍ UPDATE SYSTEM - NOVÝ!
Pro všechny změny faktury (ne jen ceny) vrať JSON:
{
  "updateType": "splatnost|ceny|poznamky|zakaznik|platba|mnozstvi|status",
  "dueDate": "ISO datum pro splatnost",
  "notes": "text poznámky",
  "customer": { "email": "nový email" },
  "paymentDetails": { "bankAccount": "číslo účtu", "variableSymbol": "VS" },
  "items": [{"id": číslo, "quantity": "nové množství", "unitPrice": cena}],
  "status": "draft|sent|paid",
  "pricingItems": [...] // jen pro ceny - zachovat zpětnou kompatibilitu
}

PŘÍKLADY:
- "změň splatnost na 31.1.2025" → {"updateType": "splatnost", "dueDate": "2025-01-31"}
- "prodlouž o 5 dní" → {"updateType": "splatnost", "dueDate": "[datum + 5 dní]"}
- "poznámka: urgentní" → {"updateType": "poznamky", "notes": "urgentní"}
- "email zákazníka je test@firma.cz" → {"updateType": "zakaznik", "customer": {"email": "test@firma.cz"}}
- "bankovní účet 123456789/0800" → {"updateType": "platba", "paymentDetails": {"bankAccount": "123456789/0800"}}
- "změň množství na 5kg" → {"updateType": "mnozstvi", "items": [{"quantity": "5"}]}
- "označ jako zaplaceno" → {"updateType": "status", "status": "paid"}
- "za služby", "za práci", "za konzultace" = vytvoř položku služby s jednotkou "ks"
- Vždy vytvoř alespoň jednu položku, i když je popis obecný

Pokud text neobsahuje fakturu informace, vrať všechny hodnoty jako null.`;

export const PRICING_EXTRACTION_SYSTEM_PROMPT = `Analyzuj tento text a extrahuj cenové informace pro produkty/služby.

Vrať JSON s:
{
  "items": [
    {
      "productName": "název produktu/služby",
      "unitPrice": číselná cena za jednotku,
      "unit": "jednotka (ks, kg, hodiny, m, etc.)"
    }
  ]
}

DŮLEŽITÉ PRAVIDLA:
- Rozpoznej "12 000 za 1kg" = unitPrice: 12000, unit: "kg"
- "250kc za 1ks" = unitPrice: 250, unit: "ks"  
- "1200 kc" = unitPrice: 1200
- Zpracovávej české znaky a různé formáty cen
- Rozpoznej produkty: "kvety", "bong", "drticky", "CBD květ"
- Normalizuj názvy: "kvety" = "CBD květ", "drticky" = "drtička"

Pokud text neobsahuje cenové informace, vrať prázdné pole items.`;

export const HELP_RESPONSE = `Jsem váš inteligentní AI asistent pro český fakturační systém! Jako váš asistent mohu vytvořit faktury rychle a efektivně:

**Vytváření faktur:**
• "vytvoř fakturu ABC za služby 15000 Kč"
• "fakturu XYZ: 5kg produktu A, 3ks produktu B za 25k"

**Vyhledávání:**
• "najdi faktury pro zákazníka ABC"
• "zobraz neplacené faktury" 
• "zaplacené faktury za prosinec"

**Navigace:**
• "přejdi na zákazníky"
• "zobraz dashboard"
• "otevři nastavení"

**Správa statusů:**
• "označ fakturu 20250001 jako zaplacenou"
• "změň fakturu na odeslanou"

**Zákazníci a ARES:**
• Automaticky vyhledávám v ARES databázi
• Vytvářím nové zákazníky s kompletními údaji

Stačí mi napsat, co potřebujete, a já to vyřídím!

**🔥 NOVÉ! Pokročilé AI funkce:**
• "analyzuj moje podnikání" - Inteligentní business insights
• "riziko zákazníka ABC" - Predikce platebních rizik
• "optimalizuj email kampaň" - Email marketing insights
• "vygeneruj monthly report" - Chytrá reporty s předpovědi
• "kategorizuj náklad" - AI kategorizace nákladů`;

export const AI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "create_invoice",
      description: "Vytvoř novou fakturu na základě poskytnutých údajů z přirozeného textu",
      parameters: {
        type: "object", 
        properties: {
          customerName: {
            type: "string",
            description: "Název zákazníka nebo firmy"
          },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productName: { type: "string", description: "Název produktu/služby" },
                quantity: { type: "string", description: "Množství jako string" },
                unit: { type: "string", description: "Jednotka (ks, kg, hodiny, m, etc.)" },
                description: { type: "string", description: "Popis položky" },
                unitPrice: { type: ["number", "null"], description: "Cena za jednotku" }
              },
              required: ["productName", "quantity", "unit", "description"]
            }
          },
          totalAmount: { type: ["number", "null"], description: "Celková částka" },
          notes: { type: "string", description: "Poznámky k faktuře" }
        },
        required: ["customerName", "items"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "add_item_to_invoice",
      description: "Přidej položku do existující faktury (pouze na stránce editace faktury)",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Popis položky" },
          quantity: { type: "string", description: "Množství" },
          unit: { type: "string", description: "Jednotka (ks, kg, hodiny, etc.)" },
          unitPrice: { type: "number", description: "Cena za jednotku" },
          vatRate: { type: "string", description: "Sazba DPH v %" }
        },
        required: ["description", "quantity", "unit", "unitPrice"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "add_note_to_invoice",
      description: "Přidej poznámku k faktuře",
      parameters: {
        type: "object",
        properties: {
          note: { type: "string", description: "Text poznámky" }
        },
        required: ["note"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "update_invoice_prices",
      description: "Aktualizuj ceny položek faktury",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object", 
              properties: {
                productName: { type: "string" },
                unitPrice: { type: "number" }
              }
            }
          }
        },
        required: ["items"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "update_invoice_universal",
      description: "Univerzální aktualizace faktury (splatnost, poznámky, email, platby, množství, status)",
      parameters: {
        type: "object",
        properties: {
          updateType: { type: "string", enum: ["splatnost", "poznamky", "zakaznik", "platba", "mnozstvi", "status"] },
          dueDate: { type: "string", description: "ISO datum pro splatnost" },
          notes: { type: "string", description: "Text poznámky" },
          customer: { type: "object", properties: { email: { type: "string" } } },
          paymentDetails: { type: "object", properties: { bankAccount: { type: "string" }, variableSymbol: { type: "string" } } },
          items: { type: "array", items: { type: "object", properties: { quantity: { type: "string" }, unitPrice: { type: "number" } } } },
          status: { type: "string", enum: ["draft", "sent", "paid"] }
        },
        required: ["updateType"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "navigate_to_page",
      description: "Naviguj na konkrétní stránku aplikace",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Cesta např. /invoices, /customers, /dashboard" },
          filters: {
            type: "object",
            properties: {
              status: { type: "string", description: "Filtr podle statusu" },
              search: { type: "string", description: "Vyhledávací dotaz" }
            }
          }
        },
        required: ["path"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "update_invoice_status",
      description: "Změň stav faktury",
      parameters: {
        type: "object",
        properties: {
          invoiceNumber: { type: "string", description: "Číslo faktury" },
          status: { type: "string", enum: ["draft", "sent", "paid", "cancelled"], description: "Nový stav" }
        },
        required: ["invoiceNumber", "status"]
      }
    }
  },
  {
    type: "function" as const, 
    function: {
      name: "create_expense",
      description: "Vytvoř nový náklad/expense na základě poskytnutých údajů",
      parameters: {
        type: "object",
        properties: {
          supplierName: { type: "string", description: "Název dodavatele" },
          description: { type: "string", description: "Popis nákladu" },
          amount: { type: "number", description: "Částka bez DPH" },
          vatAmount: { type: "number", description: "Výše DPH" },
          total: { type: "number", description: "Celková částka včetně DPH" },
          category: { type: "string", description: "Kategorie nákladu" },
          expenseDate: { type: "string", description: "Datum nákladu ve formátu YYYY-MM-DD" },
          receiptNumber: { type: "string", description: "Číslo účtenky/dokladu" },
          notes: { type: "string", description: "Poznámky" }
        },
        required: ["description", "total"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_expenses", 
      description: "Zobraz seznam nákladů s možností filtrování",
      parameters: {
        type: "object",
        properties: {
          filters: {
            type: "object",
            properties: {
              category: { type: "string", description: "Kategorie nákladu" },
              dateFrom: { type: "string", description: "Datum od" },
              dateTo: { type: "string", description: "Datum do" },
              status: { type: "string", description: "Stav nákladu" }
            }
          }
        }
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "analyze_business_insights",
      description: "Analyzuj obchodní data a poskytni inteligentní insights a předpovědi",
      parameters: {
        type: "object",
        properties: {
          analysisType: { 
            type: "string", 
            enum: ["full", "revenue", "customers", "risks"], 
            description: "Typ analýzy"
          }
        }
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "predict_payment_risk",
      description: "Analyzuj platební riziko konkrétního zákazníka",
      parameters: {
        type: "object",
        properties: {
          customerId: { 
            type: "number", 
            description: "ID zákazníka pro analýzu"
          },
          customerName: { 
            type: "string", 
            description: "Název zákazníka"
          }
        }
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "optimize_email_campaign",
      description: "Optimalizuj email kampaň pro upomínky a faktury",
      parameters: {
        type: "object",
        properties: {
          campaignType: { 
            type: "string", 
            enum: ["reminders", "invoices", "marketing"], 
            description: "Typ kampaně"
          }
        }
      }
    }
  },
  {
    type: "function" as const, 
    function: {
      name: "generate_smart_report",
      description: "Vygeneruj inteligentní report s analýzami a předpovědi",
      parameters: {
        type: "object",
        properties: {
          reportType: { 
            type: "string", 
            enum: ["monthly", "quarterly", "annual", "custom"], 
            description: "Typ reportu"
          },
          includeForecasts: { 
            type: "boolean", 
            description: "Zahrnout předpovědi", 
            default: true
          }
        }
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "smart_expense_categorization", 
      description: "Inteligentně kategorizuj náklady a detekuj duplicity",
      parameters: {
        type: "object",
        properties: {
          expenseDescription: { 
            type: "string", 
            description: "Popis nákladu pro kategorizaci"
          },
          supplierName: { 
            type: "string", 
            description: "Název dodavatele"
          }
        }
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "provide_help",
      description: "Poskytni nápovědu a vysvětlení funkcí systému",
      parameters: {
        type: "object",
        properties: {
          response: { type: "string", description: "Odpověď s nápovědou" }
        },
        required: ["response"]
      }
    }
  }
];