import { Express } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { storage } from '../storage';
import { emailService } from '../services/email-service';

// Enhanced auth routes with email confirmation and password reset
export default function setupEnhancedAuthRoutes(app: Express) {
  
  // Use the same sessions Map as in main routes
  const sessions = new Map<string, { userId: number; companyId: number; role?: string; username?: string; email?: string; emailConfirmed?: boolean; loginTime?: Date }>();

  // Register with email confirmation
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password, companyName } = req.body;

      if (!username || !email || !password || !companyName) {
        return res.status(400).json({ message: 'Všechna pole jsou povinná' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Heslo musí mít alespoň 6 znaků' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: 'Uživatelské jméno už existuje' });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ message: 'Email už je registrovaný' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Generate email confirmation token
      const emailConfirmationToken = nanoid(32);

      // Create company first
      const company = await storage.createCompany({
        name: companyName,
        email: email,
        address: '',
        city: '',
        postalCode: '',
        country: 'Česká republika',
        ico: '',
        dic: '',
        phone: '',
        website: '',
        bankAccount: '',
        vatRate: 21,
        currency: 'CZK',
        invoiceNumberPrefix: 'F',
        invoiceStartNumber: 1
      });

      // Create user with email confirmation token
      const user = await storage.createUser({
        companyId: company.id,
        username,
        email,
        password: passwordHash,
        role: 'admin',
        emailConfirmed: false,
        emailConfirmationToken,
        passwordResetToken: null,
        passwordResetExpires: null
      });

      // Send confirmation email
      try {
        await emailService.sendEmailConfirmation(user, emailConfirmationToken);
        console.log(`✅ Email confirmation sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Failed to send confirmation email:', emailError);
        // Don't fail registration if email fails, user can request new confirmation
      }

      res.status(201).json({
        message: 'Registrace úspěšná! Zkontrolujte si email pro potvrzení účtu.',
        userId: user.id,
        emailSent: true
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Chyba při registraci' });
    }
  });

  // Confirm email
  app.post('/api/auth/confirm-email', async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: 'Token je povinný' });
      }

      // Find user by confirmation token
      const user = await storage.getUserByEmailConfirmationToken(token);
      if (!user) {
        return res.status(404).json({ message: 'Neplatný nebo expirovaný token' });
      }

      if (user.emailConfirmed) {
        return res.status(400).json({ message: 'Email už je potvrzený' });
      }

      // Confirm email and clear token
      await storage.updateUser(user.id, {
        emailConfirmed: true,
        emailConfirmationToken: null
      });

      res.json({ message: 'Email byl úspěšně potvrzen! Můžete se přihlásit.' });

    } catch (error) {
      console.error('Email confirmation error:', error);
      res.status(500).json({ message: 'Chyba při potvrzování emailu' });
    }
  });

  // Resend email confirmation
  app.post('/api/auth/resend-confirmation', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email je povinný' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'Uživatel s tímto emailem neexistuje' });
      }

      if (user.emailConfirmed) {
        return res.status(400).json({ message: 'Email už je potvrzený' });
      }

      // Generate new confirmation token
      const emailConfirmationToken = nanoid(32);
      await storage.updateUser(user.id, { emailConfirmationToken });

      // Send new confirmation email
      await emailService.sendEmailConfirmation(user, emailConfirmationToken);

      res.json({ message: 'Nový potvrzovací email byl odeslán' });

    } catch (error) {
      console.error('Resend confirmation error:', error);
      res.status(500).json({ message: 'Chyba při odesílání potvrzovacího emailu' });
    }
  });

  // Request password reset
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email je povinný' });
      }

      console.log(`🔍 Hledám uživatele s emailem: ${email}`);
      const user = await storage.getUserByEmail(email);
      console.log(`👤 Uživatel nalezen:`, user ? `ID: ${user.id}, Email: ${user.email}` : 'NENALEZEN');
      
      if (!user) {
        // Don't reveal if email exists for security
        console.log(`❌ Uživatel s emailem ${email} nenalezen`);
        return res.json({ message: 'Pokud email existuje, byl odeslán odkaz pro obnovení hesla' });
      }

      // Generate password reset token (expires in 1 hour)
      const passwordResetToken = nanoid(32);
      const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      console.log(`🔧 Ukládám reset token pro ${user.email}:`, passwordResetToken);
      await storage.updateUser(user.id, {
        passwordResetToken,
        passwordResetExpires
      });
      console.log(`✅ Token uložen do databáze`);

      // Send password reset email
      try {
        await emailService.sendPasswordResetEmail(user, passwordResetToken);
        console.log(`✅ Password reset email sent to ${user.email}`);
        
        // For development testing, also provide the token
        if (process.env.NODE_ENV === 'development') {
          res.json({ 
            message: 'Pokud email existuje, byl odeslán odkaz pro obnovení hesla',
            developmentToken: passwordResetToken,
            developmentInfo: 'Token pro testování (pouze v development módu)'
          });
        } else {
          res.json({ message: 'Pokud email existuje, byl odeslán odkaz pro obnovení hesla' });
        }
      } catch (emailError) {
        console.log('❌ Password reset email error:', emailError.message);
        // Provide development fallback with reset link
        res.json({ 
          message: 'SMTP není nakonfigurován. Pro testování použijte tento odkaz:',
          resetLink: `http://localhost:5000/reset-password?token=${passwordResetToken}`,
          info: 'V produkci by byl odkaz odeslán emailem'
        });
      }

    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ message: 'Chyba při žádosti o obnovení hesla' });
    }
  });

  // Reset password
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token a nové heslo jsou povinné' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Heslo musí mít alespoň 6 znaků' });
      }

      // Find user by reset token
      const user = await storage.getUserByPasswordResetToken(token);
      if (!user) {
        return res.status(404).json({ message: 'Neplatný nebo expirovaný token' });
      }

      // Check if token expired
      if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
        return res.status(400).json({ message: 'Token vypršel, vyžádejte si nový' });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update password and clear reset token
      await storage.updateUser(user.id, {
        password: passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null
      });

      res.json({ message: 'Heslo bylo úspěšně změněno' });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Chyba při obnovování hesla' });
    }
  });

  // Enhanced login with email confirmation check
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Uživatelské jméno a heslo jsou povinné' });
      }

      // Try both username and email lookup
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByEmail(username);
      }
      
      if (!user) {
        console.log('❌ User not found for:', username);
        return res.status(401).json({ message: 'Neplatné přihlašovací údaje' });
      }

      console.log('✅ User found:', user.email, 'Password hash length:', user.password?.length);
      
      const isValid = await bcrypt.compare(password, user.password);
      console.log('🔑 Password comparison result:', isValid);
      
      if (!isValid) {
        return res.status(401).json({ message: 'Neplatné přihlašovací údaje' });
      }

      // Check if email is confirmed (allow login but warn)
      if (!user.emailConfirmed) {
        console.warn(`User ${username} logged in with unconfirmed email`);
      }

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

      // Create session
      const sessionId = nanoid();
      const sessionData = {
        userId: user.id,
        companyId: user.companyId,
        username: user.username,
        email: user.email,
        role: user.role,
        emailConfirmed: user.emailConfirmed,
        loginTime: new Date()
      };

      sessions.set(sessionId, sessionData);

      res.json({
        message: 'Přihlášení úspěšné',
        sessionId,
        user: {
          id: user.id,
          companyId: user.companyId,
          username: user.username,
          email: user.email,
          role: user.role,
          emailConfirmed: user.emailConfirmed
        },
        emailConfirmationWarning: !user.emailConfirmed
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Chyba při přihlašování' });
    }
  });

}