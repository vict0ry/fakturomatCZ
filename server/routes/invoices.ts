import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { insertInvoiceSchema, insertInvoiceItemSchema } from '@shared/schema';

// Frontend compatible schema - accepts string dates
const invoiceFormSchema = z.object({
  customerId: z.number(),
  type: z.enum(["invoice", "proforma", "credit_note"]).default("invoice"),
  invoiceNumber: z.string().optional(),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  subtotal: z.string().default("0"),
  vatAmount: z.string().default("0"),
  total: z.string().default("0"),
  currency: z.string().default("CZK"),
  paymentMethod: z.enum(["bank_transfer", "card", "cash", "online", "cheque"]).default("bank_transfer"),
  bankAccount: z.string().optional(),
  variableSymbol: z.string().optional(),
  constantSymbol: z.string().optional(),
  specificSymbol: z.string().optional(),
  paymentReference: z.string().optional(),
  deliveryMethod: z.enum(["email", "post", "pickup", "courier"]).default("email"),
  deliveryAddress: z.string().optional(),
  orderNumber: z.string().optional(),
  warranty: z.string().optional(),
  isReverseCharge: z.boolean().default(false),
  status: z.enum(["draft", "sent", "paid", "overdue"]).default("draft"),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.string().min(1, "Quantity is required"),
    unit: z.string().default("ks"),
    unitPrice: z.string().min(1, "Unit price is required"),
    vatRate: z.string().default("21"),
    discountType: z.string().default("none"),
    discountValue: z.string().default("0"),
    total: z.string().default("0"),
  })).min(1, "At least one item is required"),
});

const router = Router();

// All invoice routes require authentication
router.use(requireAuth);

// Use the frontend compatible schema defined above

