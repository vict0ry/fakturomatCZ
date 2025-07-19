import type { Invoice, Customer, InvoiceItem } from "@shared/schema";

export async function generateInvoicePDF(
  invoice: Invoice & { customer: Customer; items: InvoiceItem[] }
): Promise<Buffer> {
  console.log('Generuji PDF pro fakturu:', invoice.invoiceNumber);
  
  try {
    // Import html-pdf-node dynamically
    const htmlPdf = await import('html-pdf-node');
    
    const htmlContent = generateInvoiceHTML(invoice);
    
    const options = {
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm', 
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    };
    
    const file = { content: htmlContent };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    
    console.log('PDF vygenerované úspěšně, velikost:', pdfBuffer.length, 'bytů');
    return pdfBuffer;
    
  } catch (error) {
    console.error('HTML-PDF failed:', error);
    
    // Try with simple jsPDF as final fallback
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Simple text-based PDF
      doc.setFontSize(20);
      doc.text('FAKTURA', 20, 30);
      
      doc.setFontSize(12);
      doc.text(`Číslo: ${invoice.invoiceNumber}`, 20, 45);
      
      doc.text('Dodavatel:', 20, 65);
      doc.setFontSize(10);
      doc.text('FakturaAI s.r.o.', 20, 75);
      doc.text('Václavské náměstí 1, Praha', 20, 82);
      doc.text('IČO: 12345678', 20, 89);
      
      doc.setFontSize(12);
      doc.text('Odběratel:', 20, 110);
      doc.setFontSize(10);
      doc.text(invoice.customer.name, 20, 120);
      if (invoice.customer.address) {
        doc.text(invoice.customer.address, 20, 127);
      }
      if (invoice.customer.ico) {
        doc.text(`IČO: ${invoice.customer.ico}`, 20, 134);
      }
      
      // Items
      let y = 160;
      doc.setFontSize(12);
      doc.text('Položky:', 20, y);
      y += 10;
      
      doc.setFontSize(9);
      invoice.items.forEach((item) => {
        const itemTotal = (parseFloat(item.quantity) * parseFloat(item.unitPrice)).toFixed(2);
        doc.text(`${item.description} - ${item.quantity}x ${item.unitPrice} Kč = ${itemTotal} Kč`, 20, y);
        y += 7;
      });
      
      // Totals
      y += 10;
      doc.setFontSize(12);
      doc.text(`Celkem bez DPH: ${invoice.subtotal} Kč`, 20, y);
      doc.text(`DPH: ${invoice.vatAmount} Kč`, 20, y + 10);
      doc.setFontSize(14);
      doc.text(`CELKEM: ${invoice.total} Kč`, 20, y + 25);
      
      const pdfData = doc.output('arraybuffer');
      const buffer = Buffer.from(pdfData);
      
      console.log('Fallback PDF vygenerováno, velikost:', buffer.length, 'bytů');
      return buffer;
      
    } catch (jsPdfError) {
      console.error('jsPDF also failed:', jsPdfError);
      throw new Error('All PDF generation methods failed');
    }
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

  return `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <title>Faktura ${invoice.invoiceNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid #f97316;
        }
        
        .logo h1 {
            font-size: 32px;
            color: #f97316;
            font-weight: bold;
            margin: 0;
        }
        
        .invoice-number {
            font-size: 16px;
            font-weight: bold;
        }
        
        .companies {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .company {
            width: 45%;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #f97316;
        }
        
        .company h3 {
            color: #f97316;
            font-size: 14px;
            font-weight: bold;
            margin: 0 0 15px 0;
            text-transform: uppercase;
        }
        
        .company-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .company div {
            margin-bottom: 3px;
        }
        
        .dates {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            background: #fef3e2;
            padding: 20px;
            border-radius: 8px;
        }
        
        .date-item {
            text-align: center;
            flex: 1;
        }
        
        .date-label {
            font-size: 11px;
            color: #92400e;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .date-value {
            font-size: 13px;
            font-weight: bold;
            color: #92400e;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .items-table thead {
            background: #f97316;
            color: white;
        }
        
        .items-table th, .items-table td {
            padding: 12px 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        .items-table th {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .items-table tbody tr:nth-child(even) {
            background: #f9fafb;
        }
        
        .text-right {
            text-align: right;
        }
        
        .totals {
            margin-left: auto;
            width: 350px;
            margin-bottom: 30px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 16px;
            border-bottom: 1px solid #eee;
        }
        
        .total-row.final {
            border-bottom: 3px solid #f97316;
            font-weight: bold;
            font-size: 16px;
            color: #f97316;
            background: #fef3e2;
        }
        
        .payment {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #f97316;
            margin-bottom: 20px;
        }
        
        .payment h3 {
            color: #f97316;
            font-size: 14px;
            font-weight: bold;
            margin: 0 0 15px 0;
            text-transform: uppercase;
        }
        
        .payment-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .payment-item {
            font-size: 12px;
        }
        
        .payment-label {
            font-weight: bold;
            color: #666;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 15px;
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