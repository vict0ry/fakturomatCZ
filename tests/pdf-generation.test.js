// Specializovaný test pro PDF generaci
import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';
let authCookies = '';

async function authenticate() {
  // Nejprve zkusit registraci testovacího uživatele
  await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company: {
        name: 'Test Company',
        ico: '12345678',
        dic: 'CZ12345678',
        address: 'Test Address 123',
        city: 'Prague',
        postalCode: '11000',
        country: 'Czech Republic'
      },
      user: {
        username: 'testuser',
        password: 'testpass123',
        email: 'test@example.com'
      }
    })
  });
  
  // Pak přihlášení
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'testuser',
      password: 'testpass123'
    })
  });
  
  if (response.headers.get('set-cookie')) {
    authCookies = response.headers.get('set-cookie');
  }
  
  return response.ok;
}

async function testPDFGeneration() {
  console.log('🧪 Test PDF generace');
  console.log('====================');
  
  // Autentifikace
  console.log('\n🔑 Autentifikace...');
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('❌ Autentifikace selhala');
    return;
  }
  console.log('✅ Autentifikace úspěšná');
  
  // Získat seznam faktur
  console.log('\n📋 Načítání faktur...');
  const invoicesResponse = await fetch(`${BASE_URL}/api/invoices`, {
    headers: { 'Cookie': authCookies }
  });
  
  if (!invoicesResponse.ok) {
    console.log('❌ Nelze načíst faktury');
    return;
  }
  
  const invoices = await invoicesResponse.json();
  console.log(`✅ Načteno ${invoices.length} faktur`);
  
  if (invoices.length === 0) {
    console.log('ℹ️  Žádné faktury k testování PDF');
    return;
  }
  
  // Test každé faktury
  for (const invoice of invoices) {
    console.log(`\n📄 Test PDF pro fakturu: ${invoice.invoiceNumber}`);
    
    try {
      const pdfResponse = await fetch(`${BASE_URL}/api/invoices/${invoice.invoiceNumber}/pdf`, {
        headers: { 'Cookie': authCookies }
      });
      
      console.log(`   Status: ${pdfResponse.status} ${pdfResponse.statusText}`);
      console.log(`   Content-Type: ${pdfResponse.headers.get('content-type')}`);
      console.log(`   Content-Length: ${pdfResponse.headers.get('content-length')} bytes`);
      
      if (pdfResponse.ok) {
        const buffer = await pdfResponse.buffer();
        
        // Kontrola PDF hlavičky
        const header = buffer.toString('ascii', 0, 4);
        const isValidPDF = header === '%PDF';
        
        console.log(`   PDF hlavička: ${header} ${isValidPDF ? '✅' : '❌'}`);
        console.log(`   Skutečná velikost: ${buffer.length} bytes`);
        
        if (isValidPDF && buffer.length > 1000) {
          // Uložit PDF pro manuální kontrolu
          const filename = `test_pdf_${invoice.invoiceNumber}_${Date.now()}.pdf`;
          fs.writeFileSync(filename, buffer);
          console.log(`   ✅ PDF uloženo jako: ${filename}`);
          
          // Dodatečné kontroly obsahu
          const pdfContent = buffer.toString('binary');
          const hasText = pdfContent.includes(invoice.invoiceNumber);
          const hasAmount = pdfContent.includes(invoice.totalAmount.toString());
          
          console.log(`   Obsahuje číslo faktury: ${hasText ? '✅' : '❌'}`);
          console.log(`   Obsahuje částku: ${hasAmount ? '✅' : '❌'}`);
          
        } else {
          console.log(`   ❌ PDF je příliš malé nebo neplatné`);
        }
        
      } else {
        const errorText = await pdfResponse.text();
        console.log(`   ❌ Chyba: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
  }
  
  console.log('\n📊 Test PDF generace dokončen');
}

// Spuštění testu
testPDFGeneration().catch(console.error);