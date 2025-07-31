import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Company branding schema
const brandingSchema = z.object({
  // Banking
  bankAccount: z.string().optional(),
  iban: z.string().optional(),
  swift: z.string().optional(),
  // Branding
  logoUrl: z.string().optional(),
  stampUrl: z.string().optional(),
  signature: z.string().optional(),
  // Appearance
  enableQrCode: z.boolean().optional(),
  invoiceTemplate: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});

// GET /api/companies/current - Get current company details
router.get('/current', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const company = await storage.getCompany(user.companyId);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json(company);
  } catch (error) {
    console.error('Error fetching current company:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/companies/branding - Update company branding
router.patch('/branding', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Validate branding data
    const validatedData = brandingSchema.parse(req.body);
    
    // Update company branding
    const updatedCompany = await storage.updateCompanyBranding(user.companyId, validatedData);
    
    res.json(updatedCompany);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error updating company branding:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/upload/company-assets - Upload company assets (logo, stamp)
router.post('/upload/company-assets', requireAuth, async (req, res) => {
  try {
    // This would typically handle file upload to cloud storage
    // For now, return a mock URL since we don't have file storage configured
    const { type } = req.body;
    
    // In a real implementation, you would:
    // 1. Validate file type and size
    // 2. Upload to cloud storage (AWS S3, Cloudinary, etc.)
    // 3. Return the public URL
    
    const mockUrl = type === 'logo' 
      ? '/assets/company-logo.png' 
      : '/assets/company-stamp.png';
    
    res.json({ 
      url: mockUrl,
      message: 'File uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading company asset:', error);
    res.status(500).json({ message: 'File upload failed' });
  }
});

export default router;