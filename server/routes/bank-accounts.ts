import { Router } from 'express';
import { z } from 'zod';
import { BankAccountService } from '../services/bank-account-service.js';
import { insertBankAccountSchema } from '../../shared/schema.js';

const router = Router();
const bankAccountService = new BankAccountService();

// Validation schemas
const createBankAccountSchema = insertBankAccountSchema.omit({ 
  id: true, 
  companyId: true, 
  createdAt: true, 
  updatedAt: true,
  paymentEmail: true,
  paymentEmailPassword: true,
  emailToken: true,
  lastProcessedPayment: true,
});

const updateBankAccountSchema = createBankAccountSchema.partial();

// Simple auth middleware
const requireAuth = (req: any, res: any, next: any) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  // Simple session check - in production use proper authentication
  if (!sessionId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  req.user = { companyId: 1, id: 1 }; // Mock user for now
  next();
};

// GET /api/bank-accounts - Get all bank accounts for company
router.get('/', requireAuth, async (req, res) => {
  try {
    const accounts = await bankAccountService.getBankAccountsByCompany(req.user.companyId);
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/bank-accounts/:id - Get specific bank account
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }

    const account = await bankAccountService.getBankAccountById(id, req.user.companyId);
    if (!account) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error('Error fetching bank account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/bank-accounts - Create new bank account
router.post('/', requireAuth, async (req, res) => {
  try {
    const validatedData = createBankAccountSchema.parse(req.body);

    // Check if account number already exists
    const exists = await bankAccountService.isAccountNumberExists(
      validatedData.accountNumber, 
      req.user.companyId
    );
    
    if (exists) {
      return res.status(400).json({ 
        message: 'Bank account with this number already exists' 
      });
    }

    const account = await bankAccountService.createBankAccount(req.user.companyId, validatedData);
    res.status(201).json(account);
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

// PATCH /api/bank-accounts/:id - Update bank account
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }

    const validatedData = updateBankAccountSchema.parse(req.body);

    // If updating account number, check if it already exists
    if (validatedData.accountNumber) {
      const exists = await bankAccountService.isAccountNumberExists(
        validatedData.accountNumber, 
        req.user.companyId,
        id
      );
      
      if (exists) {
        return res.status(400).json({ 
          message: 'Bank account with this number already exists' 
        });
      }
    }

    const account = await bankAccountService.updateBankAccount(id, req.user.companyId, validatedData);
    if (!account) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    res.json(account);
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

// POST /api/bank-accounts/:id/generate-email - Generate payment email
router.post('/:id/generate-email', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }

    const result = await bankAccountService.generatePaymentEmail(id, req.user.companyId);
    res.json({
      message: 'Payment email generated successfully',
      email: result.email,
      // Don't return password in response for security
    });
  } catch (error) {
    console.error('Error generating payment email:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('Mailcow')) {
        return res.status(502).json({ message: 'Email service temporarily unavailable' });
      }
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/bank-accounts/:id - Delete bank account
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }

    const success = await bankAccountService.deleteBankAccount(id, req.user.companyId);
    if (!success) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    res.json({ message: 'Bank account deleted successfully' });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;