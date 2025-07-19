export function generateInvoiceHTML(invoice: any): string {
  const items = invoice.items || [];
  const customer = invoice.customer || {};
  const company = invoice.company || {};
  
  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${parseFloat(item.unitPrice || 0).toLocaleString('cs-CZ')} Kč</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${parseFloat(item.total || 0).toLocaleString('cs-CZ')} Kč</td>
    </tr>
  `).join('');

  const subtotal = parseFloat(invoice.subtotal || 0);
  const vatAmount = parseFloat(invoice.vatAmount || 0);
  const total = parseFloat(invoice.total || 0);

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Faktura ${invoice.invoiceNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .company-info { text-align: left; }
        .invoice-info { text-align: right; }
        .customer-info { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
        .totals { margin-top: 20px; text-align: right; }
        .print-btn { position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
        @media print { .print-btn { display: none; } }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">Vytisknout PDF</button>
    
    <div class="header">
        <div class="company-info">
            <h2>${company.name || 'Název společnosti'}</h2>
            <p>${company.address || ''}<br>
            ${company.city || ''} ${company.zipCode || ''}<br>
            IČO: ${company.companyId || ''}<br>
            DIČ: ${company.vatNumber || ''}</p>
        </div>
        <div class="invoice-info">
            <h1>FAKTURA</h1>
            <p><strong>Číslo:</strong> ${invoice.invoiceNumber}<br>
            <strong>Datum vystavení:</strong> ${new Date(invoice.issueDate).toLocaleDateString('cs-CZ')}<br>
            <strong>Datum splatnosti:</strong> ${new Date(invoice.dueDate).toLocaleDateString('cs-CZ')}</p>
        </div>
    </div>

    <div class="customer-info">
        <h3>Odběratel:</h3>
        <p><strong>${customer.name || 'Název zákazníka'}</strong><br>
        ${customer.address || ''}<br>
        ${customer.city || ''} ${customer.zipCode || ''}<br>
        IČO: ${customer.companyId || ''}<br>
        DIČ: ${customer.vatNumber || ''}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Popis</th>
                <th style="text-align: center;">Množství</th>
                <th style="text-align: right;">Cena za ks</th>
                <th style="text-align: right;">Celkem</th>
            </tr>
        </thead>
        <tbody>
            ${itemsHtml}
        </tbody>
    </table>

    <div class="totals">
        <p><strong>Částka bez DPH:</strong> ${subtotal.toLocaleString('cs-CZ')} Kč</p>
        <p><strong>DPH (21%):</strong> ${vatAmount.toLocaleString('cs-CZ')} Kč</p>
        <h3><strong>Celkem k úhradě:</strong> ${total.toLocaleString('cs-CZ')} Kč</h3>
    </div>

    <script>
        // Auto-print on load if requested
        if (window.location.search.includes('print=true')) {
            window.onload = () => setTimeout(() => window.print(), 500);
        }
    </script>
</body>
</html>
  `;
}