import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { insertExpenseSchema, insertExpenseItemSchema } from '@shared/schema';

const router = Router();

// All expense routes require authentication
router.use(requireAuth);

// Expense form validation schema
const expenseFormSchema = insertExpenseSchema.omit({
  id: true,
  companyId: true,
  userId: true,
  createdAt: true,
  updatedAt: true
}).extend({
  items: z.array(insertExpenseItemSchema.omit({
    id: true,
    expenseId: true
  }))
});

// GET /api/expenses - Get all expenses for company
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const { page = 1, limit = 50, category, supplierId } = req.query;
    
    const expenses = await storage.getExpenses(user.companyId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      category: category as string,
      supplierId: supplierId ? parseInt(supplierId as string) : undefined
    });
    
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/expenses - Create new expense
router.post('/', async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Validate request body
    const validatedData = expenseFormSchema.parse(req.body);
    
    // Create expense with items
    const expense = await storage.createExpenseWithItems({
      ...validatedData,
      companyId: user.companyId,
      userId: user.id
    });
    
    res.status(201).json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/expenses/:id - Get specific expense
router.get('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const expenseId = parseInt(req.params.id);
    
    const expense = await storage.getExpenseWithItems(expenseId);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Check if expense belongs to user's company
    if (expense.companyId !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/expenses/:id - Update expense
router.patch('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const expenseId = parseInt(req.params.id);
    
    // Check if expense exists and belongs to user's company
    const existingExpense = await storage.getExpense(expenseId);
    if (!existingExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    if (existingExpense.companyId !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Validate partial update data
    const updateSchema = expenseFormSchema.partial();
    const validatedData = updateSchema.parse(req.body);
    
    // Update expense
    const updatedExpense = await storage.updateExpense(expenseId, validatedData);
    
    res.json(updatedExpense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const expenseId = parseInt(req.params.id);
    
    // Check if expense exists and belongs to user's company
    const existingExpense = await storage.getExpense(expenseId);
    if (!existingExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    if (existingExpense.companyId !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete expense
    await storage.deleteExpense(expenseId);
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;