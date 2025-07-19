import PDFDocument from 'pdfkit';
import type { Invoice, Customer, InvoiceItem } from "@shared/schema";

export async function generateInvoicePDF(
  invoice: Invoice & { customer: Customer; items: InvoiceItem[] }
): Promise<Buffer> {
  console.log('Generuji PDF pro fakturu:', invoice.invoiceNumber);
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });
      
      const buffers: Buffer[] = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        console.log('PDF vygenerované úspěšně, velikost:', pdfData.length, 'bytů');
        resolve(pdfData);
      });
      
      doc.on('error', reject);
      
      // Header
      doc.fontSize(28)
         .fillColor('#f97316')
         .text('FAKTURA', 50, 50);
      
      doc.fontSize(14)
         .fillColor('#333333')
         .text(`č. ${invoice.invoiceNumber}`, 50, 85);
      
      // Company sections
      let yPos = 130;
      
      // Supplier
      doc.fontSize(14)
         .fillColor('#f97316')
         .text('DODAVATEL', 50, yPos);
      
      yPos += 25;
      doc.fontSize(12)
         .fillColor('#333333')
         .text('FakturaAI s.r.o.', 50, yPos)
         .text('Václavské náměstí 1', 50, yPos + 15)
         .text('110 00 Praha 1', 50, yPos + 30)
         .text('IČO: 12345678', 50, yPos + 45)
         .text('DIČ: CZ12345678', 50, yPos + 60)
         .text('Tel: +420 123 456 789', 50, yPos + 75)
         .text('Email: info@fakturaai.cz', 50, yPos + 90);
      
      // Customer
      doc.fontSize(14)
         .fillColor('#f97316')
         .text('ODBĚRATEL', 300, 130);
      
      yPos = 155;
      doc.fontSize(12)
         .fillColor('#333333')
         .text(invoice.customer.name, 300, yPos);
      
      if (invoice.customer.address) {
        yPos += 15;
        doc.text(invoice.customer.address, 300, yPos);
      }
      
      if (invoice.customer.city && invoice.customer.postalCode) {
        yPos += 15;
        doc.text(`${invoice.customer.postalCode} ${invoice.customer.city}`, 300, yPos);
      }
      
      if (invoice.customer.ico) {
        yPos += 15;
        doc.text(`IČO: ${invoice.customer.ico}`, 300, yPos);
      }
      
      if (invoice.customer.dic) {
        yPos += 15;
        doc.text(`DIČ: ${invoice.customer.dic}`, 300, yPos);
      }
      
      if (invoice.customer.email) {
        yPos += 15;
        doc.text(`Email: ${invoice.customer.email}`, 300, yPos);
      }
      
      if (invoice.customer.phone) {
        yPos += 15;
        doc.text(`Tel: ${invoice.customer.phone}`, 300, yPos);
      }
      
      // Invoice details
      yPos = 280;
      
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
      
      // Date info box
      doc.rect(50, yPos, 495, 60)
         .fillAndStroke('#fef3e2', '#f97316');
      
      doc.fontSize(10)
         .fillColor('#92400e')
         .text('DATUM VYSTAVENÍ', 70, yPos + 10)
         .text(formatDate(invoice.issueDate), 70, yPos + 25);
      
      doc.text('DATUM SPLATNOSTI', 180, yPos + 10)
         .text(formatDate(invoice.dueDate), 180, yPos + 25);
      
      doc.text('ZPŮSOB PLATBY', 290, yPos + 10)
         .text('Bankovní převod', 290, yPos + 25);
      
      doc.text('MĚNA', 400, yPos + 10)
         .text(invoice.currency || 'CZK', 400, yPos + 25);
      
      // Items table
      yPos += 80;
      
      // Table header
      doc.rect(50, yPos, 495, 25)
         .fillAndStroke('#f97316', '#f97316');
      
      doc.fontSize(10)
         .fillColor('white')
         .text('POPIS', 60, yPos + 8)
         .text('MNOŽSTVÍ', 250, yPos + 8)
         .text('CENA/KS', 320, yPos + 8)
         .text('DPH %', 390, yPos + 8)
         .text('CELKEM', 450, yPos + 8);
      
      yPos += 25;
      
      // Table rows
      invoice.items.forEach((item, index) => {
        const itemTotal = (parseFloat(item.quantity) * parseFloat(item.unitPrice)).toFixed(2);
        
        // Alternate row colors
        if (index % 2 === 1) {
          doc.rect(50, yPos, 495, 20)
             .fillAndStroke('#f9fafb', '#f9fafb');
        }
        
        doc.fontSize(10)
           .fillColor('#333333')
           .text(item.description.substring(0, 30), 60, yPos + 5)
           .text(item.quantity, 250, yPos + 5)
           .text(formatCurrency(item.unitPrice), 320, yPos + 5)
           .text(`${item.vatRate}%`, 390, yPos + 5)
           .text(formatCurrency(itemTotal), 450, yPos + 5);
        
        yPos += 20;
      });
      
      // Line after table
      doc.moveTo(50, yPos)
         .lineTo(545, yPos)
         .strokeColor('#ddd')
         .stroke();
      
      yPos += 30;
      
      // Totals
      const totalsX = 350;
      
      doc.fontSize(12)
         .fillColor('#333333')
         .text('Základ DPH:', totalsX, yPos)
         .text(formatCurrency(invoice.subtotal), totalsX + 100, yPos);
      
      yPos += 20;
      doc.text('DPH 21%:', totalsX, yPos)
         .text(formatCurrency(invoice.vatAmount), totalsX + 100, yPos);
      
      yPos += 20;
      
      // Total with background
      doc.rect(totalsX - 10, yPos - 5, 200, 25)
         .fillAndStroke('#fef3e2', '#f97316');
      
      doc.fontSize(14)
         .fillColor('#f97316')
         .text('CELKEM K ÚHRADĚ:', totalsX, yPos + 3)
         .text(formatCurrency(invoice.total), totalsX + 100, yPos + 3);
      
      yPos += 50;
      
      // Payment details
      doc.rect(50, yPos, 495, 80)
         .fillAndStroke('#f8f9fa', '#f97316');
      
      doc.fontSize(12)
         .fillColor('#f97316')
         .text('PLATEBNÍ ÚDAJE', 60, yPos + 10);
      
      doc.fontSize(10)
         .fillColor('#333333')
         .text('Číslo účtu: 123456789/0100', 60, yPos + 30)
         .text('IBAN: CZ6508000000192000145399', 60, yPos + 45)
         .text(`Variabilní symbol: ${invoice.invoiceNumber}`, 300, yPos + 30)
         .text('Konstantní symbol: 0308', 300, yPos + 45);
      
      yPos += 100;
      
      // Notes
      if (invoice.notes) {
        doc.rect(50, yPos, 495, 60)
           .fillAndStroke('#fffbeb', '#fbbf24');
        
        doc.fontSize(12)
           .fillColor('#92400e')
           .text('POZNÁMKY', 60, yPos + 10);
        
        doc.fontSize(10)
           .fillColor('#333333')
           .text(invoice.notes, 60, yPos + 30, { width: 475, height: 40 });
        
        yPos += 80;
      }
      
      // Footer
      yPos = doc.page.height - 100;
      
      doc.moveTo(50, yPos)
         .lineTo(545, yPos)
         .strokeColor('#ddd')
         .stroke();
      
      doc.fontSize(8)
         .fillColor('#666666')
         .text('FakturaAI s.r.o. | Václavské náměstí 1, 110 00 Praha 1 | IČO: 12345678 | DIČ: CZ12345678', 50, yPos + 10, { align: 'center' })
         .text('www.fakturaai.cz | info@fakturaai.cz | +420 123 456 789', 50, yPos + 25, { align: 'center' });
      
      doc.end();
      
    } catch (error) {
      console.error('PDFKit failed:', error);
      reject(error);
    }
  });
}