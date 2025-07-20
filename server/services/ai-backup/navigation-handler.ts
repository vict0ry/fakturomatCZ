import type { UniversalAIResponse } from "./types.js";
import { HELP_RESPONSE } from "./prompts.js";

export class NavigationHandler {
  
  handleNavigation(message: string): UniversalAIResponse | null {
    const msg = message.toLowerCase();

    // Dashboard navigation
    if (msg.includes('dashboard') || msg.includes('přehled') || msg.includes('domů')) {
      return {
        content: "🏠 Přecházím na hlavní dashboard...",
        action: { type: 'navigate', data: { path: '/dashboard' } }
      };
    }

    // Customers navigation
    if (msg.includes('zákazník') || msg.includes('customer') || msg.includes('klient')) {
      return {
        content: "👥 Přecházím na stránku se zákazníky...",
        action: { type: 'navigate', data: { path: '/customers' } }
      };
    }

    // Invoices navigation (NOT for creating invoices or filtering)
    if ((msg.includes('faktur') || msg.includes('invoice') || msg.includes('účt')) && 
        !msg.includes('vytvoř') && !msg.includes('vytvořte') &&
        !msg.includes('neplacené') && !msg.includes('zaplacené') &&
        !msg.includes('neplacen') && !msg.includes('zaplacen')) {
      return {
        content: "📋 Zobrazuji všechny faktury...",
        action: { type: 'navigate', data: { path: '/invoices' } }
      };
    }

    // Settings navigation
    if (msg.includes('nastavení') || msg.includes('setting') || msg.includes('konfigurac')) {
      return {
        content: "⚙️ Otevírám nastavení aplikace...",
        action: { type: 'navigate', data: { path: '/settings' } }
      };
    }

    // Analytics navigation
    if (msg.includes('analýz') || msg.includes('statist') || msg.includes('report') || msg.includes('přehled')) {
      return {
        content: "📊 Zobrazuji analytické přehledy...",
        action: { type: 'navigate', data: { path: '/analytics' } }
      };
    }

    return null;
  }

  handleSearch(message: string): UniversalAIResponse | null {
    const msg = message.toLowerCase();

    // Status filtering detection FIRST (most specific)
    if (msg.includes('neplacené faktury') || msg.includes('nezaplacené faktury') || 
        msg.includes('neplacen') || (msg.includes('zobraz') && msg.includes('neplacené'))) {
      return {
        content: "Filtruji neplacené faktury podle vašeho požadavku...",
        action: { type: 'navigate', data: { path: '/invoices?status=sent' } }
      };
    }

    if (msg.includes('zaplacené faktury') || msg.includes('placené faktury') || 
        msg.includes('zaplacen') || (msg.includes('najdi') && msg.includes('zaplacené'))) {
      return {
        content: "Filtruji zaplacené faktury podle vašeho požadavku...",
        action: { type: 'navigate', data: { path: '/invoices?status=paid' } }
      };
    }

    // Search by customer or filter by status (but not for creating invoices)
    if ((msg.includes('najdi') || msg.includes('vyhledej')) || 
        (msg.includes('zobraz') && !msg.includes('fakturu') && !msg.includes('vytvoř'))) {
      // Extract customer name for search
      const customerMatch = msg.match(/(?:pro|zákazník[aei]?)\s+([^,\s]+(?:\s+[^,\s]+)*)/);
      if (customerMatch) {
        const customerName = customerMatch[1];
        return {
          content: `Vyhledávám faktury pro zákazníka "${customerName}"...`,
          action: { 
            type: 'navigate', 
            data: { path: `/invoices?customer=${encodeURIComponent(customerName)}` } 
          }
        };
      }

      if (msg.includes('po splatnosti') || msg.includes('overdue') || msg.includes('prošl')) {
        return {
          content: "Zobrazuji faktury po splatnosti...",
          action: { type: 'navigate', data: { path: '/invoices?status=overdue' } }
        };
      }

      // Default invoice search
      return {
        content: "Zobrazuji všechny faktury...",
        action: { type: 'navigate', data: { path: '/invoices' } }
      };
    }

    return null;
  }

  handleStatusUpdate(message: string): UniversalAIResponse | null {
    const msg = message.toLowerCase();

    // Status change patterns
    const statusPatterns = [
      { keywords: ['označ', 'změň', 'nastav'], status: 'paid', text: 'zaplacen' },
      { keywords: ['odešli', 'pošli', 'send'], status: 'sent', text: 'odeslán' },
      { keywords: ['storno', 'zruš'], status: 'cancelled', text: 'zrušen' }
    ];

    for (const pattern of statusPatterns) {
      if (pattern.keywords.some(keyword => msg.includes(keyword))) {
        // Extract invoice number
        const invoiceMatch = msg.match(/(?:fakturu?|invoice)\s*(\w+)/);
        if (invoiceMatch) {
          const invoiceNumber = invoiceMatch[1];
          return {
            content: `✅ Označuji fakturu ${invoiceNumber} jako ${pattern.text}...`,
            action: { 
              type: 'update_status', 
              data: { invoiceNumber, status: pattern.status } 
            }
          };
        }
      }
    }

    return null;
  }

  handleHelp(message: string): UniversalAIResponse | null {
    const msg = message.toLowerCase();

    if (msg.includes('pomoc') || msg.includes('help') || msg.includes('co umíš') || msg.includes('co všechno umíš') || msg.includes('nápověda') || msg.includes('schopnosti')) {
      return { content: HELP_RESPONSE };
    }

    return null;
  }

  getContextualResponse(currentPath: string): string {
    switch (currentPath) {
      case '/dashboard':
        return "Na hlavním dashboardu vidíte přehled faktur, statistiky a rychlé akce. Mohu vám pomoci vytvořit novou fakturu nebo navigovat kamkoli potřebujete.";
      case '/invoices':
        return "Na stránce s fakturami můžete spravovat všechny vaše faktury. Mohu vám pomoci vyhledat konkrétní faktury nebo vytvořit nové.";
      case '/customers':
        return "Zde spravujete zákazníky. Mohu vám pomoci najít zákazníka nebo vytvořit fakturu pro existujícího zákazníka.";
      case '/analytics':
        return "V analytickém přehledu vidíte statistiky vašeho podnikání. Mohu vám pomoci s interpretací dat nebo vytvořit nové faktury.";
      case '/settings':
        return "V nastavení můžete upravit konfiguraci aplikace. Mohu vám pomoci s navigací nebo vytvořením faktur.";
      default:
        return "Nacházíte se v fakturačním systému. Mohu vám pomoci s vytvářením faktur, vyhledáváním nebo navigací.";
    }
  }
}