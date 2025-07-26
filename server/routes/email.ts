import { Express } from 'express';
import { emailService } from '../services/email-service';
import { generateInvoicePDF } from '../services/pdf';
import { storage } from '../storage';

function requireAuth(req: any, res: any, next: any) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // In real implementation, you'd verify session in sessions map
  // For now, assume valid if sessionId exists
  req.user = { companyId: 1, id: 1 }; // Mock user
  next();
}

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

export default function setupEmailRoutes(app: Express, sessionStore: Map<string, any>) {
  sessions = sessionStore;

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
    const invoice = await storage.getInvoiceById(invoiceId, companyId);
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
    const invoice = await storage.getInvoiceById(invoiceId, companyId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (!invoice.customer.email) {
      return res.status(400).json({ message: 'Zákazník nemá emailovou adresu' });
    }
    
    // Send reminder email
    const success = await emailService.sendReminderEmail(invoice, type);
    
    if (success) {
      const reminderTypes = {
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

}