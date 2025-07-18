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
  userContext: {
    companyId: number;
    userId: number;
    storage: any;
  }
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
          content: `Jste pokročilý AI asistent pro český fakturační systém. Umíte vše - od vytváření faktur po analýzu neplatičů. Analyzujte uživatelský požadavek a:

1. ANALÝZA A REPORTING:
   - "největší neplatiči", "kdo mi dluží", "přehled pohledávek"
   - "nejvíce faktur", "nejlepší zákazníci", "statistiky"
   - "faktury za měsíc/rok", "tržby", "DPH přehledy"

2. VYHLEDÁVÁNÍ A FILTRY:
   - "najdi faktury od CreativeLand", "zobraz neplacené faktury"
   - "faktury po splatnosti", "faktury z prosince"
   - "hledej podle IČO", "najdi zákazníka XYZ"

3. VYTVÁŘENÍ DOKUMENTŮ:
   - "vytvoř fakturu pro XYZ za 5000 Kč"
   - "nová proforma", "vytvořit dobropis"
   - "přidej zákazníka s IČO", "nový zákazník"

4. SPRÁVA A AKCE:
   - "označ jako zaplaceno", "pošli připomínku"
   - "stáhni PDF", "duplikuj fakturu"
   - "změň stav na", "aktualizuj údaje"

5. NAVIGACE A NÁPOVĚDA:
   - "jdi na dashboard", "zobraz zákazníky"
   - "jak funguje systém", "nápověda"

Kontext: ${context}
Aktuální stránka: ${currentPath}

Odpovězte JSON ve formátu:
{
  "content": "lidsky čitelná odpověď česky",
  "action": {
    "type": "navigate|search|create_invoice|create_customer|analytics|update_status|send_reminder",
    "data": {
      "path": "/cílová/cesta",
      "filters": {"parametr": "hodnota"},
      "formData": {"pole": "hodnota"},
      "query": "vyhledávací dotaz",
      "reportType": "typ reportu"
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

    // ANALYTICS AND REPORTING
    if (result.action?.type === 'analytics' || 
        message.toLowerCase().includes('největší neplatiči') ||
        message.toLowerCase().includes('kdo mi dluží') ||
        message.toLowerCase().includes('přehled pohledávek') ||
        message.toLowerCase().includes('statistiky') ||
        message.toLowerCase().includes('nejlepší zákazníci')) {
      
      try {
        const allInvoices = await userContext.storage.getCompanyInvoices(userContext.companyId);
        const customers = await userContext.storage.getCompanyCustomers(userContext.companyId);
        
        if (message.toLowerCase().includes('největší neplatiči') || message.toLowerCase().includes('kdo mi dluží')) {
          // Analyze unpaid invoices by customer
          const unpaidByCustomer = new Map();
          
          allInvoices
            .filter(invoice => invoice.status === 'overdue' || invoice.status === 'sent')
            .forEach(invoice => {
              const customer = customers.find(c => c.id === invoice.customerId);
              const customerName = customer?.name || 'Neznámý zákazník';
              const currentDebt = unpaidByCustomer.get(customerName) || 0;
              unpaidByCustomer.set(customerName, currentDebt + parseInt(invoice.total));
            });
          
          const debtorsList = Array.from(unpaidByCustomer.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
          
          if (debtorsList.length === 0) {
            return {
              content: "🎉 Skvělé! Momentálně nemáte žádné neplacené faktury. Všichni zákazníci jsou ve stavu placeno.",
              action: { type: 'navigate', data: { path: '/invoices?status=paid' } }
            };
          }
          
          const totalDebt = debtorsList.reduce((sum, [, amount]) => sum + amount, 0);
          const debtorsText = debtorsList.map(([name, amount], index) => 
            `${index + 1}. ${name}: ${amount.toLocaleString('cs-CZ')} Kč`
          ).join('\n');
          
          return {
            content: `💰 Přehled největších neplatičů:\n\n${debtorsText}\n\n📊 Celková pohledávka: ${totalDebt.toLocaleString('cs-CZ')} Kč\n\nDoporučuji poslat připomínky nejvyšším dlužníkům.`,
            action: { type: 'navigate', data: { path: '/invoices?status=overdue' } }
          };
        }
        
        if (message.toLowerCase().includes('nejlepší zákazníci') || message.toLowerCase().includes('statistiky')) {
          // Analyze paid invoices by customer
          const revenueByCustomer = new Map();
          const invoiceCountByCustomer = new Map();
          
          allInvoices
            .filter(invoice => invoice.status === 'paid')
            .forEach(invoice => {
              const customer = customers.find(c => c.id === invoice.customerId);
              const customerName = customer?.name || 'Neznámý zákazník';
              const currentRevenue = revenueByCustomer.get(customerName) || 0;
              const currentCount = invoiceCountByCustomer.get(customerName) || 0;
              revenueByCustomer.set(customerName, currentRevenue + parseInt(invoice.total));
              invoiceCountByCustomer.set(customerName, currentCount + 1);
            });
          
          const topCustomers = Array.from(revenueByCustomer.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
          
          const totalRevenue = Array.from(revenueByCustomer.values()).reduce((sum, val) => sum + val, 0);
          const topCustomersText = topCustomers.map(([name, revenue], index) => {
            const count = invoiceCountByCustomer.get(name);
            return `${index + 1}. ${name}: ${revenue.toLocaleString('cs-CZ')} Kč (${count} faktur)`;
          }).join('\n');
          
          return {
            content: `🏆 TOP 5 nejlepších zákazníků:\n\n${topCustomersText}\n\n📈 Celkové tržby: ${totalRevenue.toLocaleString('cs-CZ')} Kč\n💼 Celkem faktur: ${allInvoices.filter(i => i.status === 'paid').length}`,
            action: { type: 'navigate', data: { path: '/customers' } }
          };
        }
      } catch (error) {
        console.error('Analytics error:', error);
        return {
          content: "Omlouváme se, nepodařilo se načíst analytická data. Zkuste to prosím znovu.",
          action: { type: 'navigate', data: { path: '/dashboard' } }
        };
      }
    }

    // CUSTOMER CREATION
    if (result.action?.type === 'create_customer' || 
        (message.toLowerCase().includes('přidej zákazník') || 
         message.toLowerCase().includes('nový zákazník') || 
         message.toLowerCase().includes('vytvoř zákazník'))) {
      
      try {
        // Extract company info from message
        const icoMatch = message.match(/(?:IČO|ico)\s*:?\s*(\d{8})/i);
        const companyMatch = message.match(/(?:zákazník|firmu|společnost)\s+([A-Za-z\s\.&,]+)(?:\s+s\.r\.o\.|\s+a\.s\.|\s+s\.p\.|$)/i);
        
        if (icoMatch) {
          const ico = icoMatch[1];
          const { fetchCompanyFromAres } = await import('./ares');
          const aresData = await fetchCompanyFromAres(ico);
          
          if (aresData) {
            const newCustomer = await userContext.storage.createCustomer({
              name: aresData.name,
              ico: aresData.ico,
              dic: aresData.dic,
              email: '',
              address: aresData.address,
              city: aresData.city,
              postalCode: aresData.postalCode,
              companyId: userContext.companyId
            });
            
            return {
              content: `✅ Zákazník byl úspěšně vytvořen z ARES:\n\n• Název: ${aresData.name}\n• IČO: ${aresData.ico}\n• DIČ: ${aresData.dic}\n• Adresa: ${aresData.address}, ${aresData.city} ${aresData.postalCode}\n\nZákazník je připraven pro vytváření faktur.`,
              action: { type: 'navigate', data: { path: `/customers` } }
            };
          }
        }
        
        if (companyMatch) {
          const companyName = companyMatch[1].trim();
          const newCustomer = await userContext.storage.createCustomer({
            name: companyName,
            ico: '',
            dic: '',
            email: '',
            address: '',
            city: '',
            postalCode: '',
            companyId: userContext.companyId
          });
          
          return {
            content: `✅ Zákazník "${companyName}" byl vytvořen.\n\nMůžete později doplnit IČO, DIČ a kontaktní údaje v seznamu zákazníků.`,
            action: { type: 'navigate', data: { path: `/customers` } }
          };
        }
        
        return {
          content: "Pro vytvoření zákazníka zadejte například:\n• 'Přidej zákazníka s IČO 27074358'\n• 'Nový zákazník CreativeLand s.r.o.'\n• 'Vytvoř zákazníka Apple Inc.'",
          action: { type: 'navigate', data: { path: '/customers' } }
        };
        
      } catch (error) {
        console.error('Customer creation error:', error);
        return {
          content: "Nepodařilo se vytvořit zákazníka. Zkuste to prosím znovu nebo použijte formulář.",
          action: { type: 'navigate', data: { path: '/customers' } }
        };
      }
    }

    // SEARCH AND FILTERING
    if (result.action?.type === 'search' || 
        message.toLowerCase().includes('najdi') || 
        message.toLowerCase().includes('hledej') ||
        message.toLowerCase().includes('zobraz')) {
      
      try {
        // Search invoices by customer name
        const customerMatch = message.match(/(?:od|od\s+)([A-Za-z\s\.&,]+?)(?:\s|$)/i);
        if (customerMatch) {
          const customerName = customerMatch[1].trim();
          const customers = await userContext.storage.searchCustomers(customerName, userContext.companyId);
          
          if (customers.length > 0) {
            const allInvoices = await userContext.storage.getCompanyInvoices(userContext.companyId);
            const customerInvoices = allInvoices.filter(invoice => 
              customers.some(customer => customer.id === invoice.customerId)
            );
            
            if (customerInvoices.length > 0) {
              const totalAmount = customerInvoices.reduce((sum, inv) => sum + parseInt(inv.total), 0);
              const paidCount = customerInvoices.filter(inv => inv.status === 'paid').length;
              const unpaidCount = customerInvoices.length - paidCount;
              
              return {
                content: `🔍 Nalezeno ${customerInvoices.length} faktur pro "${customerName}":\n\n📊 Celková částka: ${totalAmount.toLocaleString('cs-CZ')} Kč\n✅ Zaplaceno: ${paidCount} faktur\n⏳ Nezaplaceno: ${unpaidCount} faktur\n\nKliknutím zobrazíte všechny faktury.`,
                action: { type: 'navigate', data: { path: `/invoices?customer=${encodeURIComponent(customerName)}` } }
              };
            }
          }
          
          return {
            content: `❌ Nenalezeny žádné faktury pro "${customerName}". Zkuste jiný název nebo zkontrolujte správnost názvu zákazníka.`,
            action: { type: 'navigate', data: { path: '/invoices' } }
          };
        }
        
        // Search by status
        if (message.toLowerCase().includes('neplacené') || message.toLowerCase().includes('nezaplacené')) {
          return {
            content: "📋 Zobrazuji neplacené faktury...",
            action: { type: 'navigate', data: { path: '/invoices?status=sent' } }
          };
        }
        
        if (message.toLowerCase().includes('po splatnosti')) {
          return {
            content: "⚠️ Zobrazuji faktury po splatnosti...",
            action: { type: 'navigate', data: { path: '/invoices?status=overdue' } }
          };
        }
        
        if (message.toLowerCase().includes('zaplacené') || message.toLowerCase().includes('uhrazené')) {
          return {
            content: "✅ Zobrazuji zaplacené faktury...",
            action: { type: 'navigate', data: { path: '/invoices?status=paid' } }
          };
        }
        
      } catch (error) {
        console.error('Search error:', error);
        return {
          content: "Nepodařilo se vyhledat. Zkuste to prosím znovu.",
          action: { type: 'navigate', data: { path: '/invoices' } }
        };
      }
    }

    // Handle invoice creation with AI assistance
    if (result.action?.type === 'create_invoice' && message.toLowerCase().includes('faktur')) {
      try {
        // Extract company/customer info from message
        const companyMatch = message.match(/pro\s+([\w\s\.&,]+?)(?:\s+za|\s+s\.r\.o\.|\s+s\.p\.|\s+a\.s\.)/i);
        const amountMatch = message.match(/(\d+(?:\s?\d{3})*)\s*(?:kč|czk|korun)/i);
        const serviceMatch = message.match(/za\s+([\w\s]+?)(?:\s+za|\s+\d+|$)/i);

        if (companyMatch && amountMatch) {
          const companyName = companyMatch[1].trim();
          const amount = parseInt(amountMatch[1].replace(/\s/g, ''));
          const service = serviceMatch ? serviceMatch[1].trim() : 'Služby';

          // Try to find existing customer first
          const customers = await userContext.storage.searchCustomers(companyName, userContext.companyId);
          let customerId;

          if (customers.length > 0) {
            customerId = customers[0].id;
          } else {
            // Search ARES for company info
            const { fetchCompanyFromAres } = await import('./ares');
            let aresData = null;
            
            // Try to extract ICO from company name or search by name
            const icoMatch = companyName.match(/\d{8}/);
            if (icoMatch) {
              aresData = await fetchCompanyFromAres(icoMatch[0]);
            }

            if (aresData) {
              // Create customer from ARES data
              const newCustomer = await userContext.storage.createCustomer({
                name: aresData.name,
                ico: aresData.ico,
                dic: aresData.dic,
                email: '',
                address: aresData.address,
                city: aresData.city,
                postalCode: aresData.postalCode,
                companyId: userContext.companyId
              });
              customerId = newCustomer.id;
            } else {
              // Create basic customer
              const newCustomer = await userContext.storage.createCustomer({
                name: companyName,
                ico: '',
                dic: '',
                email: '',
                address: '',
                city: '',
                postalCode: '',
                companyId: userContext.companyId
              });
              customerId = newCustomer.id;
            }
          }

          // Generate invoice number
          const existingInvoices = await userContext.storage.getCompanyInvoices(userContext.companyId);
          const invoiceNumber = `2025${(existingInvoices.length + 1).toString().padStart(4, '0')}`;

          // Calculate dates
          const issueDate = new Date();
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 14);

          // Calculate VAT
          const vatRate = 21;
          const subtotalAmount = Math.round(amount / (1 + vatRate/100));
          const vatAmount = amount - subtotalAmount;

          // Create invoice
          const newInvoice = await userContext.storage.createInvoice({
            companyId: userContext.companyId,
            customerId,
            type: 'invoice',
            invoiceNumber,
            issueDate,
            dueDate,
            subtotal: subtotalAmount.toString(),
            vatAmount: vatAmount.toString(),
            total: amount.toString(),
            status: 'draft',
            notes: ''
          });

          // Create invoice item
          await userContext.storage.createInvoiceItem({
            invoiceId: newInvoice.id,
            description: service,
            quantity: '1',
            unitPrice: subtotalAmount.toString(),
            vatRate: vatRate.toString(),
            total: subtotalAmount.toString()
          });

          return {
            content: `Faktura byla úspěšně vytvořena! 📄\n\n• Číslo faktury: ${invoiceNumber}\n• Zákazník: ${companyName}\n• Částka: ${amount.toLocaleString('cs-CZ')} Kč\n• Služba: ${service}\n\nFaktura je uložena jako koncept a můžete ji upravit nebo odeslat zákazníkovi.`,
            action: {
              type: 'navigate',
              data: { path: `/invoices/${newInvoice.id}` }
            }
          };
        }
      } catch (error) {
        console.error('Error creating invoice via AI:', error);
        return {
          content: `Omlouváme se, nepodařilo se vytvořit fakturu. Zkuste to prosím znovu nebo použijte formulář pro vytvoření faktury.`,
          action: {
            type: 'navigate',
            data: { path: '/invoices/new' }
          }
        };
      }
    }

    // STATUS MANAGEMENT AND ACTIONS
    if (message.toLowerCase().includes('označ jako zaplaceno') || 
        message.toLowerCase().includes('zaplaceno') ||
        message.toLowerCase().includes('uhrazeno')) {
      
      try {
        // Extract invoice number or customer name
        const invoiceMatch = message.match(/faktur[au]?\s+(\d{4,})/i);
        const customerMatch = message.match(/(?:od|pro)\s+([A-Za-z\s\.&,]+)/i);
        
        if (invoiceMatch || customerMatch) {
          const allInvoices = await userContext.storage.getCompanyInvoices(userContext.companyId);
          let targetInvoices = [];
          
          if (invoiceMatch) {
            const invoiceNumber = invoiceMatch[1];
            targetInvoices = allInvoices.filter(inv => inv.invoiceNumber.includes(invoiceNumber));
          } else if (customerMatch) {
            const customerName = customerMatch[1].trim();
            const customers = await userContext.storage.searchCustomers(customerName, userContext.companyId);
            if (customers.length > 0) {
              targetInvoices = allInvoices.filter(inv => 
                customers.some(customer => customer.id === inv.customerId) && 
                (inv.status === 'sent' || inv.status === 'overdue')
              );
            }
          }
          
          if (targetInvoices.length > 0) {
            // Update status to paid for found invoices
            for (const invoice of targetInvoices) {
              await userContext.storage.updateInvoiceStatus(invoice.id, 'paid');
            }
            
            const totalPaid = targetInvoices.reduce((sum, inv) => sum + parseInt(inv.total), 0);
            return {
              content: `✅ Označeno jako zaplaceno: ${targetInvoices.length} faktur\n\n💰 Celková částka: ${totalPaid.toLocaleString('cs-CZ')} Kč\n\nFaktury byly aktualizovány v systému.`,
              action: { type: 'navigate', data: { path: '/invoices?status=paid' } }
            };
          }
        }
        
        return {
          content: "Pro označení jako zaplaceno zadejte:\n• 'Označ fakturu 20250001 jako zaplacenou'\n• 'Faktura od CreativeLand je zaplacena'\n• 'Uhrazeno od Apple Inc.'",
          action: { type: 'navigate', data: { path: '/invoices' } }
        };
        
      } catch (error) {
        console.error('Status update error:', error);
        return {
          content: "Nepodařilo se aktualizovat stav faktury. Zkuste to prosím znovu.",
          action: { type: 'navigate', data: { path: '/invoices' } }
        };
      }
    }

    // NAVIGATION AND HELP
    if (message.toLowerCase().includes('dashboard') || message.toLowerCase().includes('přehled')) {
      return {
        content: "📊 Přesměrovávám na hlavní přehled...",
        action: { type: 'navigate', data: { path: '/dashboard' } }
      };
    }

    if (message.toLowerCase().includes('zákazníci') || message.toLowerCase().includes('customers')) {
      return {
        content: "👥 Zobrazuji seznam zákazníků...",
        action: { type: 'navigate', data: { path: '/customers' } }
      };
    }

    if (message.toLowerCase().includes('faktury') || message.toLowerCase().includes('invoices')) {
      return {
        content: "📋 Zobrazuji všechny faktury...",
        action: { type: 'navigate', data: { path: '/invoices' } }
      };
    }

    if (message.toLowerCase().includes('nápověda') || 
        message.toLowerCase().includes('help') ||
        message.toLowerCase().includes('co umíš') ||
        message.toLowerCase().includes('jak funguje')) {
      
      return {
        content: `🤖 Jsem váš AI asistent pro fakturační systém. Umím:\n\n📊 ANALÝZY:\n• "největší neplatiči" - analýza dlužníků\n• "nejlepší zákazníci" - TOP zákazníci\n• "statistiky" - přehled tržeb\n\n📝 VYTVÁŘENÍ:\n• "vytvoř fakturu pro XYZ za 5000 Kč"\n• "nový zákazník s IČO 12345678"\n• "přidej zákazníka Apple Inc."\n\n🔍 VYHLEDÁVÁNÍ:\n• "najdi faktury od CreativeLand"\n• "zobraz neplacené faktury"\n• "faktury po splatnosti"\n\n⚙️ SPRÁVA:\n• "označ fakturu jako zaplacenou"\n• "jdi na dashboard"\n• "zobraz zákazníky"\n\nStačí mi napsat, co potřebujete!`,
        action: { type: 'navigate', data: { path: '/dashboard' } }
      };
    }

    // MONTHLY AND YEARLY ANALYSIS
    if (message.toLowerCase().includes('měsíc') || 
        message.toLowerCase().includes('rok') ||
        message.toLowerCase().includes('tržby')) {
      
      try {
        const allInvoices = await userContext.storage.getCompanyInvoices(userContext.companyId);
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // This month invoices
        const thisMonthInvoices = allInvoices.filter(invoice => {
          const invoiceDate = new Date(invoice.issueDate);
          return invoiceDate.getMonth() === currentMonth && 
                 invoiceDate.getFullYear() === currentYear;
        });
        
        // This year invoices  
        const thisYearInvoices = allInvoices.filter(invoice => {
          const invoiceDate = new Date(invoice.issueDate);
          return invoiceDate.getFullYear() === currentYear;
        });
        
        const monthlyRevenue = thisMonthInvoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + parseInt(inv.total), 0);
          
        const yearlyRevenue = thisYearInvoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + parseInt(inv.total), 0);
        
        const monthName = new Intl.DateTimeFormat('cs-CZ', { month: 'long' }).format(currentDate);
        
        return {
          content: `📈 Finanční přehled:\n\n📅 ${monthName} ${currentYear}:\n• Tržby: ${monthlyRevenue.toLocaleString('cs-CZ')} Kč\n• Faktur: ${thisMonthInvoices.length}\n• Zaplaceno: ${thisMonthInvoices.filter(inv => inv.status === 'paid').length}\n\n🗓️ Celý rok ${currentYear}:\n• Tržby: ${yearlyRevenue.toLocaleString('cs-CZ')} Kč\n• Faktur: ${thisYearInvoices.length}\n• Zaplaceno: ${thisYearInvoices.filter(inv => inv.status === 'paid').length}`,
          action: { type: 'navigate', data: { path: '/dashboard' } }
        };
        
      } catch (error) {
        console.error('Financial analysis error:', error);
        return {
          content: "Nepodařilo se načíst finanční přehled. Zkuste to prosím znovu.",
          action: { type: 'navigate', data: { path: '/dashboard' } }
        };
      }
    }

    return {
      content: result.content || "Nerozuměl jsem vašemu požadavku. Zkuste to prosím znovu nebo napište 'nápověda' pro seznam možností.",
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
