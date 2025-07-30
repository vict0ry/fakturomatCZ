import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { insertCustomerSchema } from '@shared/schema';

const router = Router();

// All customer routes require authentication
router.use(requireAuth);

// Customer form validation schema
const customerFormSchema = insertCustomerSchema.omit({
  id: true,
  companyId: true,
  createdAt: true,
  updatedAt: true
});

// GET /api/customers - Get all customers for company
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const { page = 1, limit = 50, search } = req.query;
    
    const customers = await storage.getCustomers(user.companyId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string
    });
    
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/customers - Create new customer
router.post('/', async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Validate request body
    const validatedData = customerFormSchema.parse(req.body);
    
    // Create customer
    const customer = await storage.createCustomer({
      ...validatedData,
      companyId: user.companyId
    });
    
    res.status(201).json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/customers/:id - Get specific customer
router.get('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const customerId = parseInt(req.params.id);
    
    const customer = await storage.getCustomer(customerId, user.companyId);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Check if customer belongs to user's company
    if (customer.companyId !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/customers/:id - Update customer
router.patch('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const customerId = parseInt(req.params.id);
    
    // Check if customer exists and belongs to user's company
    const existingCustomer = await storage.getCustomer(customerId, user.companyId);
    if (!existingCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    if (existingCustomer.companyId !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Validate partial update data
    const updateSchema = customerFormSchema.partial();
    const validatedData = updateSchema.parse(req.body);
    
    // Update customer
    const updatedCustomer = await storage.updateCustomer(customerId, validatedData, user.companyId);
    
    res.json(updatedCustomer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const customerId = parseInt(req.params.id);
    
    // Check if customer exists and belongs to user's company
    const existingCustomer = await storage.getCustomer(customerId, user.companyId);
    if (!existingCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    if (existingCustomer.companyId !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Soft delete - set isActive to false
    await storage.updateCustomer(customerId, { isActive: false }, user.companyId);
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;