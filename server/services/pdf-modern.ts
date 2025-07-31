import puppeteer from "puppeteer";
import PDFDocument from "pdfkit";
import type { Invoice, Customer, InvoiceItem } from "@shared/schema";
import { QRGenerator } from "./qr-generator";

export async function generateModernInvoicePDF(
  invoice: Invoice & { customer: Customer; items: InvoiceItem[] },
  companyId?: number
): Promise<Buffer> {
  // Generate QR code for payment
  let qrCodeDataURL = '';
  try {
    const company = {
      name: 'doklad.ai s.r.o.',
      iban: 'CZ12 0100 0000 1234 5678 9012',
      bankAccount: '123456789/0100'
    };
    qrCodeDataURL = await QRGenerator.generateInvoicePaymentQR(invoice, company);
  } catch (error) {
    console.warn('Failed to generate QR code:', error);
  }
  
  const htmlContent = generateModernInvoiceHTML(invoice, qrCodeDataURL);
  
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
    
    // Set content with UTF-8 encoding
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');
    
    // Generate PDF with Czech locale support
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '15mm',
        right: '10mm',
        bottom: '15mm',
        left: '10mm'
      },
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false
    });

    console.log('✅ Modern PDF generated successfully with Czech support');
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function generateModernInvoiceHTML(invoice: Invoice & { customer: Customer; items: InvoiceItem[] }, qrCodeDataURL?: string): string {
  const formatCurrency = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('cs-CZ', { 
      style: 'currency', 
      currency: 'CZK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const today = new Date();
  const dueDate = new Date(invoice.dueDate);

  return `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Faktura ${invoice.invoiceNumber || 'DRAFT'}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4;
          margin: 15mm 10mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', 'Segoe UI', 'DejaVu Sans', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #1a1a1a;
          background: #ffffff;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .invoice-container {
          max-width: 180mm;
          margin: 0 auto;
          padding: 0;
          background: white;
        }
        
        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #ff6b35;
        }
        
        .company-logo {
          flex: 1;
        }
        
        .company-name {
          font-size: 24pt;
          font-weight: 700;
          color: #ff6b35;
          margin-bottom: 5px;
        }
        
        .company-tagline {
          font-size: 10pt;
          color: #666;
          font-style: italic;
        }
        
        .invoice-title-section {
          text-align: right;
        }
        
        .invoice-title {
          font-size: 32pt;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 5px;
          letter-spacing: -0.5px;
        }
        
        .invoice-number {
          font-size: 12pt;
          color: #666;
          font-weight: 500;
        }
        
        /* Invoice info grid */
        .invoice-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .info-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 6px;
          border-left: 4px solid #ff6b35;
        }
        
        .info-title {
          font-size: 11pt;
          font-weight: 600;
          color: #ff6b35;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-content {
          font-size: 10pt;
          line-height: 1.5;
        }
        
        .info-content div {
          margin-bottom: 3px;
        }
        
        .company-details {
          font-weight: 500;
        }
        
        /* Dates section */
        .dates-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
          padding: 15px;
          background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
          border-radius: 6px;
          color: white;
        }
        
        .date-item {
          text-align: center;
        }
        
        .date-label {
          font-size: 9pt;
          opacity: 0.9;
          margin-bottom: 3px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .date-value {
          font-size: 11pt;
          font-weight: 600;
        }
        
        /* Items table */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          font-size: 10pt;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-radius: 6px;
          overflow: hidden;
        }
        
        .items-table thead {
          background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
          color: white;
        }
        
        .items-table th {
          padding: 15px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 9pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .items-table th:nth-child(2),
        .items-table th:nth-child(3),
        .items-table th:nth-child(4),
        .items-table th:nth-child(5) {
          text-align: right;
        }
        
        .items-table tbody tr {
          border-bottom: 1px solid #e5e7eb;
          transition: background-color 0.2s;
        }
        
        .items-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        
        .items-table tbody tr:last-child {
          border-bottom: none;
        }
        
        .items-table td {
          padding: 12px;
          vertical-align: top;
        }
        
        .items-table td:nth-child(2),
        .items-table td:nth-child(3),
        .items-table td:nth-child(4),
        .items-table td:nth-child(5) {
          text-align: right;
        }
        
        .item-description {
          font-weight: 500;
          color: #1a1a1a;
        }
        
        /* Totals section */
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }
        
        .totals {
          min-width: 300px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 11pt;
        }
        
        .total-row:not(:last-child) {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .subtotal-row {
          color: #666;
        }
        
        .vat-row {
          color: #666;
        }
        
        .final-total {
          background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
          color: white;
          padding: 15px;
          border-radius: 6px;
          font-size: 14pt;
          font-weight: 700;
          margin-top: 10px;
        }
        
        /* Payment info */
        .payment-section {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 30px;
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        
        .payment-details {
          font-size: 10pt;
        }
        
        .payment-title {
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 10px;
          font-size: 11pt;
        }
        
        .payment-details div {
          margin-bottom: 5px;
        }
        
        .payment-qr {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        .qr-code {
          width: 100px;
          height: 100px;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          margin-bottom: 8px;
        }
        
        .qr-label {
          font-size: 8pt;
          color: #666;
          max-width: 100px;
        }
        
        /* Footer */
        .footer {
          text-align: center;
          padding: 20px 0;
          border-top: 1px solid #e5e7eb;
          color: #666;
          font-size: 9pt;
        }
        
        .footer-message {
          margin-bottom: 10px;
          font-style: italic;
        }
        
        .footer-legal {
          font-size: 8pt;
          opacity: 0.8;
        }
        
        /* Print optimizations */
        @media print {
          body { font-size: 10pt; }
          .invoice-container { max-width: none; }
          .items-table { font-size: 9pt; }
          .qr-code { width: 80px; height: 80px; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <div class="company-logo">
            <div class="company-name">doklad.ai</div>
            <div class="company-tagline">Inteligentní fakturace</div>
          </div>
          <div class="invoice-title-section">
            <div class="invoice-title">FAKTURA</div>
            <div class="invoice-number">č. ${invoice.invoiceNumber || 'DRAFT'}</div>
          </div>
        </div>

        <!-- Invoice Info -->
        <div class="invoice-info">
          <div class="info-section">
            <div class="info-title">Dodavatel</div>
            <div class="info-content company-details">
              <div><strong>doklad.ai s.r.o.</strong></div>
              <div>Wenceslas Square 1</div>
              <div>Praha 1, 110 00</div>
              <div>Česká republika</div>
              <div><strong>IČO:</strong> 12345678</div>
              <div><strong>DIČ:</strong> CZ12345678</div>
              <div><strong>Tel:</strong> +420 777 888 999</div>
              <div><strong>Email:</strong> info@doklad.ai</div>
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-title">Odběratel</div>
            <div class="info-content">
              <div><strong>${invoice.customer.name || 'Název zákazníka'}</strong></div>
              ${invoice.customer.address ? `<div>${invoice.customer.address}</div>` : ''}
              <div>${invoice.customer.city || ''} ${invoice.customer.postalCode || ''}</div>
              <div>${invoice.customer.country || 'Česká republika'}</div>
              ${invoice.customer.ico ? `<div><strong>IČO:</strong> ${invoice.customer.ico}</div>` : ''}
              ${invoice.customer.dic ? `<div><strong>DIČ:</strong> ${invoice.customer.dic}</div>` : ''}
              ${invoice.customer.email ? `<div><strong>Email:</strong> ${invoice.customer.email}</div>` : ''}
              ${invoice.customer.phone ? `<div><strong>Tel:</strong> ${invoice.customer.phone}</div>` : ''}
            </div>
          </div>
        </div>

        <!-- Dates -->
        <div class="dates-section">
          <div class="date-item">
            <div class="date-label">Datum vystavení</div>
            <div class="date-value">${new Date(invoice.issueDate).toLocaleDateString('cs-CZ')}</div>
          </div>
          <div class="date-item">
            <div class="date-label">Datum splatnosti</div>
            <div class="date-value">${dueDate.toLocaleDateString('cs-CZ')}</div>
          </div>
          <div class="date-item">
            <div class="date-label">Způsob platby</div>
            <div class="date-value">${invoice.paymentMethod === 'bank_transfer' ? 'Bankovní převod' : 'Hotově'}</div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>Popis položky</th>
              <th>Množství</th>
              <th>Jednotková cena</th>
              <th>DPH</th>
              <th>Celkem</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items?.map(item => `
              <tr>
                <td class="item-description">${item.description || 'Položka bez popisu'}</td>
                <td>${item.quantity || '0'} ${item.unit || 'ks'}</td>
                <td>${formatCurrency(item.unitPrice || 0)}</td>
                <td>${item.vatRate || 0}%</td>
                <td><strong>${formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0) * (1 + Number(item.vatRate || 0) / 100))}</strong></td>
              </tr>
            `).join('') || '<tr><td colspan="5" style="text-align: center; color: #666; font-style: italic;">Žádné položky</td></tr>'}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
          <div class="totals">
            <div class="total-row subtotal-row">
              <span>Celkem bez DPH:</span>
              <span>${formatCurrency(invoice.subtotal || 0)}</span>
            </div>
            <div class="total-row vat-row">
              <span>DPH celkem:</span>
              <span>${formatCurrency(invoice.vatAmount || 0)}</span>
            </div>
            <div class="final-total">
              <div class="total-row">
                <span>Celkem k úhradě:</span>
                <span>${formatCurrency(invoice.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Info -->
        <div class="payment-section">
          <div class="payment-details">
            <div class="payment-title">Platební údaje</div>
            <div><strong>Bankovní účet:</strong> 123456789/0100</div>
            <div><strong>IBAN:</strong> CZ12 0100 0000 1234 5678 9012</div>
            <div><strong>SWIFT/BIC:</strong> KOMBCZPP</div>
            <div><strong>Variabilní symbol:</strong> ${invoice.variableSymbol || invoice.invoiceNumber || 'N/A'}</div>
            ${invoice.constantSymbol ? `<div><strong>Konstantní symbol:</strong> ${invoice.constantSymbol}</div>` : ''}
            ${invoice.specificSymbol ? `<div><strong>Specifický symbol:</strong> ${invoice.specificSymbol}</div>` : ''}
          </div>
          ${qrCodeDataURL ? `
            <div class="payment-qr">
              <img src="${qrCodeDataURL}" alt="QR kód pro platbu" class="qr-code" />
              <div class="qr-label">QR kód pro rychlou platbu</div>
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-message">
            <strong>Děkujeme za spolupráci a těšíme se na další obchodní vztahy!</strong>
          </div>
          <div class="footer-legal">
            Tato faktura byla vygenerována systémem doklad.ai • ${today.toLocaleDateString('cs-CZ')} ${today.toLocaleTimeString('cs-CZ')}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Enhanced PDFKit fallback with Czech support
function generateEnhancedPDFWithPDFKit(
  invoice: Invoice & { customer: Customer; items: InvoiceItem[] },
  qrCodeDataURL?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 40,
        size: 'A4',
        info: {
          Title: `Faktura ${invoice.invoiceNumber}`,
          Author: 'doklad.ai',
          Subject: 'Faktura',
          Creator: 'doklad.ai system'
        }
      });
      
      const buffers: Buffer[] = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        console.log(`✅ Enhanced PDFKit generated PDF: ${(pdfData.length / 1024).toFixed(1)} KB`);
        resolve(pdfData);
      });

      const formatCurrency = (amount: string | number): string => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('cs-CZ', { 
          style: 'currency', 
          currency: 'CZK',
          minimumFractionDigits: 2
        }).format(num);
      };

      // Colors
      const orangeColor = '#ff6b35';
      const grayColor = '#666666';
      const blackColor = '#1a1a1a';

      // Header with company branding
      doc.rect(0, 0, doc.page.width, 80).fill(orangeColor);
      
      doc.fillColor('white')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('doklad.ai', 40, 25);
      
      doc.fontSize(12)
         .font('Helvetica')
         .text('Inteligentní fakturace', 40, 55);

      // Invoice title
      doc.fillColor(blackColor)
         .fontSize(36)
         .font('Helvetica-Bold')
         .text('FAKTURA', 400, 25, { align: 'right' });
      
      doc.fontSize(14)
         .fillColor(grayColor)
         .text(`č. ${invoice.invoiceNumber || 'DRAFT'}`, 400, 65, { align: 'right' });

      let yPos = 120;

      // Company and customer info in two columns
      doc.rect(40, yPos, 250, 140).fill('#f8f9fa').stroke('#e5e7eb');
      doc.rect(310, yPos, 250, 140).fill('#f8f9fa').stroke('#e5e7eb');

      // Orange accent borders
      doc.rect(40, yPos, 4, 140).fill(orangeColor);
      doc.rect(310, yPos, 4, 140).fill(orangeColor);

      // Dodavatel
      doc.fillColor(orangeColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('DODAVATEL', 50, yPos + 15);

      doc.fillColor(blackColor)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('doklad.ai s.r.o.', 50, yPos + 35);
      
      doc.font('Helvetica')
         .text('Wenceslas Square 1', 50, yPos + 50)
         .text('Praha 1, 110 00', 50, yPos + 65)
         .text('Česká republika', 50, yPos + 80)
         .text('IČO: 12345678', 50, yPos + 95)
         .text('DIČ: CZ12345678', 50, yPos + 110)
         .text('Tel: +420 777 888 999', 50, yPos + 125);

      // Odběratel
      doc.fillColor(orangeColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('ODBĚRATEL', 320, yPos + 15);

      doc.fillColor(blackColor)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(invoice.customer.name || 'Název zákazníka', 320, yPos + 35);
      
      doc.font('Helvetica');
      let customerYPos = yPos + 50;
      
      if (invoice.customer.address) {
        doc.text(invoice.customer.address, 320, customerYPos);
        customerYPos += 15;
      }
      
      const cityLine = `${invoice.customer.city || ''} ${invoice.customer.postalCode || ''}`.trim();
      if (cityLine) {
        doc.text(cityLine, 320, customerYPos);
        customerYPos += 15;
      }
      
      doc.text(invoice.customer.country || 'Česká republika', 320, customerYPos);
      customerYPos += 15;
      
      if (invoice.customer.ico) {
        doc.text(`IČO: ${invoice.customer.ico}`, 320, customerYPos);
        customerYPos += 15;
      }
      
      if (invoice.customer.dic) {
        doc.text(`DIČ: ${invoice.customer.dic}`, 320, customerYPos);
        customerYPos += 15;
      }

      yPos += 160;

      // Dates section with gradient background
      doc.rect(40, yPos, 520, 50).fill(orangeColor);
      
      doc.fillColor('white')
         .fontSize(10)
         .font('Helvetica')
         .text('DATUM VYSTAVENÍ', 80, yPos + 10, { align: 'center' })
         .text('DATUM SPLATNOSTI', 280, yPos + 10, { align: 'center' })
         .text('ZPŮSOB PLATBY', 450, yPos + 10, { align: 'center' });

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(new Date(invoice.issueDate).toLocaleDateString('cs-CZ'), 80, yPos + 25, { align: 'center' })
         .text(new Date(invoice.dueDate).toLocaleDateString('cs-CZ'), 280, yPos + 25, { align: 'center' })
         .text(invoice.paymentMethod === 'bank_transfer' ? 'Bankovní převod' : 'Hotově', 450, yPos + 25, { align: 'center' });

      yPos += 80;

      // Items table
      const tableTop = yPos;
      const tableHeaders = ['Popis položky', 'Množství', 'Jednotková cena', 'DPH', 'Celkem'];
      const columnWidths = [200, 80, 100, 60, 80];
      const columnPositions = [40, 240, 320, 420, 480];

      // Table header
      doc.rect(40, tableTop, 520, 30).fill(blackColor);
      
      doc.fillColor('white')
         .fontSize(10)
         .font('Helvetica-Bold');

      tableHeaders.forEach((header, i) => {
        const align = i === 0 ? 'left' : 'center';
        doc.text(header, columnPositions[i] + (i === 0 ? 10 : 0), tableTop + 10, {
          width: columnWidths[i],
          align: align
        });
      });

      // Table rows
      yPos = tableTop + 30;
      doc.fillColor(blackColor).fontSize(10).font('Helvetica');

      if (invoice.items && invoice.items.length > 0) {
        invoice.items.forEach((item, index) => {
          const rowHeight = 25;
          const isEven = index % 2 === 0;
          
          if (isEven) {
            doc.rect(40, yPos, 520, rowHeight).fill('#f8f9fa');
          }

          doc.fillColor(blackColor);
          
          // Description
          doc.text(item.description || 'Položka bez popisu', columnPositions[0] + 10, yPos + 8, {
            width: columnWidths[0] - 20
          });
          
          // Quantity
          doc.text(`${item.quantity || '0'} ${item.unit || 'ks'}`, columnPositions[1], yPos + 8, {
            width: columnWidths[1],
            align: 'center'
          });
          
          // Unit price
          doc.text(formatCurrency(item.unitPrice || 0), columnPositions[2], yPos + 8, {
            width: columnWidths[2],
            align: 'center'
          });
          
          // VAT rate
          doc.text(`${item.vatRate || 0}%`, columnPositions[3], yPos + 8, {
            width: columnWidths[3],
            align: 'center'
          });
          
          // Total
          const itemTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0) * (1 + Number(item.vatRate || 0) / 100);
          doc.font('Helvetica-Bold')
             .text(formatCurrency(itemTotal), columnPositions[4], yPos + 8, {
               width: columnWidths[4],
               align: 'center'
             });
          
          doc.font('Helvetica');
          yPos += rowHeight;
        });
      } else {
        doc.fillColor(grayColor)
           .font('Helvetica-Oblique')
           .text('Žádné položky', 40, yPos + 15, {
             width: 520,
             align: 'center'
           });
        yPos += 40;
      }

      yPos += 20;

      // Totals section
      const totalsX = 350;
      const totalsWidth = 210;

      // Subtotal and VAT
      doc.fillColor(grayColor)
         .fontSize(11)
         .font('Helvetica')
         .text('Celkem bez DPH:', totalsX, yPos)
         .text(formatCurrency(invoice.subtotal || 0), totalsX + 120, yPos, { align: 'right', width: 90 });

      yPos += 20;
      doc.text('DPH celkem:', totalsX, yPos)
         .text(formatCurrency(invoice.vatAmount || 0), totalsX + 120, yPos, { align: 'right', width: 90 });

      yPos += 30;

      // Final total with orange background
      doc.rect(totalsX, yPos - 5, totalsWidth, 35).fill(orangeColor);
      doc.fillColor('white')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Celkem k úhradě:', totalsX + 10, yPos + 8)
         .text(formatCurrency(invoice.total || 0), totalsX + 120, yPos + 8, { align: 'right', width: 80 });

      yPos += 60;

      // Payment information
      doc.rect(40, yPos, 520, 80).fill('#f8f9fa').stroke('#e5e7eb');
      doc.rect(40, yPos, 4, 80).fill(orangeColor);

      doc.fillColor(blackColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Platební údaje', 50, yPos + 15);

      doc.fontSize(10)
         .font('Helvetica')
         .text('Bankovní účet: 123456789/0100', 50, yPos + 35)
         .text('IBAN: CZ12 0100 0000 1234 5678 9012', 50, yPos + 50)
         .text(`Variabilní symbol: ${invoice.variableSymbol || invoice.invoiceNumber || 'N/A'}`, 280, yPos + 35);

      if (invoice.constantSymbol) {
        doc.text(`Konstantní symbol: ${invoice.constantSymbol}`, 280, yPos + 50);
      }

      yPos += 100;

      // Footer
      doc.moveTo(40, yPos).lineTo(560, yPos).stroke('#e5e7eb');
      
      yPos += 20;
      doc.fillColor(grayColor)
         .fontSize(11)
         .font('Helvetica-Oblique')
         .text('Děkujeme za spolupráci a těšíme se na další obchodní vztahy!', 40, yPos, {
           width: 520,
           align: 'center'
         });

      yPos += 20;
      doc.fontSize(8)
         .font('Helvetica')
         .text(`Tato faktura byla vygenerována systémem doklad.ai • ${new Date().toLocaleDateString('cs-CZ')} ${new Date().toLocaleTimeString('cs-CZ')}`, 40, yPos, {
           width: 520,
           align: 'center'
         });

      doc.end();
    } catch (error) {
      console.error('Enhanced PDFKit error:', error);
      reject(error);
    }
  });
}