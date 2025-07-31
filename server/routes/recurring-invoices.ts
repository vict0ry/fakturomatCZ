import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

const recurringInvoiceSchema = z.object({
  templateName: z.string().min(1, "Název šablony je povinný"),
  customerId: z.number().min(1, "Zákazník je povinný"),
  frequency: z.enum(["monthly", "quarterly", "yearly"]),
  interval: z.number().min(1).max(12),
  startDate: z.string().min(1, "Datum začátku je povinné"),
  endDate: z.string().optional(),
  maxCount: z.number().optional(),
  notes: z.string().optional(),
});

// Get all recurring invoices for the company
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const companyId = req.user.companyId;
    
    // Mock data for now - will be replaced with real database calls
    const recurringInvoices = [
      {
        id: 1,
        templateName: "Měsíční hosting",
        customer: { id: 1, name: "ACME s.r.o." },
        frequency: "monthly",
        interval: 1,
        nextInvoiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        totalGenerated: 12,
        lastGenerated: new Date().toISOString(),
      },
      {
        id: 2,
        templateName: "Čtvrtletní konzultace",
        customer: { id: 2, name: "Firma XYZ a.s." },
        frequency: "quarterly",
        interval: 1,
        nextInvoiceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: false,
        totalGenerated: 4,
        lastGenerated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
    
    res.json(recurringInvoices);
  } catch (error) {
    console.error('Error fetching recurring invoices:', error);
    res.status(500).json({ message: 'Failed to fetch recurring invoices' });
  }
});

// Create new recurring invoice
router.post('/', requireAuth, async (req: any, res) => {
  try {
    const validation = recurringInvoiceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.error.errors 
      });
    }

    const data = validation.data;
    const companyId = req.user.companyId;
    const userId = req.user.id;

    // For now, create a mock recurring invoice
    const recurringInvoice = {
      id: Date.now(), // Mock ID
      ...data,
      companyId,
      userId,
      isActive: true,
      totalGenerated: 0,
      nextInvoiceDate: data.startDate,
      createdAt: new Date().toISOString(),
    };

    console.log('Created recurring invoice:', recurringInvoice);
    
    res.status(201).json({
      message: 'Recurring invoice created successfully',
      data: recurringInvoice
    });
  } catch (error) {
    console.error('Error creating recurring invoice:', error);
    res.status(500).json({ message: 'Failed to create recurring invoice' });
  }
});

// Toggle active status
router.patch('/:id/toggle', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    console.log(`Toggling recurring invoice ${id} to ${isActive ? 'active' : 'inactive'}`);
    
    res.json({
      message: 'Recurring invoice status updated',
      data: { id: parseInt(id), isActive }
    });
  } catch (error) {
    console.error('Error toggling recurring invoice:', error);
    res.status(500).json({ message: 'Failed to toggle recurring invoice' });
  }
});

// Delete recurring invoice
router.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Deleting recurring invoice ${id}`);
    
    res.json({
      message: 'Recurring invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recurring invoice:', error);
    res.status(500).json({ message: 'Failed to delete recurring invoice' });
  }
});

export default router;