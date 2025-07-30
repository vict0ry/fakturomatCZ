import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { insertBankAccountSchema } from '@shared/schema';

const router = Router();

// All bank account routes require authentication
router.use(requireAuth);

// Bank account form validation schema
const bankAccountFormSchema = insertBankAccountSchema.omit({
  id: true,
  companyId: true,
  createdAt: true,
  updatedAt: true,
  paymentEmail: true,
  paymentEmailPassword: true,
  emailToken: true,
  lastProcessedPayment: true
});

// GET /api/bank-accounts - Get all bank accounts for company
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const bankAccounts = await storage.getBankAccountsByCompany(user.companyId);
    
    res.json(bankAccounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/bank-accounts - Create new bank account
router.post('/', async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Validate request body
    const validatedData = bankAccountFormSchema.parse(req.body);
    
    // Generate unique payment email and credentials if payment matching is enabled
    let paymentEmail = null;
    let paymentEmailPassword = null;
    let emailToken = null;
    
    if (validatedData.enablePaymentMatching) {
      // Generate unique token for email
      emailToken = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      // Create payment email like: bank.{accountNumber}.{token}@doklad.ai
      const cleanAccountNumber = validatedData.accountNumber.replace(/[^0-9]/g, '');
      paymentEmail = `bank.${cleanAccountNumber}.${emailToken}@doklad.ai`;
      
      // Generate secure password
      paymentEmailPassword = Math.random().toString(36).substring(2, 15) + 
                            Math.random().toString(36).substring(2, 15);
    }
    
    // Create bank account
    const bankAccount = await storage.createBankAccount({
      ...validatedData,
      companyId: user.companyId,
      paymentEmail,
      paymentEmailPassword,
      emailToken
    });
    
    res.status(201).json(bankAccount);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error creating bank account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/bank-accounts/:id - Get specific bank account
router.get('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const bankAccountId = parseInt(req.params.id);
    
    const bankAccount = await storage.getBankAccount(bankAccountId);
    
    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }
    
    // Check if bank account belongs to user's company
    if (bankAccount.companyId !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(bankAccount);
  } catch (error) {
    console.error('Error fetching bank account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/bank-accounts/:id - Update bank account
router.patch('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const bankAccountId = parseInt(req.params.id);
    
    // Check if bank account exists and belongs to user's company
    const existingAccount = await storage.getBankAccount(bankAccountId);
    if (!existingAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }
    
    if (existingAccount.companyId !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Validate partial update data
    const updateSchema = bankAccountFormSchema.partial();
    const validatedData = updateSchema.parse(req.body);
    
    // Handle payment email generation if payment matching was enabled
    let updateData = { ...validatedData };
    
    if (validatedData.enablePaymentMatching && !existingAccount.paymentEmail) {
      // Generate payment email credentials for the first time
      const emailToken = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
      
      const cleanAccountNumber = existingAccount.accountNumber.replace(/[^0-9]/g, '');
      updateData.paymentEmail = `bank.${cleanAccountNumber}.${emailToken}@doklad.ai`;
      updateData.paymentEmailPassword = Math.random().toString(36).substring(2, 15) + 
                                       Math.random().toString(36).substring(2, 15);
      updateData.emailToken = emailToken;
    }
    
    // Update bank account
    const updatedAccount = await storage.updateBankAccount(bankAccountId, updateData);
    
    res.json(updatedAccount);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error updating bank account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/bank-accounts/:id - Delete bank account
router.delete('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    const bankAccountId = parseInt(req.params.id);
    
    // Check if bank account exists and belongs to user's company
    const existingAccount = await storage.getBankAccount(bankAccountId);
    if (!existingAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }
    
    if (existingAccount.companyId !== user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Soft delete - set isActive to false
    await storage.updateBankAccount(bankAccountId, { isActive: false });
    
    res.json({ message: 'Bank account deleted successfully' });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;