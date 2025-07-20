import { Router } from 'express';
import { storage } from '../storage.js';
import { db } from '../db.js';
import { invoices, invoiceItems, customers, companies } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { generateInvoicePDF } from '../services/pdf.js';

export const publicInvoiceRouter = Router();

// Get public invoice by share token
publicInvoiceRouter.get('/invoice/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Get invoice by token and verify it's valid
    const invoice = await storage.getInvoiceByShareToken(token);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or link has expired' });
    }

    // Increment view count
    await storage.incrementInvoiceShareViewCount(token);

    // Get related data for the public view
    const [invoiceWithDetails] = await db
      .select({
        // Invoice data
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        total: invoices.total,
        subtotal: invoices.subtotal,
        vatAmount: invoices.vatAmount,
        status: invoices.status,
        currency: invoices.currency,
        notes: invoices.notes,
        // Customer data
        customerName: customers.name,
        customerAddress: customers.address,
        customerCity: customers.city,
        customerPostalCode: customers.postalCode,
        // Company data
        companyName: companies.name,
        companyAddress: companies.address,
        companyCity: companies.city,
        companyPostalCode: companies.postalCode,
        companyIco: companies.ico,
        companyDic: companies.dic,
        companyPhone: companies.phone,
        companyEmail: companies.email,
        companyBankAccount: companies.bankAccount,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(companies, eq(invoices.companyId, companies.id))
      .where(eq(invoices.id, invoice.id));

    if (!invoiceWithDetails) {
      return res.status(404).json({ error: 'Invoice details not found' });
    }

    // Get invoice items
    const items = await db
      .select({
        description: invoiceItems.description,
        quantity: invoiceItems.quantity,
        unit: invoiceItems.unit,
        unitPrice: invoiceItems.unitPrice,
        total: invoiceItems.total,
      })
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id));

    // Structure response for public view
    const publicInvoiceData = {
      id: invoiceWithDetails.id,
      invoiceNumber: invoiceWithDetails.invoiceNumber,
      issueDate: invoiceWithDetails.issueDate,
      dueDate: invoiceWithDetails.dueDate,
      total: invoiceWithDetails.total,
      subtotal: invoiceWithDetails.subtotal,
      vatAmount: invoiceWithDetails.vatAmount,
      status: invoiceWithDetails.status,
      currency: invoiceWithDetails.currency,
      notes: invoiceWithDetails.notes,
      customer: {
        name: invoiceWithDetails.customerName,
        address: invoiceWithDetails.customerAddress,
        city: invoiceWithDetails.customerCity,
        postalCode: invoiceWithDetails.customerPostalCode,
      },
      company: {
        name: invoiceWithDetails.companyName,
        address: invoiceWithDetails.companyAddress,
        city: invoiceWithDetails.companyCity,
        postalCode: invoiceWithDetails.companyPostalCode,
        ico: invoiceWithDetails.companyIco,
        dic: invoiceWithDetails.companyDic,
        phone: invoiceWithDetails.companyPhone,
        email: invoiceWithDetails.companyEmail,
        bankAccount: invoiceWithDetails.companyBankAccount,
      },
      items: items,
    };

    res.json(publicInvoiceData);
  } catch (error) {
    console.error('Public invoice fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download PDF for public invoice
publicInvoiceRouter.get('/invoice/:token/pdf', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify token and get invoice
    const invoice = await storage.getInvoiceByShareToken(token);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or link has expired' });
    }

    // Get full invoice details for PDF generation
    const invoiceWithDetails = await storage.getInvoiceWithDetails(invoice.id, invoice.companyId);
    
    if (!invoiceWithDetails) {
      return res.status(404).json({ error: 'Invoice details not found' });
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceWithDetails);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="faktura-${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Public PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default publicInvoiceRouter;