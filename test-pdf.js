// Test script pre overenie funkčnosti PDF generátora
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import PDF generátora
async function testPDF() {
  try {
    // Import s ES modulmi
    const { generateInvoicePDF } = await import('./server/services/pdf-new.ts');
    
    // Testovacia faktúra
    const testInvoice = {
      id: 999,
      invoiceNumber: "TEST-2025-001",
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: "1000.00",
      vatAmount: "210.00", 
      total: "1210.00",
      currency: "CZK",
      paymentMethod: "bank_transfer",
      bankAccount: "123456789/0100",
      variableSymbol: "TEST001",
      constantSymbol: "0308",
      customer: {
        id: 1,
        name: "Test Zákazník s.r.o.",
        address: "Testovacia 123",
        city: "Praha",
        postalCode: "10000",
        ico: "87654321",
        dic: "CZ87654321",
        email: "test@example.com"
      },
      items: [
        {
          id: 1,
          description: "Testovacia služba",
          quantity: "1",
          unitPrice: "1000.00",
          vatRate: "21",
          total: "1000.00"
        }
      ]
    };

    console.log('Spúšťam test PDF generátora...');
    
    const pdfBuffer = await generateInvoicePDF(testInvoice);
    
    console.log('PDF vygenerované úspešne!');
    console.log('Veľkosť PDF:', pdfBuffer.length, 'bytov');
    
    // Uložíme testovací PDF
    const testFilePath = path.join(__dirname, 'test-invoice.pdf');
    fs.writeFileSync(testFilePath, pdfBuffer);
    
    console.log('Test PDF uložené do:', testFilePath);
    
    // Overíme veľkosť súboru
    const stats = fs.statSync(testFilePath);
    console.log('Veľkosť súboru na disku:', stats.size, 'bytov');
    
    if (stats.size < 1000) {
      throw new Error('PDF súbor je príliš malý!');
    }
    
    console.log('✅ PDF test úspešný!');
    return true;
    
  } catch (error) {
    console.error('❌ PDF test neúspešný:', error.message);
    console.error('Detaily chyby:', error);
    return false;
  }
}

// Spustíme test
testPDF().then(success => {
  process.exit(success ? 0 : 1);
});