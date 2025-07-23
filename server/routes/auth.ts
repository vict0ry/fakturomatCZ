import express from 'express';
import bcrypt from 'bcryptjs';
import { storage } from '../storage';
import { z } from 'zod';

const router = express.Router();

// Registration with trial setup
const registerSchema = z.object({
  personal: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
  }),
  company: z.object({
    companyName: z.string().min(1),
    ico: z.string().optional(),
    dic: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    phone: z.string().optional(),
    bankAccount: z.string().optional(),
  }),
  payment: z.object({
    cardNumber: z.string(),
    expiryDate: z.string(),
    cvv: z.string(),
    cardName: z.string(),
  }),
  trialDays: z.number().default(7),
});

router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { personal, company, payment, trialDays } = validatedData;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(personal.email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(personal.password, 10);

    // Calculate trial end date
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    // Create company first
    const newCompany = await storage.createCompany({
      name: company.companyName,
      ico: company.ico,
      dic: company.dic,
      address: company.address,
      city: company.city,
      postalCode: company.postalCode,
      phone: company.phone,
      bankAccount: company.bankAccount,
      email: personal.email,
      country: 'CZ',
    });

    // For demo purposes, we'll store payment info as placeholder
    // In production, you'd integrate with Stripe here
    const stripeCustomerId = `cus_demo_${Date.now()}`;
    
    // Create user with trial
    const newUser = await storage.createUser({
      companyId: newCompany.id,
      username: personal.email,
      email: personal.email,
      password: hashedPassword,
      firstName: personal.firstName,
      lastName: personal.lastName,
      role: 'admin', // First user in company is admin
      subscriptionStatus: 'trial',
      trialEndsAt,
      stripeCustomerId,
      planType: 'basic',
      monthlyPrice: '199.00',
    });

    // Set session
    req.session.userId = newUser.id;

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        subscriptionStatus: newUser.subscriptionStatus,
        trialEndsAt: newUser.trialEndsAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid registration data', details: error.errors });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await storage.updateUserLastLogin(user.id);

    // Set session
    req.session.userId = user.id;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if trial has expired
    if (user.subscriptionStatus === 'trial' && user.trialEndsAt && new Date() > user.trialEndsAt) {
      // Trial expired, update status
      await storage.updateUserSubscription(user.id, {
        subscriptionStatus: 'expired'
      });
      user.subscriptionStatus = 'expired';
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      subscriptionStatus: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
      isAuthenticated: true,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;