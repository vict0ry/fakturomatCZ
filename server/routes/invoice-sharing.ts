import { Router } from 'express';
import { storage } from '../storage.js';
import { requireAuth } from '../middleware/auth.js';

export const invoiceSharingRouter = Router();

// Generate share link for invoice
invoiceSharingRouter.post('/invoices/:id/share', requireAuth, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { expiresInDays = 30 } = req.body;
    const companyId = req.user!.companyId;

    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: 'Invalid invoice ID' });
    }

    // Verify invoice exists and belongs to company
    const invoice = await storage.getInvoice(invoiceId, companyId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Generate share token
    const shareToken = await storage.generateInvoiceShareToken(invoiceId, companyId, expiresInDays);

    // Generate public URL
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const publicUrl = `${baseUrl}/public/invoice/${shareToken}`;

    res.json({
      success: true,
      shareUrl: publicUrl,
      token: shareToken,
      expiresInDays,
      message: `Bezpečný odkaz byl vygenerován a vyprší za ${expiresInDays} dní.`
    });
  } catch (error) {
    console.error('Share link generation error:', error);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// Disable sharing for invoice
invoiceSharingRouter.delete('/invoices/:id/share', requireAuth, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const companyId = req.user!.companyId;

    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: 'Invalid invoice ID' });
    }

    // Verify invoice exists and belongs to company
    const invoice = await storage.getInvoice(invoiceId, companyId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    await storage.disableInvoiceSharing(invoiceId, companyId);

    res.json({
      success: true,
      message: 'Sdílení faktury bylo deaktivováno.'
    });
  } catch (error) {
    console.error('Disable sharing error:', error);
    res.status(500).json({ error: 'Failed to disable sharing' });
  }
});

// Get invoice sharing status
invoiceSharingRouter.get('/invoices/:id/share', requireAuth, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const companyId = req.user!.companyId;

    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: 'Invalid invoice ID' });
    }

    const invoice = await storage.getInvoice(invoiceId, companyId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const isActive = invoice.isPublicSharingEnabled && 
      invoice.shareTokenExpiresAt && 
      new Date(invoice.shareTokenExpiresAt) > new Date();

    let publicUrl = null;
    if (isActive && invoice.shareToken) {
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      publicUrl = `${baseUrl}/public/invoice/${invoice.shareToken}`;
    }

    res.json({
      isActive,
      shareToken: invoice.shareToken,
      shareUrl: publicUrl,
      expiresAt: invoice.shareTokenExpiresAt,
      createdAt: invoice.shareTokenCreatedAt,
      viewCount: invoice.shareViewCount || 0
    });
  } catch (error) {
    console.error('Get sharing status error:', error);
    res.status(500).json({ error: 'Failed to get sharing status' });
  }
});

export default invoiceSharingRouter;