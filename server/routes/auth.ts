import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from '../storage';
import { sessions } from '../middleware/auth';

const router = Router();

// Authentication routes
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by username or email
    const user = await storage.getUserByUsername(username) || 
                 await storage.getUserByEmail(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create session
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessions.set(sessionId, { userId: user.id!, companyId: user.companyId!, role: user.role });

    // Set session cookie for Stripe integration
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: false, // Development only
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId
      },
      sessionId
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    console.log('Registration request body:', JSON.stringify(req.body, null, 2));
    
    // Handle both nested format {user: {...}, company: {...}} and flat format
    let userData, companyData;
    
    if (req.body.user && req.body.company) {
      // New nested format
      userData = req.body.user;
      companyData = req.body.company;
    } else {
      // Old flat format - fallback
      const {
        username, email, password, firstName, lastName,
        companyName, ico, dic, address, city, postalCode, phone, website
      } = req.body;
      
      userData = { username, email, password, firstName, lastName };
      companyData = { name: companyName, ico, dic, address, city, postalCode, phone, website };
    }

    // Extract user data
    const { username, email, password, firstName, lastName } = userData;
    const { name, ico, dic, address, city, postalCode, phone, website } = companyData;

    console.log('Processing user:', { username, email, firstName, lastName, passwordLength: password?.length });
    console.log('Processing company:', { name, ico, dic });
    console.log('Password extracted:', password ? 'YES' : 'NO');

    // Validate required fields (username is optional for nested format, email is used instead)
    const usernameOrEmail = username || email;
    if (!usernameOrEmail || !email || !password || !name) {
      console.log('Missing fields:', { username: !!username, email: !!email, password: !!password, name: !!name });
      return res.status(400).json({ message: 'Required fields missing: email, password, company name' });
    }

    // Check if user already exists
    const existingUser = (username && await storage.getUserByUsername(username)) || 
                         await storage.getUserByEmail(email);
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create company first
    const company = await storage.createCompany({
      name,
      ico,
      dic,
      address,
      city,
      postalCode,
      country: 'CZ',
      phone,
      website
    });

    console.log('Company created:', company.id);

    // Create user - first user in company becomes owner
    const user = await storage.createUser({
      username: username || email, // Use email as username if username not provided
      email,
      password: hashedPassword,
      firstName,
      lastName,
      companyId: company.id,
      role: 'owner'  // První uživatel ve firmě je automaticky owner
    });

    console.log('User created:', user.id);

    // Send welcome email
    try {
      const { emailService } = await import('../services/email-service');
      await emailService.sendWelcomeEmail(user, company);
      console.log('✅ Welcome email sent to:', email);
    } catch (emailError) {
      console.error('⚠️ Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    // Create session
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessions.set(sessionId, { userId: user.id!, companyId: user.companyId!, role: user.role });

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId
      },
      sessionId
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No valid session' });
    }

    const sessionId = authHeader.substring(7);
    const session = sessions.get(sessionId);
    
    if (!session) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    const user = await storage.getUser(session.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId
      },
      valid: true
    });

  } catch (error) {
    console.error('Session validation error:', error);
    res.status(401).json({ message: 'Invalid session' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const sessionId = authHeader.substring(7);
      sessions.delete(sessionId);
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;