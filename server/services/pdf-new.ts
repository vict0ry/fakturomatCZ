import puppeteer from 'puppeteer';
import type { Invoice, Customer, InvoiceItem } from "@shared/schema";

export async function generateInvoicePDF(
  invoice: Invoice & { customer: Customer; items: InvoiceItem[] }
): Promise<Buffer> {
  console.log('Generuji PDF pro fakturu:', invoice.invoiceNumber);
  
  // Generate HTML template with proper Czech character support
  const htmlContent = generateInvoiceHTML(invoice);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    
    console.log('PDF vygenerované úspěšně, veľkosť:', pdfBuffer.length, 'bytov');
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('Puppeteer failed:', error);
    throw new Error('PDF generation failed: ' + error.message);
  }
}

function generateInvoiceHTML(invoice: Invoice & { customer: Customer; items: InvoiceItem[] }): string {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('cs-CZ');
  };
  
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
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

  return `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faktura ${invoice.invoiceNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #1f2937;
            background: white;
        }
        
        .invoice-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
            background: white;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #f97316;
        }
        
        .logo-section h1 {
            font-size: 32px;
            font-weight: 700;
            color: #f97316;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        
        .invoice-number {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
        }
        
        .invoice-type {
            display: inline-block;
            padding: 6px 12px;
            background: #f97316;
            color: white;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .company-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
        }
        
        .company-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #f97316;
        }
        
        .company-section h3 {
            font-size: 14px;
            font-weight: 600;
            color: #f97316;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .company-section .company-name {
            font-size: 13px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 8px;
        }
        
        .company-section p {
            font-size: 11px;
            color: #4b5563;
            margin-bottom: 3px;
        }
        
        .invoice-info {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #fef3e2 0%, #fed7aa 100%);
            border-radius: 8px;
        }
        
        .info-item {
            text-align: center;
        }
        
        .info-item .label {
            font-size: 10px;
            font-weight: 500;
            color: #92400e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        
        .info-item .value {
            font-size: 12px;
            font-weight: 600;
            color: #92400e;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .items-table thead {
            background: #f97316;
            color: white;
        }
        
        .items-table th {
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .items-table th:last-child {
            text-align: right;
        }
        
        .items-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 11px;
        }
        
        .items-table tbody tr:nth-child(even) {
            background: #f9fafb;
        }
        
        .items-table tbody tr:hover {
            background: #f3f4f6;
        }
        
        .items-table .text-right {
            text-align: right;
            font-weight: 500;
        }
        
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }
        
        .totals-table {
            min-width: 300px;
        }
        
        .totals-table tr {
            border-bottom: 1px solid #e5e7eb;
        }
        
        .totals-table tr:last-child {
            border-bottom: 3px solid #f97316;
        }
        
        .totals-table td {
            padding: 8px 16px;
            font-size: 12px;
        }
        
        .totals-table .label {
            font-weight: 500;
            color: #374151;
        }
        
        .totals-table .amount {
            text-align: right;
            font-weight: 600;
            color: #111827;
        }
        
        .total-row .label {
            font-size: 14px;
            font-weight: 700;
            color: #f97316;
            text-transform: uppercase;
        }
        
        .total-row .amount {
            font-size: 16px;
            font-weight: 700;
            color: #f97316;
        }
        
        .payment-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #f97316;
            margin-bottom: 30px;
        }
        
        .payment-section h3 {
            font-size: 14px;
            font-weight: 600;
            color: #f97316;
            margin-bottom: 12px;
            text-transform: uppercase;
        }
        
        .payment-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .payment-info p {
            font-size: 11px;
            margin-bottom: 4px;
        }
        
        .payment-info .label {
            font-weight: 500;
            color: #374151;
        }
        
        .notes-section {
            background: #fffbeb;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #fbbf24;
            margin-bottom: 30px;
        }
        
        .notes-section h3 {
            font-size: 12px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
        }
        
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 9px;
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <header class="header">
            <div class="logo-section">
                <h1>FAKTURA</h1>
                <div class="invoice-number">č. ${invoice.invoiceNumber}</div>
            </div>
            <div class="invoice-type">
                ${getInvoiceTypeLabel(invoice.type || 'invoice')}
            </div>
        </header>
        
        <div class="company-details">
            <div class="company-section">
                <h3>Dodavatel</h3>
                <div class="company-name">FakturaAI s.r.o.</div>
                <p>Václavské náměstí 1</p>
                <p>110 00 Praha 1</p>
                <p>IČO: 12345678</p>
                <p>DIČ: CZ12345678</p>
                <p>Tel: +420 123 456 789</p>
                <p>Email: info@fakturaai.cz</p>
            </div>
            
            <div class="company-section">
                <h3>Odběratel</h3>
                <div class="company-name">${invoice.customer.name}</div>
                ${invoice.customer.address ? `<p>${invoice.customer.address}</p>` : ''}
                ${invoice.customer.city && invoice.customer.postalCode ? 
                  `<p>${invoice.customer.postalCode} ${invoice.customer.city}</p>` : ''}
                ${invoice.customer.ico ? `<p>IČO: ${invoice.customer.ico}</p>` : ''}
                ${invoice.customer.dic ? `<p>DIČ: ${invoice.customer.dic}</p>` : ''}
                ${invoice.customer.email ? `<p>Email: ${invoice.customer.email}</p>` : ''}
                ${invoice.customer.phone ? `<p>Tel: ${invoice.customer.phone}</p>` : ''}
            </div>
        </div>
        
        <div class="invoice-info">
            <div class="info-item">
                <div class="label">Datum vystavení</div>
                <div class="value">${formatDate(invoice.issueDate)}</div>
            </div>
            <div class="info-item">
                <div class="label">Datum splatnosti</div>
                <div class="value">${formatDate(invoice.dueDate)}</div>
            </div>
            <div class="info-item">
                <div class="label">Způsob platby</div>
                <div class="value">${getPaymentMethodLabel((invoice as any).paymentMethod)}</div>
            </div>
            <div class="info-item">
                <div class="label">Měna</div>
                <div class="value">${invoice.currency || 'CZK'}</div>
            </div>
        </div>
        
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 40%">Popis</th>
                    <th style="width: 12%">Množství</th>
                    <th style="width: 16%">Cena/ks</th>
                    <th style="width: 12%">DPH %</th>
                    <th style="width: 20%">Celkem</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.items.map(item => {
                  const itemTotal = (parseFloat(item.quantity) * parseFloat(item.unitPrice)).toFixed(2);
                  return `
                    <tr>
                        <td>${item.description}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                        <td class="text-right">${item.vatRate}%</td>
                        <td class="text-right">${formatCurrency(itemTotal)}</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>
        
        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td class="label">Základ DPH:</td>
                    <td class="amount">${formatCurrency(invoice.subtotal)}</td>
                </tr>
                <tr>
                    <td class="label">DPH 21%:</td>
                    <td class="amount">${formatCurrency(invoice.vatAmount)}</td>
                </tr>
                <tr class="total-row">
                    <td class="label">Celkem k úhradě:</td>
                    <td class="amount">${formatCurrency(invoice.total)}</td>
                </tr>
            </table>
        </div>
        
        <div class="payment-section">
            <h3>Platební údaje</h3>
            <div class="payment-details">
                <div class="payment-info">
                    <p><span class="label">Číslo účtu:</span> ${(invoice as any).bankAccount || '123456789/0100'}</p>
                    <p><span class="label">IBAN:</span> CZ6508000000192000145399</p>
                    <p><span class="label">Variabilní symbol:</span> ${(invoice as any).variableSymbol || invoice.invoiceNumber}</p>
                    ${(invoice as any).constantSymbol ? 
                      `<p><span class="label">Konstantní symbol:</span> ${(invoice as any).constantSymbol}</p>` : ''}
                </div>
                <div class="qr-section">
                    <!-- QR kód bude přidán později -->
                </div>
            </div>
        </div>
        
        ${invoice.notes ? `
        <div class="notes-section">
            <h3>Poznámky</h3>
            <p>${invoice.notes}</p>
        </div>
        ` : ''}
        
        <footer class="footer">
            <p>FakturaAI s.r.o. | Václavské náměstí 1, 110 00 Praha 1 | IČO: 12345678 | DIČ: CZ12345678</p>
            <p>www.fakturaai.cz | info@fakturaai.cz | +420 123 456 789</p>
        </footer>
    </div>
</body>
</html>`;
}

function getInvoiceTypeLabel(type: string) {
  const types = {
    invoice: 'Faktura',
    proforma: 'Proforma faktura',
    credit_note: 'Dobropis'
  };
  return types[type as keyof typeof types] || 'Faktura';
}