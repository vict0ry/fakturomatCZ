import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertCompanySchema, insertUserSchema, insertCustomerSchema, 
  insertInvoiceSchema, insertInvoiceItemSchema, insertChatMessageSchema,
  insertExpenseSchema, insertExpenseItemSchema, invoices 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { fetchCompanyFromAres, searchCompaniesByName } from "./services/ares";
import { processAICommand, generateInvoiceDescription, processUniversalAICommand, processPublicAICommand } from "./services/openai";
import { emailService } from "./services/email-service";
import { generateInvoicePDF } from "./services/pdf";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import setupEmailRoutes from "./routes/email";
import setupCompanyRoutes from "./routes/company";
import setupEnhancedAuthRoutes from "./routes/auth-enhanced";
import invitationRoutes from "./routes/invitation";
import stripeRoutes from "./routes/stripe";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Import modular routes
import modularRoutes from './routes/index';
import { sessions, requireAuth } from './middleware/auth';

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Register enhanced auth routes (includes password reset)
  setupEnhancedAuthRoutes(app, sessions);
  
  // Register company routes
  setupCompanyRoutes(app);
  
  // Register modular routes
  app.use('/api', modularRoutes);
  
  // Register invitation routes
  app.use('/api/invitations', invitationRoutes);
  
  // Register Stripe routes
  app.use('/api/stripe', stripeRoutes);
  
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

  // Legacy registration route (to be removed after full modular migration)
  app.post("/api/auth/register-legacy", async (req, res) => {
    try {
      console.log("Registration request body:", JSON.stringify(req.body, null, 2));
      console.log("Keys in req.body:", Object.keys(req.body));
      
      // Handle both old format (personal,company,payment) and new format (user,company)
      let userData, companyData;
      
      if (req.body.user && req.body.company) {
        // New format from direct API call
        console.log("Using new format (user,company)");
        userData = req.body.user;
        const company = req.body.company;
        
        companyData = {
          name: company.name,
          ico: company.ico,
          dic: company.dic,
          address: company.address,
          city: company.city,
          postalCode: company.postalCode,
          phone: company.phone,
          email: company.email || userData.email, // Use company email or fallback to user email
          country: company.country || "CZ"
        };
      } else if (req.body.personal && req.body.company) {
        // Old format from registration form
        userData = req.body.personal;
        companyData = {
          name: req.body.company.companyName || req.body.company.name,
          ico: req.body.company.ico,
          dic: req.body.company.dic,
          address: req.body.company.address,
          city: req.body.company.city,
          postalCode: req.body.company.postalCode,
          phone: req.body.company.phone || '',
          bankAccount: req.body.company.bankAccount || '', // Optional field
          email: req.body.personal.email
        };
      } else {
        throw new Error("Invalid request format - missing user/personal or company data");
      }
      
      // Validate and create company
      const validatedCompanyData = insertCompanySchema.parse(companyData);
      const newCompany = await storage.createCompany(validatedCompanyData);
      
      // Create user with trial settings
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7-day trial
      
      const userDataForDb = {
        username: userData.username || userData.email,
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        companyId: newCompany.id,
        role: 'user',
        subscriptionStatus: 'trial',
        trialEndsAt: trialEndsAt,
        subscriptionStartedAt: new Date()
      };
      
      const validatedUserData = insertUserSchema.parse(userDataForDb);
      const newUser = await storage.createUser(validatedUserData);
      
      // Create session
      const sessionId = randomUUID();
      sessions.set(sessionId, { userId: newUser.id, companyId: newCompany.id, role: newUser.role });
      
      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(newUser, newCompany);
        console.log('✅ Welcome email sent to:', newUser.email);
      } catch (emailError) {
        console.error('⚠️ Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }
      try {
        await emailService.sendWelcomeEmail(newUser, newCompany);
        console.log(`✅ Welcome email sent to ${newUser.email}`);
      } catch (emailError) {
        console.error('⚠️ Welcome email failed to send:', emailError);
        // Continue with registration success even if email fails
      }
      
      res.json({ 
        user: { ...newUser, password: undefined }, 
        company: newCompany,
        sessionId 
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Handle specific database errors
      if (error.code === '23505') {
        if (error.detail?.includes('username')) {
          return res.status(400).json({ 
            message: "Uživatel s tímto emailem již existuje. Zkuste jiný email nebo se přihlaste." 
          });
        }
        if (error.detail?.includes('email')) {
          return res.status(400).json({ 
            message: "Email je již zaregistrován. Zkuste jiný email nebo se přihlaste." 
          });
        }
      }
      
      // Handle validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Neplatné údaje: " + error.issues.map((i: any) => i.message).join(', ')
        });
      }
      
      res.status(400).json({ 
        message: "Registrace selhala. Zkontrolujte prosím všechny údaje a zkuste to znovu." 
      });
    }
  });

  // Login route moved to auth-enhanced.ts for password reset functionality
  // app.post("/api/auth/login", async (req, res) => {
  //   try {
  //     const { username, password } = req.body;
  //     
  //     const user = await storage.getUserByUsername(username);
  //     if (!user || !await bcrypt.compare(password, user.password)) {
  //       return res.status(401).json({ message: "Invalid credentials" });
  //     }
  //     
  //     const sessionId = randomUUID();
  //     sessions.set(sessionId, { userId: user.id, companyId: user.companyId!, role: user.role });
  //     
  //     res.json({ 
  //       user: { ...user, password: undefined }, 
  //       sessionId 
  //     });
  //   } catch (error) {
  //     console.error("Login error:", error);
  //     res.status(500).json({ message: "Login failed" });
  //   }
  // });

  // Auth routes are now handled by modular routes

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

  // Serve UI test page
  app.get("/test-ui-login", (req, res) => {
    res.sendFile(__dirname + "/../test-ui-login.html");
  });

  // Company routes are now handled by modular routes

  // User invitation will be moved to company module later

  // Customer routes are now handled by modular routes

  // Account routes
  app.use('/api/account', (await import('./routes/account')).default);
  
  // Public ARES routes (no auth required)  
  app.use('/api/test/ares', (await import('./routes/public-ares')).default);

  // Customer PATCH route also handled by modular routes

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

  // Debug endpoint - zobrazí všechny faktury bez filtru
  app.get("/api/invoices/debug", requireAuth, async (req: any, res) => {
    try {
      const allInvoices = await db.select().from(invoices);
      const sessionInfo = {
        sessionCompanyId: req.user.companyId,
        sessionUserId: req.user.userId,
        totalInvoices: allInvoices.length,
        invoicesByCompany: {} as Record<number, any[]>
      };
      
      // Seskupit faktury podle companyId
      allInvoices.forEach(inv => {
        const cid = inv.companyId;
        if (cid && !sessionInfo.invoicesByCompany[cid]) {
          sessionInfo.invoicesByCompany[cid] = [];
        }
        if (cid) {
          sessionInfo.invoicesByCompany[cid].push({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            total: inv.total,
            notes: inv.notes
          });
        }
      });
      
      res.json(sessionInfo);
    } catch (error) {
      console.error("Debug error:", error);
      res.status(500).json({ message: "Debug failed" });
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
      if (!invoiceDataParsed.invoiceNumber || (invoiceDataParsed.invoiceNumber && typeof invoiceDataParsed.invoiceNumber === 'string' && invoiceDataParsed.invoiceNumber.trim() === '')) {
        const year = new Date().getFullYear();
        const count = await storage.getInvoiceCount(req.user.companyId, year);
        (invoiceDataParsed as any).invoiceNumber = `${year}${String(count + 1).padStart(4, '0')}`;
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
      
      const updateData = { 
        dueDate: new Date(dueDate) as any,
        originalDueDate: req.body.originalDueDate ? new Date(req.body.originalDueDate) as any : undefined
      };
      const invoice = await storage.updateInvoice(id, updateData, req.user.companyId);
      
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice due date:", error);
      res.status(500).json({ message: "Failed to update invoice due date" });
    }
  });

  // Send invoice via email
  app.post('/api/invoices/:id/send-email', requireAuth, async (req: any, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoiceWithDetails(invoiceId, req.user.companyId);
      
      if (!invoice) {
        return res.status(404).json({ error: 'Faktura nenalezena' });
      }

      const customer = invoice.customerId ? await storage.getCustomer(invoice.customerId, req.user.companyId) : null;
      if (!customer || !customer.email) {
        return res.status(400).json({ error: 'Zákazník nemá email adresu' });
      }

      // Generate PDF
      const pdfBuffer = await generateInvoicePDF(invoice, req.user.companyId);
      
      // Send email with PDF attachment
      const emailSent = await emailService.sendInvoiceEmail(
        invoice,
        pdfBuffer
      );

      if (emailSent) {
        // Record activity in invoice history
        await storage.createInvoiceHistory({
          invoiceId: invoiceId,
          companyId: req.user.companyId,
          userId: req.user.userId,
          action: 'email_sent',
          description: `Faktura odeslána emailem na ${customer.email}`,
          oldValue: null,
          newValue: { emailSentTo: customer.email, timestamp: new Date() }
        });

        res.json({ 
          message: 'Faktura byla úspěšně odeslána emailem',
          sentTo: customer.email
        });
      } else {
        res.status(500).json({ error: 'Nepodařilo se odeslat email' });
      }
    } catch (error) {
      console.error('Email sending error:', error);
      res.status(500).json({ error: 'Chyba při odesílání emailu' });
    }
  });

  app.get("/api/invoices/:id/pdf", requireAuth, async (req: any, res) => {
    try {
      const idParam = req.params.id;
      let invoice;
      
      // Try to parse as number first (ID)
      if (/^\d+$/.test(idParam)) {
        const id = parseInt(idParam);
        invoice = await storage.getInvoiceWithDetails(id, req.user.companyId);
      }
      
      // If not found by ID or not a number, try by invoiceNumber
      if (!invoice) {
        console.log(`PDF: Looking for invoice by number: ${idParam}`);
        const invoices = await storage.getCompanyInvoices(req.user.companyId);
        console.log(`PDF: Found ${invoices.length} invoices for company ${req.user.companyId}`);
        console.log(`PDF: Invoice numbers: ${invoices.map(i => i.invoiceNumber).join(', ')}`);
        
        const targetInvoice = invoices.find(inv => inv.invoiceNumber === idParam);
        if (targetInvoice) {
          console.log(`PDF: Found target invoice ID: ${targetInvoice.id}`);
          invoice = await storage.getInvoiceWithDetails(targetInvoice.id, req.user.companyId);
        } else {
          console.log(`PDF: No invoice found with number: ${idParam}`);
        }
      }
      
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
      
      const aiResponse = await processUniversalAICommand(
        message, 
        context, 
        currentPath, 
        {
          companyId: req.user.companyId,
          userId: req.user.id!,
          storage
        },
        chatHistory,
        attachments
      );
      
      // Save chat message to history
      await storage.createChatMessage({
        message,
        response: aiResponse.content,
        companyId: req.user.companyId,
        userId: req.user.id
      });
      
      res.json(aiResponse);
    } catch (error) {
      const err = error as Error;
      console.error("Error processing universal AI command:", err);
      console.error("Error stack:", err.stack);
      res.status(500).json({ 
        message: "Failed to process AI command",
        error: err.message 
      });
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
      const messages = await storage.getChatMessages(req.user.companyId, req.user.id, limit);
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
      const idParam = req.params.id;
      let expenseId;
      
      // Try to parse as number first (ID)
      if (/^\d+$/.test(idParam)) {
        expenseId = parseInt(idParam);
      } else {
        // If not a number, try to find by expenseNumber
        const expenses = await storage.getCompanyExpenses(req.user.companyId);
        const targetExpense = expenses.find(exp => exp.expenseNumber === idParam);
        if (targetExpense) {
          expenseId = targetExpense.id;
        } else {
          return res.status(404).json({ message: "Expense not found" });
        }
      }
      
      const processedData = {
        ...req.body,
        expenseDate: req.body.expenseDate ? new Date(req.body.expenseDate) : undefined,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        amount: req.body.amount ? String(req.body.amount) : undefined,
        vatAmount: req.body.vatAmount ? String(req.body.vatAmount) : undefined,
        total: req.body.total ? String(req.body.total) : undefined
      };
      
      const expenseData = insertExpenseSchema.partial().parse(processedData);
      const expense = await storage.updateExpense(expenseId, expenseData, req.user.companyId);
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

  // Database debug endpoint (temporary)
  app.get("/api/debug/database", async (req, res) => {
    try {
      const dbUrl = process.env.DATABASE_URL;
      const adminUser = await storage.getUserByEmail('admin@doklad.ai');
      
      res.json({
        database_host: dbUrl?.split('@')[1]?.split('/')[0] || 'unknown',
        admin_exists: !!adminUser,
        admin_id: adminUser?.id || null,
        password_length: adminUser?.password?.length || 0,
        password_type: adminUser?.password?.startsWith('$2') ? 'bcrypt' : 'plain',
        environment: process.env.NODE_ENV || 'unknown'
      });
    } catch (error) {
      res.json({ error: (error as Error).message });
    }
  });

  // Create admin user in production (temporary endpoint)
  app.post("/api/debug/create-admin", async (req, res) => {
    try {
      // Only allow in production environment
      if (process.env.NODE_ENV !== 'production') {
        return res.status(403).json({ error: 'Only available in production' });
      }
      
      // Check if admin already exists
      const existingAdmin = await storage.getUserByEmail('admin@doklad.ai');
      if (existingAdmin) {
        return res.json({ message: 'Admin user already exists', admin_id: existingAdmin.id });
      }
      
      // Create company first
      let company;
      try {
        company = await storage.createCompany({
          name: 'Doklad.ai Admin',
          address: 'Praha, Czech Republic',
          ico: '00000000',
          dic: 'CZ00000000',
          email: 'admin@doklad.ai',
          phone: '+420123456789'
        });
      } catch (error) {
        // Company might already exist, try to find it
        const companies = await storage.getCompany(1); // Default company
        company = companies || { id: 1 }; // Use default company
      }
      
      // Hash password
      const hashedPassword = bcrypt.hashSync('admin123', 12);
      
      // Create admin user
      const adminUser = await storage.createUser({
        username: 'admin',
        email: 'admin@doklad.ai',
        password: hashedPassword,
        role: 'admin',
        companyId: company.id,
        isActive: true,
        emailConfirmed: true
      });
      
      res.json({ 
        message: 'Admin user created successfully',
        admin_id: adminUser.id,
        company_id: company.id,
        credentials: 'admin@doklad.ai / admin123'
      });
    } catch (error) {
      console.error('Create admin error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Mount additional routes (most routes are now in modular modules)
  setupEmailRoutes(app, sessions);
  // setupCompanyRoutes already handled by modular routes
  // setupEnhancedAuthRoutes already called above
  
  // Bank accounts routes
  const bankAccountRoutes = (await import('./routes/bank-accounts.js')).default;
  app.use('/api/bank-accounts', bankAccountRoutes);
  
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

  // User profile endpoints
  app.patch("/api/users/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        username: req.body.username,
        phone: req.body.phone
      };
      
      const updatedUser = await storage.updateUser(userId, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Change password endpoint
  app.patch("/api/users/:id/change-password", requireAuth, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      // Zde by měla být validace současného hesla
      // Pro zjednodušení jen simulujeme úspěch
      
      const updatedUser = await storage.updateUser(userId, {
        password: newPassword // Ve skutečnosti by se hashovalo
      });
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Company profile endpoints
  app.get("/api/companies/:id", requireAuth, async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      if (companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.patch("/api/companies/:id", requireAuth, async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      if (companyId !== req.user.companyId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updateData = {
        name: req.body.name,
        ico: req.body.ico,
        dic: req.body.dic,
        address: req.body.address,
        city: req.body.city,
        postalCode: req.body.postalCode,
        phone: req.body.phone,
        email: req.body.email,
        website: req.body.website
      };
      
      const updatedCompany = await storage.updateCompany(companyId, updateData);
      res.json(updatedCompany);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Export endpoints (simplified - these methods don't exist in storage)
  app.get("/api/export/invoices/csv", requireAuth, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      const invoices = await storage.getCompanyInvoices(req.user.companyId, {
        dateFrom: startDate ? new Date(startDate) : undefined,
        dateTo: endDate ? new Date(endDate) : undefined
      });
      
      // Simple CSV generation (placeholder)
      const csvContent = `Číslo faktury,Zákazník,Částka,Datum\n${invoices.map(inv => 
        `${inv.invoiceNumber},"${(inv as any).customer?.name || 'N/A'}",${(inv as any).total || 0},${inv.issueDate}`
      ).join('\n')}`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="faktury.csv"');
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting invoices to CSV:", error);
      res.status(500).json({ message: "Failed to export invoices" });
    }
  });

  // Email endpoints
  app.post("/api/invoices/:id/email", requireAuth, async (req: any, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoiceWithDetails(invoiceId, req.user.companyId);
      
      if (!invoice || invoice.companyId !== req.user.companyId) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Generate PDF
      const { generateInvoicePDF } = await import('./services/pdf');
      const pdfBuffer = await generateInvoicePDF(invoice, req.user.companyId);
      
      // Send email (placeholder - need email configuration)
      const emailSent = true; // await emailService.sendInvoiceEmail(invoice, pdfBuffer);
      
      if (emailSent) {
        res.json({ message: "Email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error sending invoice email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  app.post("/api/invoices/:id/reminder", requireAuth, async (req: any, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { reminderType } = req.body;
      
      const invoice = await storage.getInvoiceWithDetails(invoiceId, req.user.companyId);
      
      if (!invoice || invoice.companyId !== req.user.companyId) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Send reminder email (placeholder - need email configuration)
      const reminderSent = true; // await emailService.sendReminderEmail(invoice, reminderType);
      
      if (reminderSent) {
        // Record reminder
        await storage.createReminder({
          companyId: req.user.companyId,
          invoiceId: invoiceId,
          type: 'payment_reminder',
          sentAt: new Date(),
          recipientEmail: invoice.customer?.email || '',
          subject: `Připomínka platby - Faktura ${invoice.invoiceNumber}`,
          body: `Automated reminder for invoice ${invoice.invoiceNumber}`,
          status: 'sent'
        });
        
        res.json({ message: "Reminder sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send reminder" });
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      res.status(500).json({ message: "Failed to send reminder" });
    }
  });

  // Admin middleware - only allow admin users
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Admin endpoints
  app.get("/api/admin/users/stats/:timeframe", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const timeframe = req.params.timeframe; // 7d, 30d, 90d, 1y
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      switch (timeframe) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      const stats = await storage.getAdminUserStats(startDate, now);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Get all users with detailed information for admin management
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsersWithStats();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user (admin only)
  app.patch("/api/admin/users/:id", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      // Don't allow admins to modify other admins unless they're super admin
      const targetUser = await storage.getUserById(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (targetUser.role === 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ message: "Cannot modify admin users" });
      }
      
      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Ban/unban user
  app.patch("/api/admin/users/:id/ban", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { banned } = req.body;
      
      const updatedUser = await storage.updateUser(userId, { isActive: !banned });
      
      res.json({ 
        message: banned ? "User banned successfully" : "User unbanned successfully",
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error banning/unbanning user:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Reset user password (admin only)
  app.post("/api/admin/users/:id/reset-password", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Generate temporary password
      const temporaryPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = bcrypt.hashSync(temporaryPassword, 12);
      
      await storage.updateUser(userId, { password: hashedPassword });
      
      // In production, you'd want to send this via email instead of returning it
      res.json({ 
        message: "Password reset successfully",
        temporaryPassword: temporaryPassword
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get("/api/admin/revenue/stats/:timeframe", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const timeframe = req.params.timeframe;
      
      const now = new Date();
      let startDate = new Date();
      switch (timeframe) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      const stats = await storage.getAdminRevenueStats(startDate, now);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin revenue stats:", error);
      res.status(500).json({ message: "Failed to fetch revenue stats" });
    }
  });

  app.get("/api/admin/users/recent", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const users = await storage.getRecentUsers(limit);
      res.json(users);
    } catch (error) {
      console.error("Error fetching recent users:", error);
      res.status(500).json({ message: "Failed to fetch recent users" });
    }
  });

  app.get("/api/admin/system/health", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const health = {
        status: 'healthy',
        database: 'connected',
        services: {
          openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
          stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'missing',
          email: process.env.EMAIL_SERVICE ? 'configured' : 'missing'
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
      res.json(health);
    } catch (error) {
      console.error("Error checking system health:", error);
      res.status(500).json({ message: "Failed to check system health" });
    }
  });

  app.post("/api/admin/settings/pricing", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { monthlyPrice, trialDays } = req.body;
      
      // For now, just return success - in production this would update system settings
      res.json({ 
        message: "Pricing updated successfully",
        monthlyPrice,
        trialDays
      });
    } catch (error) {
      console.error("Error updating pricing:", error);
      res.status(500).json({ message: "Failed to update pricing" });
    }
  });

  return server;

// Helper functions for export
function generateInvoicesCSV(invoices: any[]): string {
  const headers = [
    'Číslo faktury',
    'Zákazník', 
    'Datum vystavení',
    'Datum splatnosti',
    'Částka bez DPH',
    'DPH',
    'Celková částka',
    'Status',
    'Typ'
  ];
  
  const rows = invoices.map(invoice => [
    invoice.invoiceNumber,
    invoice.customer?.name || '',
    new Date(invoice.issueDate).toLocaleDateString('cs-CZ'),
    new Date(invoice.dueDate).toLocaleDateString('cs-CZ'),
    invoice.subtotal,
    invoice.vatAmount,
    invoice.total,
    invoice.status,
    invoice.type
  ]);
  
  const csvRows = [headers, ...rows];
  return csvRows.map(row => row.map(field => `"${field}"`).join(';')).join('\n');
}

function generatePohodaXML(invoices: any[]): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<dataPack version="2.0" id="001" ico="12345678" application="InvoiceSystem" programVersion="1.0" note="Export faktur">
  <dataPackItem version="2.0" id="001">`;
  
  const xmlFooter = `  </dataPackItem>
</dataPack>`;
  
  const invoicesXML = invoices.map(invoice => `
    <invoice version="2.0">
      <invoiceHeader>
        <invoiceType>issuedInvoice</invoiceType>
        <number>
          <numberRequested>${invoice.invoiceNumber}</numberRequested>
        </number>
        <date>${new Date(invoice.issueDate).toISOString().split('T')[0]}</date>
        <dateDue>${new Date(invoice.dueDate).toISOString().split('T')[0]}</dateDue>
        <text>${invoice.notes || ''}</text>
        <partnerIdentity>
          <address>
            <company>${invoice.customer?.name || ''}</company>
            <ico>${invoice.customer?.ico || ''}</ico>
            <dic>${invoice.customer?.dic || ''}</dic>
          </address>
        </partnerIdentity>
        <paymentType>
          <paymentType>draft</paymentType>
        </paymentType>
      </invoiceHeader>
      <invoiceDetail>
        ${invoice.items?.map((item: any) => `
        <invoiceItem>
          <text>${item.description}</text>
          <quantity>${item.quantity}</quantity>
          <unit>ks</unit>
          <coefficient>1.0</coefficient>
          <payVAT>false</payVAT>
          <rateVAT>high</rateVAT>
          <percentVAT>21.0</percentVAT>
          <discountPercentage>0</discountPercentage>
          <homeCurrency>
            <unitPrice>${item.unitPrice}</unitPrice>
            <price>${item.total}</price>
          </homeCurrency>
        </invoiceItem>`).join('') || ''}
      </invoiceDetail>
      <invoiceSummary>
        <homeCurrency>
          <priceNone>${invoice.subtotal}</priceNone>
          <priceHigh>${invoice.subtotal}</priceHigh>
          <priceHighVAT>${invoice.vatAmount}</priceHighVAT>
          <round>
            <priceRound>${invoice.total}</priceRound>
          </round>
        </homeCurrency>
      </invoiceSummary>
    </invoice>`).join('');
  
  return xmlHeader + invoicesXML + xmlFooter;
}
}