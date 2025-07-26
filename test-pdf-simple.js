import { generateInvoicePDF } from './server/services/pdf.js';
import fs from 'fs';

// Create test invoice data
const testInvoice = {
  id: 1,
  invoiceNumber: 'F2025001',
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  subtotal: '1000',
  vatAmount: '210',
  total: '1210',
  currency: 'CZK',
  status: 'draft',
  notes: 'Test faktura pro kontrolu PDF generace',
  customer: {
    id: 1,
    name: 'Test zákazník s.r.o.',
    email: 'test@example.com',
    address: 'Testovací ulice 123',
    city: 'Praha',
    postalCode: '11000',
    ico: '12345678',
    dic: 'CZ12345678'
  },
  items: [
    {
      id: 1,
      description: 'Testovací služba',
      quantity: '1',
      unitPrice: '1000',
      vatRate: 21
    }
  ]
};

async function testPDF() {
  try {
    console.log('🔍 Testování PDF generace...');
    
    const pdfBuffer = await generateInvoicePDF(testInvoice);
    
    console.log('✅ PDF vygenerováno!');
    console.log('📦 Velikost:', pdfBuffer.length, 'bytů');
    
    // Uložíme testovací PDF
    fs.writeFileSync('test_simple_check.pdf', pdfBuffer);
    console.log('💾 PDF uloženo jako test_simple_check.pdf');
    
    // Zkontrolujeme začátek souboru
    const header = pdfBuffer.subarray(0, 10).toString();
    console.log('📄 PDF header:', header);
    
    if (header.startsWith('%PDF-')) {
      console.log('✅ PDF má správný formát');
    } else {
      console.log('❌ PDF má neplatný formát');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Chyba při generování PDF:', error);
    return false;
  }
}

testPDF().then(success => {
  if (success) {
    console.log('🎉 Test úspěšný!');
  } else {
    console.log('💥 Test neúspěšný');
  }
  process.exit(success ? 0 : 1);
});