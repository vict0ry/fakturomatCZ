import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Email sending schema
const sendEmailSchema = z.object({
  invoiceId: z.number(),
  to: z.string().email(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

// POST /api/invoices/send-email - Send invoice via email
router.post('/send-email', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const validatedData = sendEmailSchema.parse(req.body);
    
    // Get invoice with details
    const invoice = await storage.getInvoiceWithDetails(
      validatedData.invoiceId, 
      user.companyId
    );
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Get company info for sender details
    const company = await storage.getCompany(user.companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Import email service
    const { emailService } = await import('../services/email-service');
    
    // Generate PDF attachment
    // Note: In a real implementation you would generate the actual PDF
    const pdfBuffer = Buffer.from('Mock PDF content'); // This should be actual PDF
    
    // Send email with PDF attachment
    const success = await emailService.sendInvoiceEmail({
      to: validatedData.to,
      cc: validatedData.cc,
      bcc: validatedData.bcc,
      subject: validatedData.subject,
      message: validatedData.message,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
      companyName: company.name,
      pdfAttachment: {
        filename: `faktura-${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    });
    
    if (success) {
      // Update invoice status to 'sent' if it was 'draft'
      if (invoice.status === 'draft') {
        await storage.updateInvoiceStatus(invoice.id, 'sent');
      }
      
      // Log email sending to history
      await storage.createInvoiceHistory({
        invoiceId: invoice.id,
        companyId: user.companyId,
        userId: user.id,
        action: 'email_sent',
        description: `Faktura ${invoice.invoiceNumber} byla odeslána na email ${validatedData.to}`,
        recipientEmail: validatedData.to,
        metadata: JSON.stringify({
          subject: validatedData.subject,
          cc: validatedData.cc,
          bcc: validatedData.bcc,
          messageLength: validatedData.message.length
        })
      });
      
      res.json({ 
        success: true, 
        message: 'Invoice sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send email' 
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error sending invoice email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;