import { Router } from 'express';
import { searchCompaniesByName } from '../services/ares';

const router = Router();

// GET /api/test/ares/search/:name - Public ARES search by company name (no auth required)
router.get('/search/:name', async (req, res) => {
  try {
    const companyName = req.params.name;
    
    if (!companyName || companyName.length < 3) {
      return res.status(400).json({ message: 'Company name must be at least 3 characters' });
    }

    console.log(`🔍 Public ARES search for: "${companyName}"`);
    
    const aresResults = await searchCompaniesByName(companyName);
    
    console.log(`✅ Found ${aresResults.length} companies in ARES for "${companyName}"`);
    
    res.json(aresResults);
    
  } catch (error) {
    console.error('Public ARES search error:', error);
    res.status(500).json({ 
      message: 'Failed to search ARES registry',
      error: (error as Error).message 
    });
  }
});

export default router;