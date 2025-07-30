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
  
  const htmlContent = generateInvoiceHTML(invoice, qrCodeDataURL);
  
  try {
    // Try Puppeteer first
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
    console.log('Puppeteer failed, falling back to alternative PDF generation:', puppeteerError.message);
    
    // Alternative PDF generation using PDFKit
    return generatePDFWithPDFKit(invoice);
  }
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

  const getPaymentMethodLabel = (method: string | null) => {
    const methods = {
      bank_transfer: "Bankovní převod",
      card: "Platební karta",
      cash: "Hotovost",
      online: "Online platba",
      cheque: "Šek"
    };
    return methods[method as keyof typeof methods] || "Bankovní převod";
  };

  const getDeliveryMethodLabel = (method: string | null) => {
    const methods = {
      email: "E-mail",
      post: "Poštou",
      pickup: "Osobní odběr",
      courier: "Kurýr"
    };
    return methods[method as keyof typeof methods] || "E-mail";
  };

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

  const getPaymentMethodLabel = (method: string | null) => {
    const methods = {
      bank_transfer: "Bankovní převod",
      card: "Platební karta",
      cash: "Hotovost",
      online: "Online platba",
      cheque: "Šek"
    };
    return methods[method as keyof typeof methods] || "Bankovní převod";
  };

  const getDeliveryMethodLabel = (method: string | null) => {
    const methods = {
      pickup: "Osobní odběr",
      delivery: "Doručení",
      post: "Česká pošta", 
      courier: "Kurýr"
    };
    return methods[method as keyof typeof methods] || "Osobní odběr";
  };

  return `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Faktura ${invoice.invoiceNumber}</title>
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          margin: 0;
          padding: 40px;
          font-size: 12px;
          line-height: 1.5;
          color: #2d3748;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .invoice-container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #3182ce;
        }
        .logo-section {
          flex: 1;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #3182ce;
          margin-bottom: 5px;
        }
        .company-details {
          font-size: 11px;
          color: #718096;
          line-height: 1.4;
        }
        .invoice-details {
          text-align: right;
          flex: 1;
        }
        .invoice-title {
          font-size: 32px;
          font-weight: bold;
          color: #3182ce;
          margin-bottom: 10px;
        }
        .invoice-number {
          font-size: 14px;
          color: #4a5568;
          margin-bottom: 5px;
        }
        .invoice-date {
          font-size: 12px;
          color: #718096;
        }
        .parties-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          gap: 40px;
        }
        .party-block {
          flex: 1;
          background: #f7fafc;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #3182ce;
        }
        .party-title {
          font-size: 14px;
          font-weight: bold;
          color: #3182ce;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .party-name {
          font-size: 16px;
          font-weight: bold;
          color: #2d3748;
          margin-bottom: 8px;
        }
        .party-details {
          font-size: 12px;
          color: #4a5568;
          line-height: 1.6;
        }
        .dates-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          background: #edf2f7;
          padding: 15px 20px;
          border-radius: 8px;
        }
        .date-item {
          text-align: center;
        }
        .date-label {
          font-size: 11px;
          color: #718096;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .date-value {
          font-size: 14px;
          font-weight: bold;
          color: #2d3748;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .items-table th {
          background: linear-gradient(135deg, #3182ce 0%, #2c5aa0 100%);
          color: white;
          padding: 15px 12px;
          font-weight: bold;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: none;
        }
        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          vertical-align: top;
        }
        .items-table td:last-child {
          border-right: none;
        }
        .items-table tbody tr:last-child td {
          border-bottom: none;
        }
        .items-table tbody tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .items-table .amount {
          text-align: right;
          font-weight: 600;
        }
        .items-table .description {
          font-weight: 500;
          color: #2d3748;
        }
        .summary-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        .totals {
          width: 350px;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        .total-row:last-child {
          border-bottom: none;
        }
        .total-row.subtotal {
          background: white;
        }
        .total-row.tax {
          background: #edf2f7;
        }
        .total-row.final {
          background: linear-gradient(135deg, #3182ce 0%, #2c5aa0 100%);
          color: white;
          font-weight: bold;
          font-size: 16px;
        }
        .total-label {
          font-weight: 600;
        }
        .total-amount {
          font-weight: bold;
        }
        .payment-info {
          background: #f0fff4;
          border: 1px solid #9ae6b4;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .payment-title {
          font-size: 14px;
          font-weight: bold;
          color: #22543d;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
        }
        .payment-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .payment-item {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        .payment-label {
          color: #22543d;
          font-weight: 600;
        }
        .payment-value {
          color: #2d3748;
          font-weight: bold;
        }
        .notes-section {
          background: #fffaf0;
          border: 1px solid #fbd38d;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .notes-title {
          font-size: 14px;
          font-weight: bold;
          color: #9c4221;
          margin-bottom: 10px;
        }
        .notes-content {
          color: #2d3748;
          line-height: 1.6;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #718096;
          font-size: 11px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 10px;
        }
        .status-paid {
          background: #c6f6d5;
          color: #22543d;
        }
        .status-sent {
          background: #bee3f8;
          color: #2a69ac;
        }
        .status-draft {
          background: #fed7d7;
          color: #9b2c2c;
        }
        .status-overdue {
          background: #fbb6ce;
          color: #97266d;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header Section -->
        <div class="header">
          <div class="logo-section">
            <div class="company-name">FakturaAI s.r.o.</div>
            <div class="company-details">
              Václavské náměstí 1<br>
              110 00 Praha 1<br>
              IČO: 12345678 | DIČ: CZ12345678<br>
              Tel: +420 123 456 789<br>
              Email: info@fakturaai.cz
            </div>
          </div>
          <div class="invoice-details">
            <div class="invoice-title">FAKTURA</div>
            <div class="invoice-number">Číslo: ${invoice.invoiceNumber}</div>
            <div class="invoice-date">Vystaveno: ${formatDate(invoice.issueDate)}</div>
            <div class="status-badge status-${invoice.status}">
              ${invoice.status === 'paid' ? 'ZAPLACENO' : 
                invoice.status === 'sent' ? 'ODESLÁNO' :
                invoice.status === 'draft' ? 'KONCEPT' :
                invoice.status === 'overdue' ? 'PO SPLATNOSTI' : invoice.status.toUpperCase()}
            </div>
          </div>
        </div>

        <!-- Parties Section -->
        <div class="parties-section">
          <div class="party-block">
            <div class="party-title">Dodavatel</div>
            <div class="party-name">FakturaAI s.r.o.</div>
            <div class="party-details">
              Václavské náměstí 1<br>
              110 00 Praha 1<br>
              <strong>IČO:</strong> 12345678<br>
              <strong>DIČ:</strong> CZ12345678<br>
              <strong>Tel:</strong> +420 123 456 789<br>
              <strong>Email:</strong> info@fakturaai.cz
            </div>
          </div>
          
          <div class="party-block">
            <div class="party-title">Odběratel</div>
            <div class="party-name">${invoice.customer.name}</div>
            <div class="party-details">
              ${invoice.customer.address || ''}<br>
              ${invoice.customer.city ? `${invoice.customer.city}${invoice.customer.postalCode ? ` ${invoice.customer.postalCode}` : ''}` : ''}<br>
              ${invoice.customer.ico ? `<strong>IČO:</strong> ${invoice.customer.ico}<br>` : ''}
              ${invoice.customer.dic ? `<strong>DIČ:</strong> ${invoice.customer.dic}<br>` : ''}
              ${invoice.customer.phone ? `<strong>Tel:</strong> ${invoice.customer.phone}<br>` : ''}
              ${invoice.customer.email ? `<strong>Email:</strong> ${invoice.customer.email}` : ''}
            </div>
          </div>
        </div>

        <!-- Dates Section -->
        <div class="dates-section">
          <div class="date-item">
            <div class="date-label">Datum vystavení</div>
            <div class="date-value">${formatDate(invoice.issueDate)}</div>
          </div>
          <div class="date-item">
            <div class="date-label">Datum splatnosti</div>
            <div class="date-value">${formatDate(invoice.dueDate)}</div>
          </div>
          <div class="date-item">
            <div class="date-label">Způsob platby</div>
            <div class="date-value">${getPaymentMethodLabel((invoice as any).paymentMethod)}</div>
          </div>
          <div class="date-item">
            <div class="date-label">Měna</div>
            <div class="date-value">${invoice.currency || 'CZK'}</div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>Popis služby/produktu</th>
              <th style="width: 80px;">Množství</th>
              <th style="width: 60px;">Jednotka</th>
              <th style="width: 100px;">Cena/jednotka</th>
              <th style="width: 80px;">DPH %</th>
              <th style="width: 120px;">Celkem bez DPH</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td class="description">${item.description || 'Služba'}</td>
                <td class="amount">${Number(item.quantity).toLocaleString('cs-CZ')}</td>
                <td>ks</td>
                <td class="amount">${formatCurrency(item.unitPrice)}</td>
                <td class="amount">${item.vatRate}%</td>
                <td class="amount">${formatCurrency(calculateItemTotal(item.quantity, item.unitPrice))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Summary Section -->
        <div class="summary-section">
          <div class="totals">
            <div class="total-row subtotal">
              <span class="total-label">Základ DPH 21%:</span>
              <span class="total-amount">${formatCurrency(invoice.subtotal)}</span>
            </div>
            <div class="total-row tax">
              <span class="total-label">DPH 21%:</span>
              <span class="total-amount">${formatCurrency(invoice.vatAmount)}</span>
            </div>
            <div class="total-row final">
              <span class="total-label">Celkem k úhradě:</span>
              <span class="total-amount">${formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        <!-- Payment Information -->
        <div class="payment-info">
          <div class="payment-title">💳 Platební údaje</div>
          <div class="payment-details">
            <div class="payment-item">
              <span class="payment-label">Způsob platby:</span>
              <span class="payment-value">${getPaymentMethodLabel((invoice as any).paymentMethod)}</span>
            </div>
            ${((invoice as any).paymentMethod === 'bank_transfer' || !(invoice as any).paymentMethod) ? `
            <div class="payment-item">
              <span class="payment-label">Číslo účtu:</span>
              <span class="payment-value">${(invoice as any).bankAccount || '123456789/0100'}</span>
            </div>
            <div class="payment-item">
              <span class="payment-label">IBAN:</span>
              <span class="payment-value">CZ6508000000192000145399</span>
            </div>
            <div class="payment-item">
              <span class="payment-label">Variabilní symbol:</span>
              <span class="payment-value">${(invoice as any).variableSymbol || invoice.invoiceNumber}</span>
            </div>
            ${(invoice as any).constantSymbol ? `
            <div class="payment-item">
              <span class="payment-label">Konstantní symbol:</span>
              <span class="payment-value">${(invoice as any).constantSymbol}</span>
            </div>
            ` : ''}
            ${(invoice as any).specificSymbol ? `
            <div class="payment-item">
              <span class="payment-label">Specifický symbol:</span>
              <span class="payment-value">${(invoice as any).specificSymbol}</span>
            </div>
            ` : ''}
            ` : ''}
            ${(invoice as any).orderNumber ? `
            <div class="payment-item">
              <span class="payment-label">Číslo objednávky:</span>
              <span class="payment-value">${(invoice as any).orderNumber}</span>
            </div>
            ` : ''}
            ${(invoice as any).paymentReference ? `
            <div class="payment-item">
              <span class="payment-label">Reference platby:</span>
              <span class="payment-value">${(invoice as any).paymentReference}</span>
            </div>
            ` : ''}
          </div>
        </div>

        ${((invoice as any).deliveryMethod && (invoice as any).deliveryMethod !== 'email') ? `
        <!-- Delivery Information -->
        <div class="notes-section">
          <div class="notes-title">🚚 Dodání</div>
          <div class="notes-content">
            <strong>Způsob dodání:</strong> ${getDeliveryMethodLabel((invoice as any).deliveryMethod)}<br>
            ${(invoice as any).deliveryAddress ? `<strong>Adresa dodání:</strong> ${(invoice as any).deliveryAddress}<br>` : ''}
          </div>
        </div>
        ` : ''}

        ${(invoice as any).warranty ? `
        <!-- Warranty Information -->
        <div class="notes-section">
          <div class="notes-title">🛡️ Záruka</div>
          <div class="notes-content">
            ${(invoice as any).warranty}
          </div>
        </div>
        ` : ''}

        ${invoice.notes ? `
        <!-- Notes Section -->
        <div class="notes-section">
          <div class="notes-title">📝 Poznámky</div>
          <div class="notes-content">${invoice.notes}</div>
        </div>
        ` : ''}

        ${invoice.isReverseCharge ? `
        <!-- Reverse Charge Notice -->
        <div class="notes-section">
          <div class="notes-title">⚠️ Režim přenesení daňové povinnosti</div>
          <div class="notes-content">
            Tato faktura je vystavena v režimu přenesení daňové povinnosti podle § 92e zákona o DPH.
            DPH odvede příjemce plnění.
          </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p>
            <strong>FakturaAI s.r.o.</strong> | 
            Václavské náměstí 1, 110 00 Praha 1 | 
            IČO: 12345678 | DIČ: CZ12345678<br>
            www.fakturaai.cz | info@fakturaai.cz | +420 123 456 789
          </p>
          <p style="margin-top: 10px; font-size: 10px;">
            Děkujeme za spolupráci a těšíme se na další obchodní vztahy.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}