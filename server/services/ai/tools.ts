// OpenAI Function Calling Tools Definition
export const AI_TOOLS = [
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