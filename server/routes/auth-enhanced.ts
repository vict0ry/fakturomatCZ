import { Express } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { randomUUID } from 'crypto';
import { storage } from '../storage';
import { emailService } from '../services/email-service';

// Enhanced auth routes with email confirmation and password reset
export default function setupEnhancedAuthRoutes(app: Express, sessions: Map<string, any>) {

  // Register route is handled in main routes.ts to avoid conflicts

  // Email confirmation route
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

      if (!user) {
        console.log('❌ Uživatel nenalezen');
        // Security: Don't reveal if email exists or not
        return res.json({ 
          message: 'Pokud email existuje, byl odeslán odkaz pro obnovení hesla',
          developmentInfo: 'Uživatel nenalezen (pouze v development módu)'
        });
      }

      console.log(`👤 Uživatel nalezen: ID: ${user.id}, Email: ${user.email}`);

      // Generate password reset token
      const resetToken = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

      console.log(`🔧 Ukládám reset token pro ${email}: ${resetToken}`);

      // Save token to database
      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: expiresAt
      });

      console.log('✅ Token uložen do databáze');

      // Send password reset email
      try {
        await emailService.sendPasswordReset(user, resetToken);
        console.log(`✅ Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Failed to send password reset email:', emailError);
        // Don't fail the request if email fails - user still gets the token
      }

      res.json({
        message: 'Pokud email existuje, byl odeslán odkaz pro obnovení hesla',
        developmentToken: resetToken, // Only in development
        developmentInfo: 'Token pro testování (pouze v development módu)'
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ message: 'Chyba při zpracování požadavku' });
    }
  });

  // Reset password with token
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token a nové heslo jsou povinné' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Heslo musí mít alespoň 6 znaků' });
      }

      console.log(`🔍 Hledám uživatele s reset tokenem: ${token.substring(0, 10)}...`);

      // Find user by reset token
      const user = await storage.getUserByPasswordResetToken(token);
      if (!user) {
        console.log('❌ Neplatný token');
        return res.status(404).json({ message: 'Neplatný nebo expirovaný token' });
      }

      // Check if token is expired
      if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
        console.log('❌ Token expiroval');
        return res.status(404).json({ message: 'Neplatný nebo expirovaný token' });
      }

      console.log(`👤 Uživatel nalezen pro reset: ${user.email}`);

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password and clear reset token
      await storage.updateUser(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      });

      console.log(`✅ Heslo bylo změněno pro uživatele: ${user.email}`);

      res.json({ message: 'Heslo bylo úspěšně změněno' });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Chyba při změně hesla' });
    }
  });

  // Enhanced login with email confirmation check
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Uživatelské jméno a heslo jsou povinné' });
      }

      // Find user by username or email
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