// GET /api/invoices - Get all invoices for company
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const { page = 1, limit = 50, status, customerId } = req.query;
    
    const invoices = await storage.getInvoices(user.companyId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string,
      customerId: customerId ? parseInt(customerId as string) : undefined
    });
    
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/invoices/recent - Get recent invoices
router.get('/recent', async (req, res) => {
  try {
    const user = (req as any).user;
    const recentInvoices = await storage.getRecentInvoices(user.companyId, 10);
    
    res.json(recentInvoices);
  } catch (error) {
    console.error('Error fetching recent invoices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/invoices - Create new invoice
router.post('/', async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Handle customer creation if customerId is -1
    let invoiceData = { ...req.body };
    
    if (req.body.customerId === -1 && req.body.customer) {
      console.log('Creating new customer for invoice with data:', req.body.customer);
      const customerData = {
        ...req.body.customer,
        companyId: user.companyId,
      };
      
      // Remove auto-generated fields
      delete customerData.id;
      delete customerData.createdAt;
      delete customerData.updatedAt;
      
      const newCustomer = await storage.createCustomer(customerData);
      console.log('New customer created with ID:', newCustomer.id);
      
      // Update invoice data with the new customer ID
      invoiceData.customerId = newCustomer.id;
    }
    
    // Remove the embedded customer object since we don't need it anymore
    delete invoiceData.customer;
    
    // Validate request body using frontend-compatible schema
    const validatedData = invoiceFormSchema.parse(invoiceData);
    
    // Generate invoice number if not provided
    if (!validatedData.invoiceNumber) {
      const year = new Date().getFullYear();
      const timestamp = Date.now();
      validatedData.invoiceNumber = `${year}${String(timestamp).slice(-6)}`;
    }

    // Convert string dates to Date objects for database storage
    const processedData = {
      ...validatedData,
      invoiceNumber: validatedData.invoiceNumber,
      issueDate: new Date(validatedData.issueDate),
      dueDate: new Date(validatedData.dueDate),
      companyId: user.companyId,
      userId: user.id
    };
    
    // Create invoice with items  
    const invoice = await storage.createInvoiceWithItems(processedData);
    
    // Log invoice creation to history
    await storage.createInvoiceHistory({
      invoiceId: invoice.id,
      companyId: user.companyId,
      userId: user.id,
      action: 'created',
      description: `Faktura ${invoice.invoiceNumber} byla vytvořena ručně prostřednictvím formuláře`,
      metadata: JSON.stringify({
        type: processedData.type,
        amount: processedData.total,
        currency: processedData.currency,
        source: 'manual_form',
        itemCount: processedData.items?.length || 0
      })
    });
    
    res.status(201).json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/invoices/:id - Get specific invoice
router.get('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const invoiceId = parseInt(req.params.id);
    
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: 'Invalid invoice ID' });
    }
    
    const invoice = await storage.getInvoiceWithItems(invoiceId, user.companyId);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Check if invoice belongs to user's company
    if (invoice.companyId !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/invoices/:id - Update invoice
router.patch('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const invoiceId = parseInt(req.params.id);
    
    // Check if invoice exists and belongs to user's company
    const existingInvoice = await storage.getInvoice(invoiceId, user.companyId);
    if (!existingInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    if (existingInvoice.companyId !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Debug logging for update request
    console.log('=== INVOICE UPDATE DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Items in request:', req.body.items?.length || 0);
    if (req.body.items) {
      console.log('Items details:', req.body.items.map((item: any, index: number) => ({
        index,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })));
    }
    
    // Validate partial update data
    const updateSchema = invoiceFormSchema.partial();
    const validatedData = updateSchema.parse(req.body);
    
    console.log('Validated data items:', validatedData.items?.length || 0);
    
    // Convert string dates to Date objects if present
    const processedUpdateData: any = { ...validatedData };
    if (processedUpdateData.issueDate) {
      processedUpdateData.issueDate = new Date(processedUpdateData.issueDate);
    }
    if (processedUpdateData.dueDate) {
      processedUpdateData.dueDate = new Date(processedUpdateData.dueDate);
    }

    // Handle items changes if provided
    let itemsChanged = false;
    if (processedUpdateData.items) {
      const oldItems = await storage.getInvoiceItems(invoiceId);
      const newItems = processedUpdateData.items;
      
      // First, delete all old items
      for (const oldItem of oldItems) {
        await storage.deleteInvoiceItem(oldItem.id);
      }
      
      // Then create all new items and log each addition
      for (const newItem of newItems) {
        const createdItem = await storage.createInvoiceItem({
          ...newItem,
          invoiceId: invoiceId
        });
        
        // Log each item addition
        await storage.createInvoiceHistory({
          invoiceId: invoiceId,
          companyId: user.companyId,
          userId: user.id,
          action: 'item_updated_via_form',
          description: `Položka "${newItem.description}" byla upravena prostřednictvím formuláře (${newItem.quantity} ${newItem.unit} za ${newItem.unitPrice})`,
          metadata: JSON.stringify({
            itemDescription: newItem.description,
            quantity: newItem.quantity,
            unit: newItem.unit,
            unitPrice: newItem.unitPrice,
            total: newItem.total,
            source: 'form_edit'
          })
        });
      }
      
      itemsChanged = true;
      delete processedUpdateData.items; // Remove items from invoice update data
    }

    // Update invoice
    const updatedInvoice = await storage.updateInvoice(invoiceId, processedUpdateData, user.companyId);
    
    // Log invoice update to history
    const changedFields = Object.keys(processedUpdateData).filter(key => processedUpdateData[key] !== undefined);
    if (changedFields.length > 0) {
      await storage.createInvoiceHistory({
        invoiceId: invoiceId,
        companyId: user.companyId,
        userId: user.id,
        action: 'updated',
        description: `Faktura ${existingInvoice.invoiceNumber} byla upravena (${changedFields.join(', ')})${itemsChanged ? ', položky' : ''}`,
        metadata: JSON.stringify({
          changedFields,
          oldValues: changedFields.reduce((acc, field) => {
            acc[field] = (existingInvoice as any)[field];
            return acc;
          }, {} as any),
          newValues: processedUpdateData,
          itemsChanged,
          source: 'manual_edit'
        })
      });
    } else if (itemsChanged) {
      // Log if only items were changed
      await storage.createInvoiceHistory({
        invoiceId: invoiceId,
        companyId: user.companyId,
        userId: user.id,
        action: 'items_updated',
        description: `Položky faktury ${existingInvoice.invoiceNumber} byly upraveny prostřednictvím formuláře`,
        metadata: JSON.stringify({
          source: 'form_edit',
          itemsCount: processedUpdateData.items?.length || 0
        })
      });
    }
    
    res.json(updatedInvoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const invoiceId = parseInt(req.params.id);
    
    // Check if invoice exists and belongs to user's company
    const existingInvoice = await storage.getInvoice(invoiceId, user.companyId);
    if (!existingInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    if (existingInvoice.companyId !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete invoice
    await storage.deleteInvoice(invoiceId, user.companyId);
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;