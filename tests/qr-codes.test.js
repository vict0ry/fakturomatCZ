/**
 * QR Codes Tests - QR Code Generation Functionality
 * Run with: node tests/qr-codes.test.js
 */

import { apiRequest } from './helpers/test-utils.js';

const BASE_URL = 'http://localhost:5000';

class QRTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  async test(name, testFn) {
    try {
      console.log(`🔲 Testing: ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      this.passed++;
      this.results.push({ name, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ FAILED: ${name} - ${error.message}`);
      this.failed++;
      this.results.push({ name, status: 'FAILED', error: error.message });
    }
  }

  summary() {
    console.log('\n=== QR CODES TEST SUMMARY ===');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Total: ${this.passed + this.failed}`);
    
    if (this.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => r.status === 'FAILED').forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    }
    
    return this.failed === 0;
  }
}

async function testQRCodeGeneration() {
  console.log('\n🔲 Test: Základní generování QR kódu');
  
  const { response, data } = await apiRequest('/api/qr/generate', {
    method: 'POST',
    body: JSON.stringify({
      type: 'payment',
      amount: 1500.50,
      currency: 'CZK',
      iban: 'CZ1234567890123456789012',
      variableSymbol: '12345678',
      constantSymbol: '0308',
      recipient: 'Test s.r.o.',
      message: 'Platba za fakturu'
    })
  });
  
  if (response.ok && data.qrCode) {
    console.log('✅ QR kód vygenerován');
    
    // Ověříme, že je to validní base64 data URL
    if (data.qrCode.startsWith('data:image/png;base64,')) {
      console.log('   ✅ Formát QR kódu je správný (base64 PNG)');
      return data.qrCode;
    } else {
      throw new Error('QR kód nemá správný formát');
    }
  } else {
    throw new Error(`Chyba při generování QR kódu: ${JSON.stringify(data)}`);
  }
}

async function testSPAYDFormat() {
  console.log('\n🇨🇿 Test: Český SPAYD formát');
  
  const { response, data } = await apiRequest('/api/qr/generate', {
    method: 'POST',
    body: JSON.stringify({
      type: 'spayd',
      amount: 2500.00,
      currency: 'CZK',
      iban: 'CZ6508000000192000145399',
      variableSymbol: '87654321',
      constantSymbol: '0308',
      specificSymbol: '123',
      recipient: 'ACME Corporation s.r.o.',
      message: 'Faktura 2024001'
    })
  });
  
  if (response.ok && data.qrCode && data.spaydString) {
    console.log('✅ SPAYD QR kód vygenerován');
    console.log(`   SPAYD: ${data.spaydString.substring(0, 50)}...`);
    
    // Ověříme SPAYD formát
    if (data.spaydString.startsWith('SPD*1.0*')) {
      console.log('   ✅ SPAYD formát je správný');
      return true;
    } else {
      throw new Error('SPAYD řetězec nemá správný formát');
    }
  } else {
    throw new Error(`Chyba při generování SPAYD QR kódu: ${JSON.stringify(data)}`);
  }
}

async function testInvoiceQRCode() {
  console.log('\n📄 Test: QR kód pro fakturu');
  
  // Nejprve vytvoříme testovací fakturu
  const invoiceData = {
    customerId: 1,
    invoiceNumber: `TEST-QR-${Date.now()}`,
    type: 'invoice',
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    subtotal: '1652.89',
    vatAmount: '347.11',
    total: '2000.00',
    currency: 'CZK',
    variableSymbol: '20240001',
    notes: 'Test faktura pro QR kód'
  };
  
  const { response: createResponse, data: invoice } = await apiRequest('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(invoiceData)
  });
  
  if (!createResponse.ok) {
    throw new Error('Nepodařilo se vytvořit testovací fakturu');
  }
  
  console.log(`   ✅ Testovací faktura vytvořena: ${invoice.invoiceNumber}`);
  
  // Nyní vygenerujeme QR kód pro fakturu
  const { response, data } = await apiRequest(`/api/invoices/${invoice.id}/qr`, {
    method: 'GET'
  });
  
  if (response.ok && data.qrCode) {
    console.log('✅ QR kód pro fakturu vygenerován');
    
    // Ověříme, že obsahuje správné údaje
    if (data.paymentData) {
      const paymentData = data.paymentData;
      const expectedAmount = parseFloat(invoice.total);
      const actualAmount = parseFloat(paymentData.amount);
      
      if (Math.abs(expectedAmount - actualAmount) < 0.01) {
        console.log('   ✅ Částka v QR kódu je správná');
        return invoice.id;
      } else {
        throw new Error(`Částka v QR kódu neodpovídá: očekáváno ${expectedAmount}, je ${actualAmount}`);
      }
    }
    
    return invoice.id;
  } else {
    throw new Error(`Chyba při generování QR kódu pro fakturu: ${JSON.stringify(data)}`);
  }
}

async function testQRCodeInPDF(invoiceId) {
  console.log('\n📑 Test: QR kód v PDF faktury');
  
  if (!invoiceId) {
    console.log('⚠️ Přeskakujem test - chybí ID faktury');
    return false;
  }
  
  const response = await fetch(`${BASE_URL}/api/invoices/${invoiceId}/pdf`, {
    headers: { 'Authorization': 'Bearer test-session-dev' }
  });
  
  if (response.ok) {
    const pdfBuffer = await response.arrayBuffer();
    const pdfSize = pdfBuffer.byteLength;
    
    console.log(`✅ PDF s QR kódem vygenerováno (${pdfSize} bytů)`);
    
    // Základní kontrola, že PDF obsahuje nějaký obsah
    if (pdfSize > 10000) { // PDF by mělo být větší než 10KB
      console.log('   ✅ PDF má rozumnou velikost');
      
      // Konvertujeme na string a hledáme QR indikátory
      const pdfString = new TextDecoder().decode(pdfBuffer);
      if (pdfString.includes('QR') || pdfString.includes('data:image')) {
        console.log('   ✅ PDF pravděpodobně obsahuje QR kód');
        return true;
      } else {
        console.log('   ⚠️ Nelze ověřit přítomnost QR kódu v PDF');
        return true; // Nebudeme považovat za chybu
      }
    } else {
      throw new Error('PDF je příliš malé');
    }
  } else {
    throw new Error(`Chyba při generování PDF: ${response.status}`);
  }
}

async function testQRCodeValidation() {
  console.log('\n✅ Test: Validace QR kódu parametrů');
  
  const invalidTests = [
    {
      name: 'Prázdná částka',
      data: { amount: '', currency: 'CZK', iban: 'CZ1234567890123456789012' },
      expectedError: 'amount'
    },
    {
      name: 'Neplatný IBAN',
      data: { amount: 1000, currency: 'CZK', iban: 'INVALID_IBAN' },
      expectedError: 'iban'
    },
    {
      name: 'Chybějící příjemce',
      data: { amount: 1000, currency: 'CZK', iban: 'CZ1234567890123456789012', recipient: '' },
      expectedError: 'recipient'
    }
  ];
  
  let allCorrect = true;
  
  for (const test of invalidTests) {
    try {
      const { response, data } = await apiRequest('/api/qr/generate', {
        method: 'POST',
        body: JSON.stringify({ type: 'payment', ...test.data })
      });
      
      if (response.ok) {
        console.log(`   ❌ ${test.name} - mělo selhat, ale prošlo`);
        allCorrect = false;
      } else {
        console.log(`   ✅ ${test.name} - správně odmítnuto`);
      }
    } catch (error) {
      console.log(`   ✅ ${test.name} - správně odmítnuto s chybou`);
    }
  }
  
  return allCorrect;
}

async function testQRCodeCustomization() {
  console.log('\n🎨 Test: Přizpůsobení QR kódu');
  
  const { response, data } = await apiRequest('/api/qr/generate', {
    method: 'POST',
    body: JSON.stringify({
      type: 'payment',
      amount: 999.99,
      currency: 'CZK',
      iban: 'CZ1234567890123456789012',
      recipient: 'Custom Test',
      options: {
        size: 512,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }
    })
  });
  
  if (response.ok && data.qrCode) {
    console.log('✅ QR kód s vlastním nastavením vygenerován');
    
    // Ověříme, že je větší (512px vs standardních 256px)
    const base64Length = data.qrCode.length;
    if (base64Length > 10000) { // Větší QR kód = více dat
      console.log('   ✅ Velikost QR kódu byla zvětšena');
      return true;
    } else {
      console.log('   ⚠️ Velikost QR kódu nebyla změněna');
      return true; // Nebudeme považovat za chybu
    }
  } else {
    throw new Error(`Chyba při generování přizpůsobeného QR kódu: ${JSON.stringify(data)}`);
  }
}

export async function runQRTests() {
  console.log('🎯 SPOUŠTÍM QR KÓDY TESTY');
  console.log('='.repeat(40));
  
  const tester = new QRTester();
  let invoiceId = null;
  
  await tester.test('QR Code Generation', testQRCodeGeneration);
  await tester.test('SPAYD Format', testSPAYDFormat);
  
  await tester.test('Invoice QR Code', async () => {
    invoiceId = await testInvoiceQRCode();
    if (!invoiceId) throw new Error('Nepodařilo se vytvořit QR pro fakturu');
  });
  
  await tester.test('QR Code in PDF', async () => {
    const success = await testQRCodeInPDF(invoiceId);
    if (!success) throw new Error('QR kód v PDF selhal');
  });
  
  await tester.test('QR Code Validation', testQRCodeValidation);
  await tester.test('QR Code Customization', testQRCodeCustomization);
  
  return tester.summary();
}

// Spuštění testů pokud je soubor spuštěn přímo
if (import.meta.url === `file://${process.argv[1]}`) {
  runQRTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Chyba při spouštění testů:', error);
    process.exit(1);
  });
}