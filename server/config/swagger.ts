import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Czech Invoice Management System API',
    version: '1.0.0',
    description: 'Kompletní API pro český fakturační systém s AI asistencí, ARES integrací a správou nákladů',
    contact: {
      name: 'API Support',
      email: 'support@invoicesystem.cz'
    }
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:5000',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Company: {
        type: 'object',
        required: ['name', 'ico', 'address'],
        properties: {
          id: {
            type: 'integer',
            description: 'Unikátní ID společnosti'
          },
          name: {
            type: 'string',
            description: 'Název společnosti'
          },
          ico: {
            type: 'string',
            description: 'IČO společnosti'
          },
          dic: {
            type: 'string',
            description: 'DIČ společnosti'
          },
          address: {
            type: 'string',
            description: 'Adresa společnosti'
          },
          phone: {
            type: 'string',
            description: 'Telefon'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email'
          },
          bankAccount: {
            type: 'string',
            description: 'Bankovní účet'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      Customer: {
        type: 'object',
        required: ['name', 'companyId'],
        properties: {
          id: {
            type: 'integer',
            description: 'Unikátní ID zákazníka'
          },
          name: {
            type: 'string',
            description: 'Název zákazníka/firmy'
          },
          ico: {
            type: 'string',
            description: 'IČO zákazníka'
          },
          dic: {
            type: 'string',
            description: 'DIČ zákazníka'
          },
          email: {
            type: 'string',
            format: 'email'
          },
          phone: {
            type: 'string'
          },
          address: {
            type: 'string'
          },
          companyId: {
            type: 'integer'
          },
          isActive: {
            type: 'boolean'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      Invoice: {
        type: 'object',
        required: ['customerId', 'companyId', 'invoiceNumber', 'issueDate', 'dueDate', 'total'],
        properties: {
          id: {
            type: 'integer'
          },
          invoiceNumber: {
            type: 'string',
            description: 'Číslo faktury'
          },
          customerId: {
            type: 'integer'
          },
          companyId: {
            type: 'integer'
          },
          issueDate: {
            type: 'string',
            format: 'date',
            description: 'Datum vystavení'
          },
          dueDate: {
            type: 'string',
            format: 'date',
            description: 'Datum splatnosti'
          },
          status: {
            type: 'string',
            enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled']
          },
          subtotal: {
            type: 'string',
            description: 'Částka bez DPH'
          },
          vatAmount: {
            type: 'string',
            description: 'Výše DPH'
          },
          total: {
            type: 'string',
            description: 'Celková částka'
          },
          notes: {
            type: 'string'
          },
          variableSymbol: {
            type: 'string'
          },
          constantSymbol: {
            type: 'string'
          },
          bankAccount: {
            type: 'string'
          }
        }
      },
      InvoiceItem: {
        type: 'object',
        required: ['invoiceId', 'description', 'quantity', 'unitPrice'],
        properties: {
          id: {
            type: 'integer'
          },
          invoiceId: {
            type: 'integer'
          },
          description: {
            type: 'string',
            description: 'Popis položky'
          },
          quantity: {
            type: 'string',
            description: 'Množství'
          },
          unit: {
            type: 'string',
            description: 'Jednotka (ks, kg, hod, apod.)'
          },
          unitPrice: {
            type: 'string',
            description: 'Cena za jednotku'
          },
          vatRate: {
            type: 'string',
            description: 'Sazba DPH (%)'
          },
          total: {
            type: 'string',
            description: 'Celková cena položky'
          }
        }
      },
      Expense: {
        type: 'object',
        required: ['companyId', 'expenseNumber', 'supplierId', 'description', 'total'],
        properties: {
          id: {
            type: 'integer'
          },
          expenseNumber: {
            type: 'string',
            description: 'Číslo nákladu'
          },
          companyId: {
            type: 'integer'
          },
          supplierId: {
            type: 'integer',
            description: 'ID dodavatele'
          },
          category: {
            type: 'string',
            description: 'Kategorie nákladu'
          },
          description: {
            type: 'string',
            description: 'Popis nákladu'
          },
          amount: {
            type: 'string',
            description: 'Částka bez DPH'
          },
          vatAmount: {
            type: 'string',
            description: 'Výše DPH'
          },
          total: {
            type: 'string',
            description: 'Celková částka'
          },
          status: {
            type: 'string',
            enum: ['draft', 'submitted', 'approved', 'paid', 'rejected']
          },
          expenseDate: {
            type: 'string',
            format: 'date'
          },
          receiptNumber: {
            type: 'string',
            description: 'Číslo účtenky'
          }
        }
      },
      AIResponse: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'AI odpověď'
          },
          action: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['navigate', 'refresh_current_page']
              },
              data: {
                type: 'object'
              }
            }
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          message: {
            type: 'string'
          },
          code: {
            type: 'string'
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: ['./server/routes/*.ts', './server/routes.ts'], // Cesty k souborům s API dokumentací
};

export const swaggerSpec = swaggerJSDoc(options);