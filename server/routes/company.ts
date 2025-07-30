import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { insertCompanySchema } from '@shared/schema';

const router = Router();

// All company routes require authentication
router.use(requireAuth);

// GET /api/companies - Get company info
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const company = await storage.getCompany(user.companyId);
    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/companies - Update company
router.patch('/', async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Validate partial update data
    const updateSchema = insertCompanySchema.partial();
    const validatedData = updateSchema.parse(req.body);
    
    // Update company
    const updatedCompany = await storage.updateCompany(user.companyId, validatedData);
    
    res.json(updatedCompany);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error updating company:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/companies/settings - Get company settings (alias for compatibility)
router.get('/settings', async (req, res) => {
  try {
    const user = (req as any).user;
    const company = await storage.getCompany(user.companyId);
    res.json(company);
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/companies/settings - Update company settings (alias for compatibility)
router.post('/settings', async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Validate partial update data
    const updateSchema = insertCompanySchema.partial();
    const validatedData = updateSchema.parse(req.body);
    
    // Update company
    const updatedCompany = await storage.updateCompany(user.companyId, validatedData);
    
    res.json(updatedCompany);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error updating company settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/companies/users - Get company users
router.get('/users', async (req, res) => {
  try {
    const user = (req as any).user;
    const users = await storage.getCompanyUsers(user.companyId);
    
    // Remove password fields from response
    const safeUsers = users.map(u => ({ ...u, password: undefined }));
    
    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching company users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;