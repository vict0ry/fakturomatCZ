import { Express } from 'express';
import { emailService } from '../services/email-service';
import { generateInvoicePDF } from '../services/pdf';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';

export default function setupEmailRoutes(app: Express) {

// Email settings endpoints
app.post('/api/email/settings', requireAuth, async (req: any, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPassword, fromEmail, fromName, smtpSecure } = req.body;
    
    // In a real app, store these in database
    // For now, we'll just validate and return success
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !fromEmail || !fromName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    res.json({ message: 'Email settings saved successfully' });
  } catch (error) {
    console.error('Error saving email settings:', error);
    res.status(500).json({ message: 'Failed to save email settings' });
  }
});

app.get('/api/email/settings', requireAuth, async (req: any, res) => {
  try {
    // In a real app, fetch from database
    // For demo purposes, return default settings
    res.json({
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: '',
      smtpSecure: true
    });
  } catch (error) {
    console.error('Error fetching email settings:', error);
    res.status(500).json({ message: 'Failed to fetch email settings' });
  }
});

app.post('/api/email/test', requireAuth, async (req: any, res) => {
  try {
    // Test SMTP connection
    const isConnected = await emailService.testEmailConnection();
    
    if (isConnected) {
      res.json({ message: 'SMTP spojení je funkční' });
    } else {
      res.status(500).json({ message: 'SMTP spojení selhalo' });
    }
  } catch (error) {
    console.error('Error testing email connection:', error);
    res.status(500).json({ message: 'Chyba při testování emailu' });
  }
});

// Send invoice email
app.post('/api/invoices/:id/email', requireAuth, async (req: any, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { to, subject, customMessage } = req.body;
    const companyId = req.user.companyId;
    
    // Get invoice with customer and items
    const invoice = await storage.getInvoice(invoiceId, companyId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);
    
    // Send email
    const success = await emailService.sendInvoiceEmail(invoice, pdfBuffer, customMessage);
    
    if (success) {
      // Update invoice status to sent if it was draft
      if (invoice.status === 'draft') {
        await storage.updateInvoice(invoiceId, { status: 'sent' }, companyId);
      }
      res.json({ message: 'Faktura byla úspěšně odeslána emailem' });
    } else {
      res.status(500).json({ message: 'Nepodařilo se odeslat email s fakturou' });
    }
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ message: 'Chyba při odesílání emailu' });
  }
});

// Send reminder email
app.post('/api/invoices/:id/reminder', requireAuth, async (req: any, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { type } = req.body; // 'first', 'second', 'final'
    const companyId = req.user.companyId;
    
    // Get invoice with customer
    const invoice = await storage.getInvoice(invoiceId, companyId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (!invoice.customer.email) {
      return res.status(400).json({ message: 'Zákazník nemá emailovou adresu' });
    }
    
    // Send reminder email
    const success = await emailService.sendReminderEmail(invoice, type);
    
    if (success) {
      const reminderTypes: Record<string, string> = {
        first: 'první připomínka',
        second: 'druhá připomínka', 
        final: 'konečná výzva'
      };
      res.json({ message: `${reminderTypes[type]} byla úspěšně odeslána` });
    } else {
      res.status(500).json({ message: 'Nepodařilo se odeslat připomínku' });
    }
  } catch (error) {
    console.error('Error sending reminder email:', error);
    res.status(500).json({ message: 'Chyba při odesílání připomínky' });
  }
});

// Password reset request endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email je povinný' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ message: 'Pokud email existuje, byl odeslán odkaz pro obnovení hesla' });
    }

    // Generate password reset token (expires in 1 hour)
    const { nanoid } = await import('nanoid');
    const passwordResetToken = nanoid(32);
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await storage.updateUser(user.id, {
      passwordResetToken,
      passwordResetExpires
    });

    // Send password reset email
    const success = await emailService.sendPasswordResetEmail(user, passwordResetToken);
    
    if (success) {
      res.json({ message: 'Pokud email existuje, byl odeslán odkaz pro obnovení hesla' });
    } else {
      // Pro development - ukážeme token v odpovědi pokud email nejde odeslat
      if (process.env.NODE_ENV === 'development') {
        res.json({ 
          message: 'SMTP není nakonfigurován. Pro testování použijte tento odkaz:', 
          resetLink: `http://localhost:5000/reset-password?token=${passwordResetToken}`,
          info: 'V produkci by byl odkaz odeslán emailem'
        });
      } else {
        res.status(500).json({ message: 'Chyba při odesílání emailu' });
      }
    }

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Chyba při žádosti o obnovení hesla' });
  }
});

// Reset password endpoint
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
    const bcrypt = await import('bcryptjs');
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

// Email confirmation endpoint
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

}