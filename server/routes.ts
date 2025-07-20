import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertCompanySchema, insertUserSchema, insertCustomerSchema, 
  insertInvoiceSchema, insertInvoiceItemSchema, insertChatMessageSchema,
  insertExpenseSchema, insertExpenseItemSchema 
} from "@shared/schema";
import { fetchCompanyFromAres, searchCompaniesByName } from "./services/ares";
import { processAICommand, generateInvoiceDescription, processUniversalAICommand, processPublicAICommand } from "./services/openai";
import { generateInvoicePDF } from "./services/pdf";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import setupEmailRoutes from "./routes/email";
import setupCompanyRoutes from "./routes/company";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

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
  
  /**
   * @openapi
   * /api/docs:
   *   get:
   *     summary: Swagger UI dokumentace
   *     description: Interaktivní dokumentace API
   *     tags: [Documentation]
   *     responses:
   *       200:
   *         description: Swagger UI stránka
   */
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Czech Invoice API Docs',
    swaggerOptions: {
      persistAuthorization: true
    }
  }));

  // JSON specifikace pro externí použití
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  /**
   * @openapi
   * /api/auth/register:
   *   post:
   *     summary: Registrace nové společnosti a administrátora
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [company, user]
   *             properties:
   *               company:
   *                 $ref: '#/components/schemas/Company'
   *               user:
   *                 type: object
   *                 required: [username, password, email]
   *                 properties:
   *                   username:
   *                     type: string
   *                   password:
   *                     type: string
   *                     minLength: 6
   *                   email:
   *                     type: string
   *                     format: email
   *     responses:
   *       201:
   *         description: Úspěšná registrace
   *       400:
   *         description: Neplatná data
   */
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

  // Company settings endpoint (alias for frontend compatibility)
  app.get("/api/company/settings", requireAuth, async (req: any, res) => {
    try {
      const company = await storage.getCompany(req.user.companyId);
      res.json(company);
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ message: "Failed to fetch company settings" });
    }
  });

  app.post("/api/company/settings", requireAuth, async (req: any, res) => {
    try {
      const companyData = insertCompanySchema.partial().parse(req.body);
      const updatedCompany = await storage.updateCompany(req.user.companyId, companyData);
      res.json(updatedCompany);
    } catch (error) {
      console.error("Error updating company settings:", error);
      res.status(500).json({ message: "Failed to update company settings" });
    }
  });

  // Company users management
  app.get("/api/company/users", requireAuth, async (req: any, res) => {
    try {
      const users = await storage.getCompanyUsers(req.user.companyId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching company users:", error);
      res.status(500).json({ message: "Failed to fetch company users" });
    }
  });

  app.post("/api/company/users/invite", requireAuth, async (req: any, res) => {
    try {
      const { email, role, firstName, lastName } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // For now, create the user directly (in production, this would send an email invitation)
      const hashedPassword = await bcrypt.hash('temppassword123', 10); // Temporary password
      
      const userData = {
        username: email,
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role,
        companyId: req.user.companyId,
        isActive: true
      };
      
      const newUser = await storage.createUser(userData);
      
      res.json({ 
        message: "User created successfully", 
        user: { ...newUser, password: undefined },
        tempPassword: 'temppassword123' // In production, this would be sent via email
      });
    } catch (error) {
      console.error("Error inviting user:", error);
      res.status(500).json({ message: "Failed to invite user" });
    }
  });

  /**
   * @openapi
   * /api/customers:
   *   get:
   *     summary: Seznam všech zákazníků
   *     tags: [Customers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Hledaný text
   *     responses:
   *       200:
   *         description: Seznam zákazníků
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Customer'
   *   post:
   *     summary: Vytvoření nového zákazníka
   *     tags: [Customers]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Customer'
   *     responses:
   *       201:
   *         description: Zákazník vytvořen
   *       400:
   *         description: Neplatná data
   */
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

  /**
   * @openapi
   * /api/invoices:
   *   get:
   *     summary: Seznam faktur s filtry
   *     tags: [Invoices]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, sent, paid, overdue, cancelled]
   *       - in: query
   *         name: customerId
   *         schema:
   *           type: integer
   *       - in: query
   *         name: dateFrom
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: dateTo
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Seznam faktur
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Invoice'
   *   post:
   *     summary: Vytvoření nové faktury
   *     tags: [Invoices]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Invoice'
   *     responses:
   *       201:
   *         description: Faktura vytvořena
   */
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
      
      // Convert string dates to Date objects and handle numeric fields
      const processedInvoiceData = {
        ...invoiceData,
        customerId,
        companyId: req.user.companyId,
        userId: req.user.userId,
        issueDate: new Date(invoiceData.issueDate),
        dueDate: new Date(invoiceData.dueDate),
        subtotal: String(invoiceData.subtotal || '0'),
        vatAmount: String(invoiceData.vatAmount || '0'),
        total: String(invoiceData.total || '0')
      };
      
      const invoiceDataParsed = insertInvoiceSchema.parse(processedInvoiceData);
      
      // Generate invoice number if not provided
      if (!invoiceDataParsed.invoiceNumber || invoiceDataParsed.invoiceNumber.trim() === '') {
        const year = new Date().getFullYear();
        const count = await storage.getInvoiceCount(req.user.companyId, year);
        invoiceDataParsed.invoiceNumber = `${year}${String(count + 1).padStart(4, '0')}`;
      }

      const invoice = await storage.createInvoice(invoiceDataParsed);
      
      // Create invoice items if provided
      if (invoiceData.items && Array.isArray(invoiceData.items)) {
        for (const item of invoiceData.items) {
          await storage.createInvoiceItem({
            invoiceId: invoice.id,
            description: item.description || '',
            quantity: String(item.quantity || '1'),
            unitPrice: String(item.unitPrice || '0'),
            vatRate: String(item.vatRate || '21'),
            total: String(parseFloat(item.quantity || '1') * parseFloat(item.unitPrice || '0'))
          });
        }
      }
      
      // Log creation in history
      await storage.createInvoiceHistory({
        invoiceId: invoice.id,
        companyId: req.user.companyId,
        userId: req.user.userId,
        action: 'created',
        description: `Faktúra ${invoice.invoiceNumber} bola vytvorená`,
        newValue: { status: invoice.status, total: invoice.total }
      });
      
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
      
      // Handle date conversion for PATCH requests too
      const processedData = {
        ...req.body,
        issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        subtotal: req.body.subtotal ? String(req.body.subtotal) : undefined,
        vatAmount: req.body.vatAmount ? String(req.body.vatAmount) : undefined,
        total: req.body.total ? String(req.body.total) : undefined
      };
      
      const oldInvoice = await storage.getInvoice(id, req.user.companyId);
      const invoiceData = insertInvoiceSchema.partial().parse(processedData);
      const invoice = await storage.updateInvoice(id, invoiceData, req.user.companyId);
      
      // Log update in history
      if (oldInvoice) {
        const changes = Object.keys(invoiceData).filter(key => 
          oldInvoice[key as keyof typeof oldInvoice] !== invoiceData[key as keyof typeof invoiceData]
        );
        
        if (changes.length > 0) {
          await storage.createInvoiceHistory({
            invoiceId: id,
            companyId: req.user.companyId,
            userId: req.user.userId,
            action: 'updated',
            description: `Faktúra bola upravená (${changes.join(', ')})`,
            oldValue: Object.fromEntries(changes.map(key => [key, oldInvoice[key as keyof typeof oldInvoice]])),
            newValue: Object.fromEntries(changes.map(key => [key, invoiceData[key as keyof typeof invoiceData]]))
          });
        }
      }
      
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.put("/api/invoices/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Handle date conversion for PUT requests too
      const processedData = {
        ...req.body,
        issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        subtotal: req.body.subtotal ? String(req.body.subtotal) : undefined,
        vatAmount: req.body.vatAmount ? String(req.body.vatAmount) : undefined,
        total: req.body.total ? String(req.body.total) : undefined
      };
      
      const invoiceData = insertInvoiceSchema.partial().parse(processedData);
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
      
      try {
        // Try Puppeteer first
        const pdfBuffer = await generateInvoicePDF(invoice as any);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Faktura_${invoice.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);
      } catch (puppeteerError) {
        console.warn("Puppeteer failed, falling back to HTML:", (puppeteerError as Error).message);
        
        // Fallback to HTML with print functionality
        const { generateInvoiceHTML } = await import('./services/pdf-fallback');
        const htmlContent = generateInvoiceHTML(invoice as any);
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(htmlContent);
      }
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

  // Invoice history routes
  app.get("/api/invoices/:id/history", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const history = await storage.getInvoiceHistory(id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching invoice history:", error);
      res.status(500).json({ message: "Failed to fetch invoice history" });
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
  /**
   * @openapi
   * /api/chat:
   *   post:
   *     summary: Základní AI chat pro vytváření faktur (legacy)
   *     tags: [AI Chat]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [message]
   *             properties:
   *               message:
   *                 type: string
   *     responses:
   *       200:
   *         description: AI odpověď
   */
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

  /**
   * @openapi
   * /api/chat/universal:
   *   post:
   *     summary: Univerzální AI chat pro autentifikované uživatele
   *     description: AI asistent pro práci s fakturami, náklady, zákazníky a navigaci
   *     tags: [AI Chat]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [message]
   *             properties:
   *               message:
   *                 type: string
   *                 description: Zpráva pro AI (např. "vytvoř fakturu pro zákazníka XYZ")
   *               context:
   *                 type: object
   *                 description: Kontext aplikace
   *               currentPath:
   *                 type: string
   *                 description: Aktuální cesta v aplikaci
   *               chatHistory:
   *                 type: array
   *                 items:
   *                   type: object
   *     responses:
   *       200:
   *         description: AI odpověď s možnou akcí
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AIResponse'
   *     examples:
   *       createInvoice:
   *         summary: Vytvoření faktury
   *         value:
   *           message: "vytvoř fakturu pro ABC s.r.o. za konzultace 5000 kč"
   *       createExpense:
   *         summary: Vytvoření nákladu
   *         value:
   *           message: "vytvoř náklad ČEZ elektřina 3500 kč kategorie utilities"
   *       getExpenses:
   *         summary: Zobrazení nákladů
   *         value:
   *           message: "zobraz všechny náklady tento měsíc"
   */
  // Universal AI Chat - for authenticated users
  app.post("/api/chat/universal", requireAuth, async (req: any, res) => {
    try {
      const { message, context, currentPath, chatHistory, attachments } = req.body;
      
      const aiResponse = await processUniversalAICommand(message, context, currentPath, {
        companyId: req.user.companyId,
        userId: req.user.id!,
        storage
      }, chatHistory, attachments);
      
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

  /**
   * @openapi
   * /api/expenses:
   *   get:
   *     summary: Seznam nákladů s filtry
   *     tags: [Expenses]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, submitted, approved, paid, rejected]
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *       - in: query
   *         name: supplierId
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Seznam nákladů
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Expense'
   *   post:
   *     summary: Vytvoření nového nákladu
   *     tags: [Expenses]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Expense'
   *     responses:
   *       201:
   *         description: Náklad vytvořen
   */
  // Expenses routes
  app.get("/api/expenses", requireAuth, async (req: any, res) => {
    try {
      const { status, category, dateFrom, dateTo, supplierId } = req.query;
      const filters = { status, category, dateFrom, dateTo, supplierId };
      const expenses = await storage.getCompanyExpenses(req.user.companyId, filters);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/recent", requireAuth, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const expenses = await storage.getRecentExpenses(req.user.companyId, limit);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching recent expenses:", error);
      res.status(500).json({ message: "Failed to fetch recent expenses" });
    }
  });

  app.post("/api/expenses", requireAuth, async (req: any, res) => {
    try {
      let { supplier, supplierId, ...expenseData } = req.body;
      
      if (supplier && (!supplierId || supplierId === -1)) {
        const newSupplier = await storage.createCustomer({
          ...supplier,
          companyId: req.user.companyId
        });
        supplierId = newSupplier.id;
      }
      
      const processedExpenseData = {
        ...expenseData,
        supplierId,
        companyId: req.user.companyId,
        userId: req.user.userId,
        expenseDate: new Date(expenseData.expenseDate || new Date()),
        dueDate: expenseData.dueDate ? new Date(expenseData.dueDate) : undefined,
        amount: String(expenseData.amount || '0'),
        vatAmount: String(expenseData.vatAmount || '0'),
        total: String(expenseData.total || '0')
      };
      
      // Generate expense number before validation
      if (!processedExpenseData.expenseNumber || processedExpenseData.expenseNumber === '') {
        const year = new Date().getFullYear();
        try {
          const existingExpenses = await storage.getCompanyExpenses(req.user.companyId);
          processedExpenseData.expenseNumber = `N${year}${String(existingExpenses.length + 1).padStart(4, '0')}`;
        } catch (error) {
          // If error (e.g., table doesn't exist), start with first number
          processedExpenseData.expenseNumber = `N${year}0001`;
        }
      }
      

      const expenseDataParsed = insertExpenseSchema.parse(processedExpenseData);

      const expense = await storage.createExpense(expenseDataParsed, req.user.companyId);
      
      if (expenseData.items && Array.isArray(expenseData.items)) {
        for (const item of expenseData.items) {
          await storage.createExpenseItem({
            expenseId: expense.id,
            description: item.description || '',
            quantity: String(item.quantity || '1'),
            unitPrice: String(item.unitPrice || '0'),
            vatRate: String(item.vatRate || '21'),
            total: String(parseFloat(item.quantity || '1') * parseFloat(item.unitPrice || '0'))
          });
        }
      }
      
      res.json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.get("/api/expenses/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const expense = await storage.getExpenseWithDetails(id, req.user.companyId);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  app.patch("/api/expenses/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const processedData = {
        ...req.body,
        expenseDate: req.body.expenseDate ? new Date(req.body.expenseDate) : undefined,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        amount: req.body.amount ? String(req.body.amount) : undefined,
        vatAmount: req.body.vatAmount ? String(req.body.vatAmount) : undefined,
        total: req.body.total ? String(req.body.total) : undefined
      };
      
      const expenseData = insertExpenseSchema.partial().parse(processedData);
      const expense = await storage.updateExpense(id, expenseData, req.user.companyId);
      res.json(expense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.get("/api/expenses/:id/items", requireAuth, async (req: any, res) => {
    try {
      const expenseId = parseInt(req.params.id);
      const items = await storage.getExpenseItems(expenseId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching expense items:", error);
      res.status(500).json({ message: "Failed to fetch expense items" });
    }
  });

  app.post("/api/expenses/:id/items", requireAuth, async (req: any, res) => {
    try {
      const expenseId = parseInt(req.params.id);
      const itemData = insertExpenseItemSchema.parse({
        ...req.body,
        expenseId,
        quantity: String(req.body.quantity),
        unitPrice: String(req.body.unitPrice),
        total: String(req.body.total)
      });
      
      const item = await storage.createExpenseItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating expense item:", error);
      res.status(500).json({ message: "Failed to create expense item" });
    }
  });

  // Create HTTP server - WebSocket temporarily disabled for stability
  const server = createServer(app);
  
  // TODO: WebSocket implementation will be added back once basic functionality is stable
  // For now, all real-time communication goes through regular HTTP API calls

  // Invoice sharing routes
  app.post("/api/invoices/:id/share", requireAuth, async (req: any, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { expiresInDays = 30 } = req.body;
      const companyId = req.user.companyId;

      const shareToken = await storage.generateInvoiceShareToken(invoiceId, companyId, expiresInDays);
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      const publicUrl = `${baseUrl}/public/invoice/${shareToken}`;

      res.json({
        success: true,
        shareUrl: publicUrl,
        token: shareToken,
        expiresInDays,
        message: `Bezpečný odkaz byl vygenerován a vyprší za ${expiresInDays} dní.`
      });
    } catch (error) {
      console.error('Share link generation error:', error);
      res.status(500).json({ error: 'Failed to generate share link' });
    }
  });

  app.get("/api/public/invoice/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const invoice = await storage.getInvoiceByShareToken(token);
      
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found or link has expired' });
      }

      await storage.incrementInvoiceShareViewCount(token);
      const invoiceWithDetails = await storage.getInvoiceWithDetails(invoice.id!, invoice.companyId!);
      
      if (!invoiceWithDetails) {
        return res.status(404).json({ error: 'Invoice details not found' });
      }

      const publicInvoiceData = {
        id: invoiceWithDetails.id,
        invoiceNumber: invoiceWithDetails.invoiceNumber,
        issueDate: invoiceWithDetails.issueDate,
        dueDate: invoiceWithDetails.dueDate,
        total: invoiceWithDetails.total,
        subtotal: invoiceWithDetails.subtotal,
        vatAmount: invoiceWithDetails.vatAmount,
        status: invoiceWithDetails.status,
        currency: invoiceWithDetails.currency,
        notes: invoiceWithDetails.notes,
        customer: {
          name: invoiceWithDetails.customer.name,
          address: invoiceWithDetails.customer.address,
          city: invoiceWithDetails.customer.city,
          postalCode: invoiceWithDetails.customer.postalCode,
        },
        company: {
          name: "Test Company", // Will be fixed with proper company data
          address: "Test Address",
          city: "Praha",
          postalCode: "10000",
          ico: "12345678",
          dic: "CZ12345678",
          phone: "+420 123 456 789",
          email: "info@company.cz",
          bankAccount: "1234567890/0100",
        },
        items: invoiceWithDetails.items,
      };

      res.json(publicInvoiceData);
    } catch (error) {
      console.error('Public invoice fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Mount additional routes
  setupEmailRoutes(app, sessions);
  setupCompanyRoutes(app, sessions);
  
  // Import and mount new route modules
  try {
    const chatRoutes = (await import("./routes/chat")).default;
    const analyticsRoutes = (await import("./routes/analytics")).default;
    
    app.use("/api/chat", chatRoutes);
    app.use("/api/analytics", analyticsRoutes);
  } catch (error) {
    console.error("Error loading additional routes:", error);
  }

  // Simple OpenAI endpoint for AI matching  
  app.post('/api/openai/simple', async (req, res) => {
    try {
      const { prompt, maxTokens = 100 } = req.body;
      
      // Import OpenAI here to avoid circular dependency
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.1 // Low temperature for consistent results
      });

      const result = response.choices[0].message.content?.trim() || '';
      res.send(result);
    } catch (error) {
      console.error('OpenAI simple request failed:', error);
      res.status(500).send('AI request failed');
    }
  });

  return server;
}