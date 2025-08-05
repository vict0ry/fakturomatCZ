// OpenAI Function Calling Tools Definition
export const AI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "create_expense",
      description: "Vytvoření nového nákladu/výdaje - dodavatel, kategorie, částka, DPH",
      parameters: {
        type: "object",
        properties: {
          supplierName: {
            type: "string",
            description: "Jméno dodavatele/firmy (např. 'ČEZ a.s.', 'Tesco')"
          },
          category: {
            type: "string", 
            description: "Kategorie nákladu (office, travel, materials, services, utilities, etc.)"
          },
          description: {
            type: "string",
            description: "Popis nákladu"
          },
          amount: {
            type: "number",
            description: "Částka bez DPH"
          },
          total: {
            type: "number", 
            description: "Celková částka včetně DPH"
          },
          vatRate: {
            type: "number",
            description: "Sazba DPH (např. 21, 15, 0)"
          },
          expenseDate: {
            type: "string",
            description: "Datum nákladu (YYYY-MM-DD)"
          },
          receiptNumber: {
            type: "string",
            description: "Číslo účtenky/faktury"
          }
        },
        required: ["supplierName", "category", "description", "total"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "update_invoice_universal",
      description: "Univerzální aktualizace faktury - splatnost, poznámky, adresy, zákazník, platební údaje, množství, status - VŠECHNO!",
      parameters: {
        type: "object",
        properties: {
          updateType: {
            type: "string",
            enum: ["splatnost", "ceny", "poznamky", "zakaznik", "platba", "mnozstvi", "status", "obecne"],
            description: "Typ aktualizace"
          },
          dueDate: {
            type: "string",
            description: "Nová splatnost ve formátu YYYY-MM-DD"
          },
          notes: {
            type: "string", 
            description: "Poznámka k faktuře"
          },
          customer: {
            type: "object",
            properties: {
              email: { type: "string" },
              phone: { type: "string" },
              address: { type: "string" }
            }
          },
          paymentDetails: {
            type: "object", 
            properties: {
              bankAccount: { type: "string" },
              variableSymbol: { type: "string" }
            }
          },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                quantity: { type: "string" },
                unitPrice: { type: "number" },
                description: { type: "string" }
              }
            }
          },
          status: {
            type: "string",
            enum: ["draft", "sent", "paid", "cancelled"]
          }
        },
        required: ["updateType"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "add_item_to_invoice",
      description: "Přidat novou položku k existující faktuře",
      parameters: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "Popis produktu/služby (např. Pikachu, konzultace, atd.)"
          },
          quantity: {
            type: "string", 
            description: "Množství (např. '1', '2.5', '10')"
          },
          unit: {
            type: "string",
            description: "Jednotka (ks, kg, hod, m, atd.)"
          },
          unitPrice: {
            type: "number",
            description: "Cena za jednotku"
          },
          currency: {
            type: "string",
            description: "Měna položky (CZK, EUR, USD, etc.) - výchozí CZK",
            enum: ["CZK", "EUR", "USD", "GBP"]
          }
        },
        required: ["description", "quantity", "unit", "unitPrice"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "create_invoice",
      description: "Create a new invoice for a customer with specified items and details",
      parameters: {
        type: "object",
        properties: {
          customerName: {
            type: "string",
            description: "Name of the customer or company"
          },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string", description: "Product/service description" },
                quantity: { type: "string", description: "Quantity as string" },
                unit: { type: "string", description: "Unit (ks, kg, hod, m, etc.)" },
                unitPrice: { type: "number", description: "Price per unit (optional)" }
              },
              required: ["description", "quantity", "unit"]
            }
          },
          totalAmount: {
            type: "number",
            description: "Total invoice amount (optional)"
          },
          notes: {
            type: "string",
            description: "Additional notes for the invoice (optional)"
          }
        },
        required: ["customerName", "items"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "add_note_to_invoice",
      description: "Add a note to an existing invoice (does not change prices)",
      parameters: {
        type: "object",
        properties: {
          note: {
            type: "string",
            description: "The note content to add to the invoice"
          },
          invoiceNumber: {
            type: "string",
            description: "The invoice number to add the note to (optional - will be extracted from URL if not provided)"
          }
        },
        required: ["note"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "update_invoice_prices",
      description: "Update prices for items in an existing invoice",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productName: { type: "string", description: "Product name to match" },
                unitPrice: { type: "number", description: "New price per unit" },
                unit: { type: "string", description: "Unit (ks, kg, etc.)" }
              },
              required: ["productName", "unitPrice"]
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
      name: "navigate_to_page",
      description: "Navigate to a specific page or apply filters",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Path to navigate to (e.g., /invoices, /customers, /dashboard)"
          },
          filters: {
            type: "object",
            properties: {
              status: { type: "string", description: "Filter by status (sent, paid, overdue, draft)" },
              search: { type: "string", description: "Search term" }
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
      description: "Change the status of an invoice",
      parameters: {
        type: "object",
        properties: {
          invoiceNumber: {
            type: "string",
            description: "Invoice number to update"
          },
          status: {
            type: "string",
            enum: ["draft", "sent", "paid", "overdue", "cancelled"],
            description: "New status for the invoice"
          }
        },
        required: ["invoiceNumber", "status"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_expenses",
      description: "Zobrazení seznamu nákladů/výdajů s filtry",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "Status nákladu (draft, approved, paid, rejected)"
          },
          category: {
            type: "string",
            description: "Kategorie nákladu"
          },
          dateFrom: {
            type: "string",
            description: "Od data (YYYY-MM-DD)"
          },
          dateTo: {
            type: "string", 
            description: "Do data (YYYY-MM-DD)"
          }
        }
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "provide_help",
      description: "Provide general help or information without performing any action",
      parameters: {
        type: "object",
        properties: {
          response: {
            type: "string",
            description: "The helpful response to provide to the user"
          }
        },
        required: ["response"]
      }
    }
  }
];