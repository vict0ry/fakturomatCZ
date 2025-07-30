import puppeteer from "puppeteer";
import PDFDocument from "pdfkit";
import type { Invoice, Customer, InvoiceItem } from "@shared/schema";
import { QRGenerator } from "./qr-generator";

export async function generateInvoicePDF(
  invoice: Invoice & { customer: Customer; items: InvoiceItem[] },
  companyId?: number
): Promise<Buffer> {
  // Generate QR code for payment
  let qrCodeDataURL = '';
  try {
    const company = {
      name: 'Test s.r.o.',
      iban: 'CZ1234567890123456789012',
      bankAccount: '123456789/0100'
    };
    qrCodeDataURL = await QRGenerator.generateInvoicePaymentQR(invoice, company);
  } catch (error) {
    console.warn('Failed to generate QR code:', error);
  }
  
  try {
    // Try Puppeteer first
    const htmlContent = generateInvoiceHTML(invoice, qrCodeDataURL);
    
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false
      });

      console.log('✅ PDF generated successfully with Puppeteer');
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (puppeteerError) {
    console.log('Puppeteer failed, falling back to PDFKit:', puppeteerError.message);
    
    // Alternative PDF generation using PDFKit
    return generatePDFWithPDFKit(invoice);
  }
}

// Alternative PDF generation using PDFKit
function generatePDFWithPDFKit(invoice: Invoice & { customer: Customer; items: InvoiceItem[] }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        console.log(`✅ PDFKit generated PDF: ${(pdfData.length / 1024).toFixed(1)} KB`);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(24).text('FAKTURA', 50, 50, { align: 'center' });
      doc.fontSize(16).text(`Číslo: ${invoice.invoiceNumber}`, 50, 100);
      
      // Company info
      doc.fontSize(12);
      doc.text('Dodavatel:', 50, 140);
      doc.text('Test s.r.o.', 50, 155);
      doc.text('Testovací 123', 50, 170);
      doc.text('100 00 Praha', 50, 185);
      doc.text('IČO: 12345678', 50, 200);
      
      // Customer info
      doc.text('Odběratel:', 300, 140);
      doc.text(invoice.customer.name, 300, 155);
      if (invoice.customer.address) doc.text(invoice.customer.address, 300, 170);
      if (invoice.customer.city) doc.text(`${invoice.customer.postalCode || ''} ${invoice.customer.city}`, 300, 185);
      
      // Dates
      doc.text(`Datum vystavení: ${new Date(invoice.issueDate).toLocaleDateString('cs-CZ')}`, 50, 240);
      doc.text(`Datum splatnosti: ${new Date(invoice.dueDate).toLocaleDateString('cs-CZ')}`, 300, 240);
      
      // Items table header
      let yPosition = 280;
      doc.text('Popis', 50, yPosition);
      doc.text('Množství', 200, yPosition);
      doc.text('Cena', 300, yPosition);
      doc.text('Celkem', 400, yPosition);
      
      // Line under header
      doc.moveTo(50, yPosition + 15).lineTo(500, yPosition + 15).stroke();
      yPosition += 30;
      
      // Items
      invoice.items?.forEach((item) => {
        const total = Number(item.quantity) * Number(item.unitPrice);
        doc.text(item.description, 50, yPosition);
        doc.text(item.quantity, 200, yPosition);
        doc.text(`${Number(item.unitPrice).toLocaleString('cs-CZ')} Kč`, 300, yPosition);
        doc.text(`${total.toLocaleString('cs-CZ')} Kč`, 400, yPosition);
        yPosition += 20;
      });
      
      // Totals
      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(500, yPosition).stroke();
      yPosition += 20;
      
      doc.text(`Celkem bez DPH: ${Number(invoice.subtotal).toLocaleString('cs-CZ')} Kč`, 300, yPosition);
      yPosition += 20;
      doc.text(`DPH: ${Number(invoice.vatAmount).toLocaleString('cs-CZ')} Kč`, 300, yPosition);
      yPosition += 20;
      doc.fontSize(14).text(`Celkem k úhradě: ${Number(invoice.total).toLocaleString('cs-CZ')} Kč`, 300, yPosition);
      
      // Footer
      doc.fontSize(10).text('Děkujeme za spolupráci!', 50, 700, { align: 'center' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function generateInvoiceHTML(invoice: Invoice & { customer: Customer; items: InvoiceItem[] }, qrCodeDataURL?: string): string {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('cs-CZ');
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK'
    }).format(Number(amount));
  };

  const calculateItemTotal = (quantity: string, unitPrice: string) => {
    return (parseFloat(quantity || '0') * parseFloat(unitPrice || '0')).toFixed(2);
  };

  return `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Faktura ${invoice.invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.4; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-title { font-size: 28px; font-weight: bold; color: #ff6b35; margin-bottom: 10px; }
        .invoice-number { font-size: 16px; color: #666; }
        .company-info, .customer-info { margin-bottom: 20px; }
        .info-title { font-weight: bold; margin-bottom: 10px; color: #333; }
        .invoice-details { display: flex; justify-content: space-between; margin: 30px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .items-table th { background-color: #f5f5f5; font-weight: bold; }
        .totals { margin-top: 20px; text-align: right; }
        .total-row { margin: 5px 0; }
        .final-total { font-size: 18px; font-weight: bold; color: #ff6b35; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="invoice-title">FAKTURA</div>
          <div class="invoice-number">Číslo: ${invoice.invoiceNumber}</div>
        </div>

        <div style="display: flex; justify-content: space-between;">
          <div class="company-info">
            <div class="info-title">Dodavatel:</div>
            <div>Test s.r.o.</div>
            <div>Testovací 123</div>
            <div>100 00 Praha</div>
            <div>IČO: 12345678</div>
          </div>

          <div class="customer-info">
            <div class="info-title">Odběratel:</div>
            <div>${invoice.customer.name}</div>
            ${invoice.customer.address ? `<div>${invoice.customer.address}</div>` : ''}
            ${invoice.customer.city ? `<div>${invoice.customer.postalCode || ''} ${invoice.customer.city}</div>` : ''}
            ${invoice.customer.ico ? `<div>IČO: ${invoice.customer.ico}</div>` : ''}
          </div>
        </div>

        <div class="invoice-details">
          <div>Datum vystavení: ${formatDate(invoice.issueDate)}</div>
          <div>Datum splatnosti: ${formatDate(invoice.dueDate)}</div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Popis</th>
              <th>Množství</th>
              <th>Jednotková cena</th>
              <th>DPH %</th>
              <th>Celkem</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items?.map(item => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td>${item.vatRate}%</td>
                <td>${formatCurrency(Number(item.quantity) * Number(item.unitPrice))}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">Celkem bez DPH: ${formatCurrency(invoice.subtotal)}</div>
          <div class="total-row">DPH: ${formatCurrency(invoice.vatAmount)}</div>
          <div class="final-total">Celkem k úhradě: ${formatCurrency(invoice.total)}</div>
        </div>

        <div class="footer">
          <p>Děkujeme za spolupráci!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}