import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertCompanySchema, insertUserSchema, insertCustomerSchema, 
  insertInvoiceSchema, insertInvoiceItemSchema, insertChatMessageSchema 
} from "@shared/schema";
import { fetchCompanyFromAres, searchCompaniesByName } from "./services/ares";
import { processAICommand, generateInvoiceDescription, processUniversalAICommand, processPublicAICommand } from "./services/openai";
import { generateInvoicePDF } from "./services/pdf";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import setupEmailRoutes from "./routes/email";
import setupCompanyRoutes from "./routes/company";

// Simple session middleware (in production, use proper session management)
const sessions = new Map<string, { userId: number; companyId: number }>();

// Initialize with a test session for development
sessions.set('test-session-dev', { userId: 1, companyId: 1 });

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const session = sessions.get(sessionId || '');
  
  if (!session) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  req.user = session;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { company, user } = req.body;
      
      // Create company
      const companyData = insertCompanySchema.parse(company);
      const newCompany = await storage.createCompany(companyData);
      
      // Create user
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const userData = insertUserSchema.parse({
        ...user,
        password: hashedPassword,
        companyId: newCompany.id,
        role: 'admin'
      });
      const newUser = await storage.createUser(userData);
      
      // Create session
      const sessionId = randomUUID();
      sessions.set(sessionId, { userId: newUser.id, companyId: newCompany.id });
      
      res.json({ 
        user: { ...newUser, password: undefined }, 
        company: newCompany,
        sessionId 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const sessionId = randomUUID();
      sessions.set(sessionId, { userId: user.id, companyId: user.companyId! });
      
      res.json({ 
        user: { ...user, password: undefined }, 
        sessionId 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/validate", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (user) {
        res.json({ 
          user: { ...user, password: undefined },
          valid: true
        });
      } else {
        res.status(401).json({ message: "Invalid session" });
      }
    } catch (error) {
      console.error("Session validation error:", error);
      res.status(401).json({ message: "Invalid session" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.json({ message: "Logged out successfully" });
  });

  // Public ARES search for registration
  app.get("/api/public/ares/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }

      let aresResults: any[] = [];
      if (/^\d{8}$/.test(query)) {
        // Query is ICO
        const aresCompany = await fetchCompanyFromAres(query);
        if (aresCompany) {
          aresResults = [{ ...aresCompany, source: 'ares' }];
        }
      } else if (query.length > 2) {
        // Query is company name
        const aresCompanies = await searchCompaniesByName(query);
        aresResults = aresCompanies.map(company => ({ ...company, source: 'ares' }));
      }

      res.json(aresResults);
    } catch (error) {
      console.error("Error searching ARES:", error);
      res.status(500).json({ message: "Failed to search ARES" });
    }
  });

  // Test endpoint for ARES API
  app.get("/api/test/ares/:ico", async (req, res) => {
    try {
      const ico = req.params.ico;
      const aresData = await fetchCompanyFromAres(ico);
      res.json({ ico, data: aresData });
    } catch (error) {
      console.error("Error testing ARES:", error);
      res.status(500).json({ message: "Failed to test ARES", error: (error as Error).message });
    }
  });

  // Company routes
  app.get("/api/company", requireAuth, async (req: any, res) => {
    try {
      const company = await storage.getCompany(req.user.companyId);
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.patch("/api/company", requireAuth, async (req: any, res) => {
    try {
      const companyData = insertCompanySchema.partial().parse(req.body);
      const updatedCompany = await storage.updateCompany(req.user.companyId, companyData);
      res.json(updatedCompany);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Customer routes
  app.get("/api/customers", requireAuth, async (req: any, res) => {
    try {
      const customers = await storage.getCompanyCustomers(req.user.companyId);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/search", requireAuth, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }

      // Search local customers first
      const localCustomers = await storage.searchCustomers(query, req.user.companyId);
      
      // If no local customers found and query looks like ICO or company name, search ARES
      let aresResults: any[] = [];
      if (localCustomers.length === 0) {
        if (/^\d{8}$/.test(query)) {
          // Query is ICO
          const aresCompany = await fetchCompanyFromAres(query);
          if (aresCompany) {
            aresResults = [{ ...aresCompany, source: 'ares' }];
          }
        } else if (query.length > 2) {
          // Query is company name
          const aresCompanies = await searchCompaniesByName(query);
          aresResults = aresCompanies.map(company => ({ ...company, source: 'ares' }));
        }
      }

      res.json([
        ...localCustomers.map(customer => ({ ...customer, source: 'local' })),
        ...aresResults
      ]);
    } catch (error) {
      console.error("Error searching customers:", error);
      res.status(500).json({ message: "Failed to search customers" });
    }
  });

  app.get("/api/customers/inactive", requireAuth, async (req: any, res) => {
    try {
      const days = parseInt(req.query.days as string) || 90;
      const customers = await storage.getInactiveCustomers(req.user.companyId, days);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching inactive customers:", error);
      res.status(500).json({ message: "Failed to fetch inactive customers" });
    }
  });

  app.post("/api/customers", requireAuth, async (req: any, res) => {
    try {
      const customerData = insertCustomerSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });
      
      // If ICO is provided, try to fetch additional data from ARES
      if (customerData.ico) {
        const aresData = await fetchCompanyFromAres(customerData.ico);
        if (aresData) {
          Object.assign(customerData, {
            name: customerData.name || aresData.name,
            dic: customerData.dic || aresData.dic,
            address: customerData.address || aresData.address,
            city: customerData.city || aresData.city,
            postalCode: customerData.postalCode || aresData.postalCode,
          });
        }
      }

      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.get("/api/customers/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id, req.user.companyId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.patch("/api/customers/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, customerData, req.user.companyId);
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", requireAuth, async (req: any, res) => {
    try {
      const filters = {
        status: req.query.status as string,
        type: req.query.type as string,
        customerId: req.query.customerId ? parseInt(req.query.customerId) : undefined,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo) : undefined,
      };
      
      const invoices = await storage.getCompanyInvoices(req.user.companyId, filters);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/overdue", requireAuth, async (req: any, res) => {
    try {
      const invoices = await storage.getOverdueInvoices(req.user.companyId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching overdue invoices:", error);
      res.status(500).json({ message: "Failed to fetch overdue invoices" });
    }
  });

  app.get("/api/invoices/recent", requireAuth, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const invoices = await storage.getRecentInvoices(req.user.companyId, limit);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching recent invoices:", error);
      res.status(500).json({ message: "Failed to fetch recent invoices" });
    }
  });

  app.post("/api/invoices", requireAuth, async (req: any, res) => {
    try {
      let { customer, customerId, ...invoiceData } = req.body;
      
      // If customer is included but no customerId, create customer first
      if (customer && (!customerId || customerId === -1)) {
        const newCustomer = await storage.createCustomer({
          ...customer,
          companyId: req.user.companyId
        });
        customerId = newCustomer.id;
      }
      
      const invoiceDataParsed = insertInvoiceSchema.parse({
        ...invoiceData,
        customerId,
        companyId: req.user.companyId,
        userId: req.user.userId
      });
      
      const invoice = await storage.createInvoice(invoiceDataParsed);
      res.json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.get("/api/invoices/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoiceWithDetails(id, req.user.companyId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.patch("/api/invoices/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoiceData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(id, invoiceData, req.user.companyId);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.put("/api/invoices/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoiceData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(id, invoiceData, req.user.companyId);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.patch("/api/invoices/:id/due-date", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { dueDate } = req.body;
      
      const invoice = await storage.updateInvoice(id, { 
        dueDate: new Date(dueDate),
        originalDueDate: req.body.originalDueDate ? new Date(req.body.originalDueDate) : undefined
      }, req.user.companyId);
      
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice due date:", error);
      res.status(500).json({ message: "Failed to update invoice due date" });
    }
  });

  app.get("/api/invoices/:id/pdf", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoiceWithDetails(id, req.user.companyId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const company = await storage.getCompany(req.user.companyId);
      const pdfBuffer = await generateInvoicePDF(invoice);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Invoice items routes
  app.post("/api/invoices/:id/items", requireAuth, async (req: any, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const itemData = insertInvoiceItemSchema.parse({
        ...req.body,
        invoiceId
      });
      
      const item = await storage.createInvoiceItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating invoice item:", error);
      res.status(500).json({ message: "Failed to create invoice item" });
    }
  });

  app.patch("/api/invoice-items/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = insertInvoiceItemSchema.partial().parse(req.body);
      const item = await storage.updateInvoiceItem(id, itemData);
      res.json(item);
    } catch (error) {
      console.error("Error updating invoice item:", error);
      res.status(500).json({ message: "Failed to update invoice item" });
    }
  });

  app.delete("/api/invoice-items/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInvoiceItem(id);
      res.json({ message: "Invoice item deleted" });
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      res.status(500).json({ message: "Failed to delete invoice item" });
    }
  });

  // Statistics routes
  app.get("/api/stats", requireAuth, async (req: any, res) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : undefined;
      
      const stats = await storage.getCompanyStats(req.user.companyId, dateFrom, dateTo);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // AI Chat routes
  app.post("/api/chat", requireAuth, async (req: any, res) => {
    try {
      const { message } = req.body;
      
      const aiResponse = await processAICommand(message);
      
      const chatMessage = await storage.createChatMessage({
        message,
        response: aiResponse.response,
        companyId: req.user.companyId,
        userId: req.user.userId
      });
      
      res.json(chatMessage);
    } catch (error) {
      console.error("Error processing AI command:", error);
      res.status(500).json({ message: "Failed to process AI command" });
    }
  });

  // Universal AI Chat - for authenticated users
  app.post("/api/chat/universal", requireAuth, async (req: any, res) => {
    try {
      const { message, context, currentPath } = req.body;
      
      const aiResponse = await processUniversalAICommand(message, context, currentPath, {
        companyId: req.user.companyId,
        userId: req.user.userId,
        storage
      });
      
      // Save chat message to history
      await storage.createChatMessage({
        message,
        response: aiResponse.content,
        companyId: req.user.companyId,
        userId: req.user.userId
      });
      
      res.json(aiResponse);
    } catch (error) {
      console.error("Error processing universal AI command:", error);
      res.status(500).json({ message: "Failed to process AI command" });
    }
  });

  // Public AI Chat - for non-authenticated users (registration/login)
  app.post("/api/chat/public", async (req, res) => {
    try {
      const { message, context } = req.body;
      
      const aiResponse = await processPublicAICommand(message, context);
      
      res.json(aiResponse);
    } catch (error) {
      console.error("Error processing public AI command:", error);
      res.status(500).json({ message: "Failed to process AI command" });
    }
  });

  app.get("/api/chat/messages", requireAuth, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getChatMessages(req.user.companyId, req.user.userId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Reminder routes
  app.post("/api/reminders", requireAuth, async (req: any, res) => {
    try {
      const reminderData = {
        ...req.body,
        companyId: req.user.companyId,
        sentAt: new Date()
      };
      
      const reminder = await storage.createReminder(reminderData);
      res.json(reminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.get("/api/invoices/:id/reminders", requireAuth, async (req: any, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const reminders = await storage.getInvoiceReminders(invoiceId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  // WebSocket setup for real-time features
  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Echo back for now - in production, handle different message types
        ws.send(JSON.stringify({ type: 'echo', data }));
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Mount additional routes
  setupEmailRoutes(app, sessions);
  setupCompanyRoutes(app, sessions);

  return server;
}