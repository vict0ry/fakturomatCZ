import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { insertInvoiceSchema, insertInvoiceItemSchema } from '@shared/schema';

const router = Router();

// All invoice routes require authentication
router.use(requireAuth);

// Invoice form validation schema
const invoiceFormSchema = insertInvoiceSchema.omit({
  id: true,
  companyId: true,
  userId: true,
  createdAt: true,
  updatedAt: true
}).extend({
  items: z.array(insertInvoiceItemSchema.omit({
    id: true,
    invoiceId: true
  }))
});

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
    
    // Validate request body
    const validatedData = invoiceFormSchema.parse(req.body);
    
    // Create invoice with items
    const invoice = await storage.createInvoiceWithItems({
      ...validatedData,
      companyId: user.companyId,
      userId: user.id
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
    
    const invoice = await storage.getInvoiceWithItems(invoiceId);
    
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
    const existingInvoice = await storage.getInvoice(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    if (existingInvoice.companyId !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Validate partial update data
    const updateSchema = invoiceFormSchema.partial();
    const validatedData = updateSchema.parse(req.body);
    
    // Update invoice
    const updatedInvoice = await storage.updateInvoice(invoiceId, validatedData);
    
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
    const existingInvoice = await storage.getInvoice(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    if (existingInvoice.companyId !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete invoice
    await storage.deleteInvoice(invoiceId);
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;