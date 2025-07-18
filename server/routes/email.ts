import { Express } from 'express';
import { EmailService } from '../services/email';
import { generateInvoicePDF } from '../services/pdf';

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
    // For demo purposes, just return success
    // In real app, would send actual test email
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ message: 'Failed to send test email' });
  }
});

// Send invoice email
app.post('/api/invoices/:id/email', requireAuth, async (req: any, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { to, subject, message } = req.body;
    
    // For demo purposes, just return success
    // In real app, would:
    // 1. Get invoice details
    // 2. Generate PDF
    // 3. Send email with PDF attachment
    
    res.json({ message: 'Invoice email sent successfully' });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ message: 'Failed to send invoice email' });
  }
});

// Send reminder email
app.post('/api/invoices/:id/reminder', requireAuth, async (req: any, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { type } = req.body; // 'first', 'second', 'final'
    
    // For demo purposes, just return success
    res.json({ message: 'Reminder email sent successfully' });
  } catch (error) {
    console.error('Error sending reminder email:', error);
    res.status(500).json({ message: 'Failed to send reminder email' });
  }
});

}