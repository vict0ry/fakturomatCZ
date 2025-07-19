// Test PDF generation with real data
import { generateInvoicePDF } from './server/services/pdf-new.js';

const testInvoice = {
  id: 1,
  invoiceNumber: "FAK-2025-001",
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  subtotal: "300.00",
  vatAmount: "63.00", 
  total: "363.00",
  currency: "CZK",
  notes: "Test invoice",
  paymentMethod: "bank_transfer",
  bankAccount: "123456789/0100",
  variableSymbol: "202500001",
  customer: {
    id: 1,
    name: "Test Company s.r.o.",
    address: "Test Street 123",
    city: "Praha",
    postalCode: "110 00",
    ico: "12345678",
    dic: "CZ12345678"
  },
  items: [
    {
      id: 1,
      description: "produkt 1",
      quantity: "1.00",
      unitPrice: "300.00",
      vatRate: "21",
      total: "363.00"
    }
  ]
};

async function testPDF() {
  try {
    console.log('Testing PDF generation...');
    const buffer = await generateInvoicePDF(testInvoice);
    console.log('PDF generated successfully, size:', buffer.length, 'bytes');
    
    // Save test PDF to check if it works
    const fs = require('fs');
    fs.writeFileSync('./test_invoice_generated.pdf', buffer);
    console.log('Test PDF saved as test_invoice_generated.pdf');
    
    if (buffer.length < 5000) {
      console.error('WARNING: PDF is too small, likely corrupted');
    } else {
      console.log('PDF generation appears successful');
    }
    
  } catch (error) {
    console.error('PDF generation failed:', error);
  }
}

testPDF();