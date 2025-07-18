import { Express } from 'express';

// Import sessions from main routes file
let sessions: Map<string, any>;

function requireAuth(req: any, res: any, next: any) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.user = sessions.get(sessionId);
  next();
}

export default function setupCompanyRoutes(app: Express, sessionStore: Map<string, any>) {
  sessions = sessionStore;

// Company settings endpoints
app.get('/api/company/settings', requireAuth, async (req: any, res) => {
  try {
    // In real app, fetch from database using req.user.companyId
    // For demo, return default company data
    res.json({
      name: 'Test s.r.o.',
      ico: '12345678',
      dic: 'CZ12345678',
      address: 'Testovací 123',
      city: 'Praha',
      postalCode: '110 00',
      phone: '+420 123 456 789',
      email: 'info@test.cz',
      website: 'https://www.test.cz',
      bankAccount: '123456789/0100',
      iban: 'CZ65 0100 0000 0123 4567 89'
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ message: 'Failed to fetch company settings' });
  }
});

app.post('/api/company/settings', requireAuth, async (req: any, res) => {
  try {
    const companyData = req.body;
    
    // In real app, update company in database
    // For demo, just validate and return success
    if (!companyData.name || !companyData.ico || !companyData.email) {
      return res.status(400).json({ message: 'Name, ICO and email are required' });
    }

    res.json({ message: 'Company settings updated successfully' });
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({ message: 'Failed to update company settings' });
  }
});

// Company users endpoints
app.get('/api/company/users', requireAuth, async (req: any, res) => {
  try {
    // In real app, fetch users for company from database
    // For demo, return test users
    res.json([
      {
        id: 1,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.cz',
        role: 'admin',
        isActive: true
      },
      {
        id: 2,
        firstName: 'Test',
        lastName: 'User',
        email: 'user@test.cz',
        role: 'user',
        isActive: true
      }
    ]);
  } catch (error) {
    console.error('Error fetching company users:', error);
    res.status(500).json({ message: 'Failed to fetch company users' });
  }
});

app.post('/api/company/users/invite', requireAuth, async (req: any, res) => {
  try {
    const { email, role, firstName, lastName } = req.body;
    
    if (!email || !role || !firstName || !lastName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // In real app, would:
    // 1. Create user invitation in database
    // 2. Send invitation email
    // 3. Return invitation details
    
    res.json({ 
      message: 'User invitation sent successfully',
      invitation: {
        email,
        role,
        firstName,
        lastName,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ message: 'Failed to invite user' });
  }
});

app.delete('/api/company/users/:id', requireAuth, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // In real app, remove user from company
    // For demo, just return success
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).json({ message: 'Failed to remove user' });
  }
});

}