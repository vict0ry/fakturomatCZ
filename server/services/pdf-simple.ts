import puppeteer from 'puppeteer';
import type { Invoice, Customer, InvoiceItem } from "@shared/schema";

export async function generateInvoicePDF(
  invoice: Invoice & { customer: Customer; items: InvoiceItem[] }
): Promise<Buffer> {
  console.log('Generuji PDF pro fakturu:', invoice.invoiceNumber);
  
  // Try Puppeteer with better configuration
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      executablePath: process.env.CHROME_PATH || undefined
    });
    
    const page = await browser.newPage();
    const htmlContent = generateSimpleInvoiceHTML(invoice);
    
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });
    
    await browser.close();
    
    console.log('PDF vygenerované úspěšně, velikost:', pdfBuffer.length, 'bytů');
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore close errors
      }
    }
    console.error('Puppeteer failed:', error.message);
    throw new Error('PDF generation failed: ' + error.message);
  }
}

function generateSimpleInvoiceHTML(invoice: Invoice & { customer: Customer; items: InvoiceItem[] }): string {
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

  return `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <title>Faktura ${invoice.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            background: white;
            padding: 20px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f97316;
        }
        
        .logo h1 {
            font-size: 28px;
            color: #f97316;
            font-weight: bold;
        }
        
        .invoice-info {
            text-align: right;
        }
        
        .invoice-number {
            font-size: 14px;
            font-weight: bold;
            color: #333;
        }
        
        .companies {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .company {
            width: 48%;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #f97316;
        }
        
        .company h3 {
            color: #f97316;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        .company-name {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 5px;
        }
        
        .dates {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            background: #fef3e2;
            padding: 15px;
            border-radius: 5px;
        }
        
        .date-item {
            text-align: center;
            flex: 1;
        }
        
        .date-label {
            font-size: 9px;
            color: #92400e;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 3px;
        }
        
        .date-value {
            font-size: 11px;
            font-weight: bold;
            color: #92400e;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .items-table thead {
            background: #f97316;
            color: white;
        }
        
        .items-table th, .items-table td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        .items-table th {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .items-table td {
            font-size: 10px;
        }
        
        .text-right {
            text-align: right;
        }
        
        .totals {
            margin-left: auto;
            width: 300px;
            margin-bottom: 20px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
        
        .total-row.final {
            border-bottom: 2px solid #f97316;
            font-weight: bold;
            font-size: 12px;
            color: #f97316;
        }
        
        .payment {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #f97316;
            margin-bottom: 20px;
        }
        
        .payment h3 {
            color: #f97316;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        .payment-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        
        .payment-item {
            font-size: 10px;
        }
        
        .payment-label {
            font-weight: bold;
            color: #666;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 8px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <h1>FAKTURA</h1>
        </div>
        <div class="invoice-info">
            <div class="invoice-number">č. ${invoice.invoiceNumber}</div>
        </div>
    </div>
    
    <div class="companies">
        <div class="company">
            <h3>Dodavatel</h3>
            <div class="company-name">FakturaAI s.r.o.</div>
            <div>Václavské náměstí 1</div>
            <div>110 00 Praha 1</div>
            <div>IČO: 12345678</div>
            <div>DIČ: CZ12345678</div>
            <div>Tel: +420 123 456 789</div>
            <div>Email: info@fakturaai.cz</div>
        </div>
        
        <div class="company">
            <h3>Odběratel</h3>
            <div class="company-name">${invoice.customer.name}</div>
            ${invoice.customer.address ? `<div>${invoice.customer.address}</div>` : ''}
            ${invoice.customer.city && invoice.customer.postalCode ? 
              `<div>${invoice.customer.postalCode} ${invoice.customer.city}</div>` : ''}
            ${invoice.customer.ico ? `<div>IČO: ${invoice.customer.ico}</div>` : ''}
            ${invoice.customer.dic ? `<div>DIČ: ${invoice.customer.dic}</div>` : ''}
            ${invoice.customer.email ? `<div>Email: ${invoice.customer.email}</div>` : ''}
            ${invoice.customer.phone ? `<div>Tel: ${invoice.customer.phone}</div>` : ''}
        </div>
    </div>
    
    <div class="dates">
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
            <div class="date-value">Bankovní převod</div>
        </div>
        <div class="date-item">
            <div class="date-label">Měna</div>
            <div class="date-value">${invoice.currency || 'CZK'}</div>
        </div>
    </div>
    
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 40%">Popis</th>
                <th style="width: 15%">Množství</th>
                <th style="width: 15%">Cena/ks</th>
                <th style="width: 10%">DPH %</th>
                <th style="width: 20%" class="text-right">Celkem</th>
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
    
    <div class="totals">
        <div class="total-row">
            <span>Základ DPH:</span>
            <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        <div class="total-row">
            <span>DPH 21%:</span>
            <span>${formatCurrency(invoice.vatAmount)}</span>
        </div>
        <div class="total-row final">
            <span>CELKEM K ÚHRADĚ:</span>
            <span>${formatCurrency(invoice.total)}</span>
        </div>
    </div>
    
    <div class="payment">
        <h3>Platební údaje</h3>
        <div class="payment-info">
            <div class="payment-item">
                <span class="payment-label">Číslo účtu:</span> 123456789/0100
            </div>
            <div class="payment-item">
                <span class="payment-label">IBAN:</span> CZ6508000000192000145399
            </div>
            <div class="payment-item">
                <span class="payment-label">Variabilní symbol:</span> ${invoice.invoiceNumber}
            </div>
            <div class="payment-item">
                <span class="payment-label">Konstantní symbol:</span> 0308
            </div>
        </div>
    </div>
    
    ${invoice.notes ? `
    <div class="payment">
        <h3>Poznámky</h3>
        <div>${invoice.notes}</div>
    </div>
    ` : ''}
    
    <div class="footer">
        <div>FakturaAI s.r.o. | Václavské náměstí 1, 110 00 Praha 1 | IČO: 12345678 | DIČ: CZ12345678</div>
        <div>www.fakturaai.cz | info@fakturaai.cz | +420 123 456 789</div>
    </div>
</body>
</html>`;
}