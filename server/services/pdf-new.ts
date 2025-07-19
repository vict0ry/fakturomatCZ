import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { Invoice, Customer, InvoiceItem } from "@shared/schema";

export async function generateInvoicePDF(
  invoice: Invoice & { customer: Customer; items: InvoiceItem[] }
): Promise<Buffer> {
  console.log('Generuji PDF pro fakturu:', invoice.invoiceNumber);
  
  // Create jsPDF instance - handle different import formats
  let doc;
  try {
    // Try new jsPDF() first
    doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
  } catch (error) {
    // Fallback for different module format
    const jsPDFConstructor = jsPDF.default || jsPDF;
    doc = new jsPDFConstructor({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
  }
  
  // Nastavenie písma
  doc.setFont('helvetica');
  
  // Hlavička
  doc.setFontSize(24);
  doc.setTextColor(0, 102, 204);
  doc.text('FAKTURA', 20, 30);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Číslo: ${invoice.invoiceNumber}`, 20, 40);
  
  // Dodavateľ
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Dodavatel:', 20, 60);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('FakturaAI s.r.o.', 20, 70);
  doc.text('Václavské náměstí 1', 20, 75);
  doc.text('110 00 Praha 1', 20, 80);
  doc.text('IČO: 12345678', 20, 85);
  doc.text('DIČ: CZ12345678', 20, 90);
  doc.text('Tel: +420 123 456 789', 20, 95);
  doc.text('Email: info@fakturaai.cz', 20, 100);
  
  // Odberateľ
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Odběratel:', 110, 60);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = 70;
  doc.text(invoice.customer.name, 110, yPos);
  if (invoice.customer.address) {
    yPos += 5;
    doc.text(invoice.customer.address, 110, yPos);
  }
  if (invoice.customer.city && invoice.customer.postalCode) {
    yPos += 5;
    doc.text(`${invoice.customer.postalCode} ${invoice.customer.city}`, 110, yPos);
  }
  if (invoice.customer.ico) {
    yPos += 5;
    doc.text(`IČO: ${invoice.customer.ico}`, 110, yPos);
  }
  if (invoice.customer.dic) {
    yPos += 5;
    doc.text(`DIČ: ${invoice.customer.dic}`, 110, yPos);
  }
  
  // Dátumy a platobné info
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('cs-CZ');
  };
  
  doc.setFontSize(10);
  yPos = 120;
  doc.text(`Datum vystavení: ${formatDate(invoice.issueDate)}`, 20, yPos);
  doc.text(`Datum splatnosti: ${formatDate(invoice.dueDate)}`, 20, yPos + 5);
  doc.text(`Způsob platby: ${getPaymentMethodLabel((invoice as any).paymentMethod)}`, 20, yPos + 10);
  doc.text(`Měna: ${invoice.currency || 'CZK'}`, 20, yPos + 15);
  
  // Tabuľka položiek
  const startY = yPos + 30;
  
  // Hlavička tabuľky
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(0, 102, 204);
  doc.setTextColor(255, 255, 255);
  doc.rect(20, startY, 170, 8, 'F');
  
  doc.text('Popis', 22, startY + 5);
  doc.text('Množství', 80, startY + 5);
  doc.text('Cena/ks', 105, startY + 5);
  doc.text('DPH %', 130, startY + 5);
  doc.text('Celkem', 155, startY + 5);
  
  // Položky
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  let itemY = startY + 15;
  
  invoice.items.forEach((item, index) => {
    const total = (parseFloat(item.quantity) * parseFloat(item.unitPrice)).toFixed(2);
    
    doc.text(item.description.substring(0, 25), 22, itemY);
    doc.text(item.quantity, 80, itemY);
    doc.text(`${item.unitPrice} Kč`, 105, itemY);
    doc.text(`${item.vatRate}%`, 130, itemY);
    doc.text(`${total} Kč`, 155, itemY);
    
    itemY += 8;
    
    // Čiara pod položkou
    doc.setDrawColor(200, 200, 200);
    doc.line(20, itemY - 2, 190, itemY - 2);
  });
  
  // Súčty
  const summaryY = itemY + 10;
  doc.setFont('helvetica', 'bold');
  
  doc.text(`Základ DPH: ${invoice.subtotal} Kč`, 130, summaryY);
  doc.text(`DPH 21%: ${invoice.vatAmount} Kč`, 130, summaryY + 5);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 102, 204);
  doc.text(`CELKEM: ${invoice.total} Kč`, 130, summaryY + 15);
  
  // Platobné údaje
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  const paymentY = summaryY + 30;
  doc.text('Platební údaje:', 20, paymentY);
  
  doc.setFont('helvetica', 'normal');
  const paymentMethod = (invoice as any).paymentMethod;
  
  if (paymentMethod === 'bank_transfer' || !paymentMethod) {
    doc.text(`Číslo účtu: ${(invoice as any).bankAccount || '123456789/0100'}`, 20, paymentY + 8);
    doc.text(`IBAN: CZ6508000000192000145399`, 20, paymentY + 13);
    doc.text(`Variabilní symbol: ${(invoice as any).variableSymbol || invoice.invoiceNumber}`, 20, paymentY + 18);
    
    if ((invoice as any).constantSymbol) {
      doc.text(`Konstantní symbol: ${(invoice as any).constantSymbol}`, 20, paymentY + 23);
    }
    
    if ((invoice as any).specificSymbol) {
      doc.text(`Specifický symbol: ${(invoice as any).specificSymbol}`, 20, paymentY + 28);
    }
    
    // QR kód pre platbu
    try {
      const qrData = generateQRPaymentData(invoice);
      const qrCodeDataURL = await QRCode.toDataURL(qrData);
      
      // Pridanie QR kódu do PDF
      doc.addImage(qrCodeDataURL, 'PNG', 140, paymentY + 5, 30, 30);
      doc.setFontSize(8);
      doc.text('QR kód pro platbu', 140, paymentY + 40);
    } catch (error) {
      console.error('Chyba pri generovaní QR kódu:', error);
    }
  }
  
  // Poznámky
  if (invoice.notes) {
    const notesY = paymentY + 50;
    doc.setFont('helvetica', 'bold');
    doc.text('Poznámky:', 20, notesY);
    doc.setFont('helvetica', 'normal');
    
    const splitNotes = doc.splitTextToSize(invoice.notes, 170);
    doc.text(splitNotes, 20, notesY + 8);
  }
  
  // Pätka
  const footerY = 280;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('FakturaAI s.r.o. | Václavské náměstí 1, 110 00 Praha 1 | IČO: 12345678 | DIČ: CZ12345678', 20, footerY);
  doc.text('www.fakturaai.cz | info@fakturaai.cz | +420 123 456 789', 20, footerY + 4);
  
  // Generujeme PDF ako Buffer
  const pdfData = doc.output('arraybuffer');
  const buffer = Buffer.from(pdfData);
  
  console.log('PDF vygenerované, veľkosť:', buffer.length, 'bytov');
  
  if (buffer.length < 1000) {
    throw new Error(`PDF je príliš malé: ${buffer.length} bytov`);
  }
  
  return buffer;
}

function getPaymentMethodLabel(method: string | null) {
  const methods = {
    bank_transfer: "Bankovní převod",
    card: "Platební karta", 
    cash: "Hotovost",
    online: "Online platba",
    cheque: "Šek"
  };
  return methods[method as keyof typeof methods] || "Bankovní převod";
}

function generateQRPaymentData(invoice: Invoice & { customer: Customer }) {
  // Formát pre české QR platby (Short Payment Descriptor)
  const accountNumber = (invoice as any).bankAccount || '123456789/0100';
  const amount = invoice.total;
  const variableSymbol = (invoice as any).variableSymbol || invoice.invoiceNumber;
  const message = `Faktura ${invoice.invoiceNumber}`;
  
  // SPD formát pre QR platbu
  return `SPD*1.0*ACC:${accountNumber}*AM:${amount}*CC:CZK*MSG:${message}*X-VS:${variableSymbol}`;
}