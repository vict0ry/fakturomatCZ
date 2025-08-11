import express from 'express';
import { z } from 'zod';
import { paymentMatchingService } from '../services/payment-matching-service.js';
import { emailWebhookService } from '../services/email-webhook-service.js';
import { requireAuth } from '../middleware/auth.js';
import { storage } from '../storage.js';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Validation schemas
const processEmailSchema = z.object({
  emailContent: z.string().min(1),
  bankAccountId: z.number().int().positive()
});

const manualMatchSchema = z.object({
  transactionId: z.number().int().positive(),
  invoiceId: z.number().int().positive()
});

const webhookSchema = z.object({
  from: z.string().email(),
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    contentType: z.string()
  })).optional(),
  timestamp: z.string()
});

// POST /api/payment-matching/process-email - Process bank statement email
router.post('/process-email', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const validatedData = processEmailSchema.parse(req.body);
    
    // Check if bank account belongs to user's company
    const bankAccount = await storage.getBankAccount(validatedData.bankAccountId);
    if (!bankAccount || bankAccount.companyId !== user.companyId) {
      return res.status(404).json({ message: 'Bank account not found' });
    }
    
    const result = await paymentMatchingService.processBankStatementEmail(
      validatedData.emailContent,
      validatedData.bankAccountId,
      user.companyId
    );
    
    res.json({
      success: true,
      message: `Processed ${result.processed} payments, ${result.matched} matched`,
      data: result
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error processing email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/payment-matching/webhook - Email webhook endpoint
router.post('/webhook', async (req, res) => {
  try {
    const validatedData = webhookSchema.parse(req.body);
    
    const result = await emailWebhookService.processEmailWebhook(validatedData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid webhook data', 
        errors: error.errors 
      });
    }
    
    console.error('Error processing webhook:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/payment-matching/stats - Get payment matching statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    const stats = await paymentMatchingService.getMatchingStats(user.companyId);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error getting matching stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/payment-matching/unmatched - Get unmatched payments
router.get('/unmatched', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    const unmatchedPayments = await paymentMatchingService.getUnmatchedPayments(user.companyId);
    
    res.json({
      success: true,
      data: unmatchedPayments
    });
    
  } catch (error) {
    console.error('Error getting unmatched payments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/payment-matching/manual-match - Manual payment matching
router.post('/manual-match', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const validatedData = manualMatchSchema.parse(req.body);
    
    await paymentMatchingService.manualMatchPayment(
      validatedData.transactionId,
      validatedData.invoiceId,
      user.id,
      user.companyId
    );
    
    res.json({
      success: true,
      message: 'Payment matched successfully'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error manual matching payment:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// POST /api/payment-matching/test - Test email processing
router.post('/test', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { bankAccountId } = req.body;
    
    if (!bankAccountId) {
      return res.status(400).json({ message: 'Bank account ID is required' });
    }
    
    // Check if bank account belongs to user's company
    const bankAccount = await storage.getBankAccount(bankAccountId);
    if (!bankAccount || bankAccount.companyId !== user.companyId) {
      return res.status(404).json({ message: 'Bank account not found' });
    }
    
    const result = await emailWebhookService.testEmailProcessing(
      bankAccountId,
      user.companyId
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('Error testing email processing:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/payment-matching/transactions - Get bank transactions
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { limit = 50, offset = 0, matched } = req.query;
    
    let query = storage.db.select()
      .from(storage.db.bankTransactions)
      .where(eq(storage.db.bankTransactions.companyId, user.companyId));
    
    if (matched !== undefined) {
      const isMatched = matched === 'true';
      query = query.where(eq(storage.db.bankTransactions.isMatched, isMatched));
    }
    
    const transactions = await query
      .orderBy(desc(storage.db.bankTransactions.transactionDate))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    res.json({
      success: true,
      data: transactions
    });
    
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/payment-matching/matches - Get payment matches
router.get('/matches', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { limit = 50, offset = 0 } = req.query;
    
    const matches = await storage.db.select()
      .from(storage.db.paymentMatches)
      .where(eq(storage.db.paymentMatches.companyId, user.companyId))
      .orderBy(desc(storage.db.paymentMatches.matchedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    res.json({
      success: true,
      data: matches
    });
    
  } catch (error) {
    console.error('Error getting payment matches:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
