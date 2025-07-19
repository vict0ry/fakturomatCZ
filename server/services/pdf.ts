import puppeteer from "puppeteer";
import { Invoice, Customer, InvoiceItem } from '@shared/schema';

export async function generateInvoicePDF(
  invoice: Invoice & { customer: Customer; items: InvoiceItem[] }
): Promise<Buffer> {
  const htmlContent = generateInvoiceHTML(invoice);
  
  // Launch headless browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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
      printBackground: true
    });
    
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

function generateInvoiceHTML(invoice: Invoice & { customer: Customer; items: InvoiceItem[] }): string {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('cs-CZ');
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK'
    }).format(Number(amount));
  };

  return `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Faktura ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          font-size: 14px;
          line-height: 1.4;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #2563EB;
          padding-bottom: 20px;
        }
        .invoice-title {
          font-size: 28px;
          font-weight: bold;
          color: #2563EB;
          margin-bottom: 10px;
        }
        .invoice-number {
          font-size: 18px;
          color: #666;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .info-block {
          width: 45%;
        }
        .info-block h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
          color: #2563EB;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
        }
        .info-block p {
          margin: 5px 0;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .items-table th,
        .items-table td {
          border: 1px solid #e2e8f0;
          padding: 12px;
          text-align: left;
        }
        .items-table th {
          background-color: #f8fafc;
          font-weight: bold;
          color: #2563EB;
        }
        .items-table .amount {
          text-align: right;
        }
        .totals {
          margin-left: auto;
          width: 300px;
          margin-bottom: 30px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .total-row.final {
          font-weight: bold;
          font-size: 16px;
          border-bottom: 2px solid #2563EB;
          color: #2563EB;
        }
        .payment-info {
          background-color: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .payment-info h3 {
          margin: 0 0 15px 0;
          color: #2563EB;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        @media print {
          body { margin: 0; }
          .info-section { display: block; }
          .info-block { width: 100%; margin-bottom: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="invoice-title">FAKTURA</div>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
      </div>

      <div class="info-section">
        <div class="info-block">
          <h3>Dodavatel</h3>
          <p><strong>Test s.r.o.</strong></p>
          <p>Testovací 123</p>
          <p>110 00 Praha 1</p>
          <p>IČO: 12345678</p>
          <p>DIČ: CZ12345678</p>
        </div>
        
        <div class="info-block">
          <h3>Odběratel</h3>
          <p><strong>${invoice.customer.name}</strong></p>
          ${invoice.customer.address ? `<p>${invoice.customer.address}</p>` : ''}
          ${invoice.customer.city ? `<p>${invoice.customer.postalCode} ${invoice.customer.city}</p>` : ''}
          ${invoice.customer.ico ? `<p>IČO: ${invoice.customer.ico}</p>` : ''}
          ${invoice.customer.dic ? `<p>DIČ: ${invoice.customer.dic}</p>` : ''}
        </div>
      </div>

      <div class="info-section">
        <div class="info-block">
          <p><strong>Datum vystavení:</strong> ${formatDate(invoice.issueDate)}</p>
          <p><strong>Datum splatnosti:</strong> ${formatDate(invoice.dueDate)}</p>
        </div>
        <div class="info-block">
          <p><strong>Způsob platby:</strong> Bankovní převod</p>
          <p><strong>Variabilní symbol:</strong> ${invoice.invoiceNumber.replace(/\D/g, '')}</p>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Popis</th>
            <th>Množství</th>
            <th>Jednotková cena</th>
            <th>DPH %</th>
            <th class="amount">Celkem bez DPH</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td class="amount">${formatCurrency(item.unitPrice)}</td>
              <td>${item.vatRate}%</td>
              <td class="amount">${formatCurrency(Number(item.unitPrice) * Number(item.quantity))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Celkem bez DPH:</span>
          <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        <div class="total-row">
          <span>DPH 21%:</span>
          <span>${formatCurrency(invoice.vatAmount)}</span>
        </div>
        <div class="total-row final">
          <span>Celkem k úhradě:</span>
          <span>${formatCurrency(invoice.total)}</span>
        </div>
      </div>

      <div class="payment-info">
        <h3>Platební údaje</h3>
        <p><strong>Číslo účtu:</strong> 123456789/0100</p>
        <p><strong>Variabilní symbol:</strong> ${invoice.invoiceNumber.replace(/\D/g, '')}</p>
        <p><strong>Částka k úhradě:</strong> ${formatCurrency(invoice.total)}</p>
      </div>

      ${invoice.notes ? `
        <div class="payment-info">
          <h3>Poznámky</h3>
          <p>${invoice.notes}</p>
        </div>
      ` : ''}

      <div class="footer">
        <p>Děkujeme za spolupráci | FakturaAI s.r.o. | www.fakturaai.cz</p>
      </div>
    </body>
    </html>
  `;
}
