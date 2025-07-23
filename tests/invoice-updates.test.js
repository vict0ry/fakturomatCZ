// Test pro všechny možné úpravy faktur + PDF generaci
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
let authCookies = '';

// Helper funkce pro autentifikaci
async function authenticate() {
  const testUsername = 'testuser' + Date.now();
  
  // Nejprve zkusit registraci testovacího uživatele
  const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
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
        username: testUsername,
        password: 'testpass123',
        email: testUsername + '@example.com'
      }
    })
  });
  
  // Pak přihlášení
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      password: 'testpass123'
    })
  });
  
  if (response.ok) {
    const loginData = await response.json();
    console.log('Login data:', loginData);
    
    // Pokud server vrací sessionId, použijeme ho jako Bearer token
    if (loginData.sessionId) {
      authCookies = loginData.sessionId;
    } else if (response.headers.get('set-cookie')) {
      authCookies = response.headers.get('set-cookie');
    }
  }
  
  return response.ok;
}

// Helper pro API requesty s autentifikací
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authCookies}`,
      ...options.headers
    }
  });
  
  let data;
  try {
    const responseText = await response.text();
    if (responseText) {
      data = JSON.parse(responseText);
    } else {
      data = {};
    }
  } catch (error) {
    data = { error: 'Failed to parse response', responseStatus: response.status };
  }
  return { response, data };
}

// Test vytvoření faktury přes AI
async function testCreateInvoiceViaAI() {
  console.log('\n🤖 Test: Vytvoření faktury přes AI');
  
  const { response, data } = await apiRequest('/api/chat/universal', {
    method: 'POST',
    body: JSON.stringify({
      message: 'vytvor fakturu firme cannaspace, chci prodavat 1kg kvetu za 30000kc',
      context: {},
      currentPath: '/dashboard',
      chatHistory: [],
      attachments: []
    })
  });
  
  if (response.ok) {
    console.log('✅ AI vytvořila fakturu');
    console.log(`   Odpověď: ${data.content.substring(0, 100)}...`);
    
    // Extrahovat číslo faktury z odpovědi
    const invoiceMatch = data.content.match(/(\d{8})/);
    if (invoiceMatch) {
      const invoiceNumber = invoiceMatch[1];
      console.log(`   Číslo faktury: ${invoiceNumber}`);
      return invoiceNumber;
    }
  } else {
    console.log('❌ Chyba při vytváření faktury přes AI:', data);
  }
  
  return null;
}

// Test přidání poznámky přes AI
async function testAddNoteViaAI(invoiceNumber) {
  console.log('\n📝 Test: Přidání poznámky přes AI');
  
  const { response, data } = await apiRequest('/api/chat/universal', {
    method: 'POST',
    body: JSON.stringify({
      message: `přidej do faktury ${invoiceNumber} poznámku: hello world`,
      context: {},
      currentPath: '/invoices',
      chatHistory: [],
      attachments: []
    })
  });
  
  if (response.ok) {
    console.log('✅ AI přidala poznámku');
    console.log(`   Odpověď: ${data.content.substring(0, 100)}...`);
    return true;
  } else {
    console.log('❌ Chyba při přidávání poznámky:', data);
    return false;
  }
}

// Test ověření poznámky v databázi
async function testVerifyNoteInDatabase(invoiceNumber) {
  console.log('\n🔍 Test: Ověření poznámky v databázi');
  
  const { response, data } = await apiRequest('/api/invoices');
  
  if (response.ok) {
    console.log(`   Načteno ${data.length} faktur z databáze`);
    console.log(`   Hledám fakturu: ${invoiceNumber}`);
    
    const invoice = data.find(inv => inv.invoiceNumber === invoiceNumber || inv.invoiceNumber === parseInt(invoiceNumber));
    if (invoice) {
      console.log(`   ✅ Faktura nalezena: ${invoice.invoiceNumber}`);
      console.log(`   Poznámky: "${invoice.notes || 'žádné'}"`);
      console.log(`   Status: ${invoice.status}`);
      console.log(`   Částka: ${invoice.total}`);
      
      if (invoice.notes && invoice.notes.includes('hello world')) {
        console.log('✅ Poznámka správně uložena v databázi');
        return true;
      } else {
        console.log('❌ Poznámka chybí v databázi');
        // Pokusím se najít fakturu jinak
        console.log('   📋 Dostupné faktury:');
        data.forEach(inv => {
          console.log(`     - ${inv.invoiceNumber}: "${inv.notes || 'bez poznámky'}"`);
        });
        return false;
      }
    } else {
      console.log('❌ Faktura nenalezena v seznamu');
      console.log('   📋 Dostupné faktury:');
      data.forEach(inv => {
        console.log(`     - ${inv.invoiceNumber}: "${inv.notes || 'bez poznámky'}"`);
      });
      return false;
    }
  } else {
    console.log('❌ Chyba při načítání faktur:', data);
    return false;
  }
}

// Test všech možných úprav faktury
async function testAllInvoiceUpdates(invoiceNumber) {
  console.log('\n🔄 Test: Všechny možné úpravy faktury');
  
  const updates = [
    {
      name: 'Změna statusu na Odesláno',
      data: { status: 'sent' }
    },
    {
      name: 'Přidání data splatnosti',
      data: { dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
    },
    {
      name: 'Změna poznámek',
      data: { notes: 'Aktualizovaná poznámka přes API test' }
    },
    {
      name: 'Změna statusu na Zaplaceno',
      data: { status: 'paid', paidDate: new Date().toISOString() }
    }
  ];
  
  let allSuccessful = true;
  
  for (const update of updates) {
    console.log(`   → ${update.name}`);
    
    const { response, data } = await apiRequest(`/api/invoices/${invoiceNumber}`, {
      method: 'PATCH',
      body: JSON.stringify(update.data)
    });
    
    if (response.ok) {
      console.log(`     ✅ ${update.name} - úspěch`);
    } else {
      console.log(`     ❌ ${update.name} - chyba:`, data);
      allSuccessful = false;
    }
  }
  
  return allSuccessful;
}

// Test PDF generace
async function testPDFGeneration(invoiceNumber) {
  console.log('\n📄 Test: PDF generace');
  
  const response = await fetch(`${BASE_URL}/api/invoices/${invoiceNumber}/pdf`, {
    headers: { 'Authorization': `Bearer ${authCookies}` }
  });
  
  if (response.ok) {
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    console.log('✅ PDF endpoint odpovídá');
    console.log(`   Content-Type: ${contentType}`);
    console.log(`   Velikost: ${contentLength || 'neznámá'} bytes`);
    
    if (contentType === 'application/pdf') {
      console.log('✅ PDF má správný Content-Type');
      
      // Ověřit že PDF obsahuje data
      const buffer = await response.buffer();
      const isValidPDF = buffer.toString('ascii', 0, 4) === '%PDF';
      
      if (isValidPDF) {
        console.log('✅ PDF má správnou hlavičku');
        console.log(`   Velikost souboru: ${buffer.length} bytes`);
        
        // Uložit pro kontrolu
        const fs = await import('fs');
        fs.writeFileSync(`test_invoice_${invoiceNumber}.pdf`, buffer);
        console.log(`   PDF uloženo jako: test_invoice_${invoiceNumber}.pdf`);
        
        return true;
      } else {
        console.log('❌ PDF má neplatnou hlavičku');
        return false;
      }
    } else if (contentType?.includes('text/html')) {
      console.log('✅ PDF endpoint funguje (HTML fallback)');
      return true;
    } else {
      console.log('❌ PDF má neočekávaný Content-Type');
      return false;
    }
  } else {
    const errorText = await response.text();
    console.log('❌ Chyba při generování PDF:', errorText);
    return false;
  }
}

// Test kompletní workflow
async function testCompleteInvoiceWorkflow() {
  console.log('🧪 Kompletní test invoice workflow');
  console.log('===================================');
  
  // Autentifikace
  console.log('\n🔑 Autentifikace...');
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('❌ Autentifikace selhala');
    return;
  }
  console.log('✅ Autentifikace úspěšná');
  
  // 1. Vytvoření faktury přes AI
  const invoiceNumber = await testCreateInvoiceViaAI();
  if (!invoiceNumber) {
    console.log('❌ Test ukončen - faktura nebyla vytvořena');
    return;
  }
  
  // 2. Přidání poznámky přes AI
  const noteAdded = await testAddNoteViaAI(invoiceNumber);
  
  // 3. Ověření poznámky v databázi
  const noteVerified = await testVerifyNoteInDatabase(invoiceNumber);
  
  // 4. Test všech úprav
  const allUpdatesSuccess = await testAllInvoiceUpdates(invoiceNumber);
  
  // 5. Test PDF generace
  const pdfSuccess = await testPDFGeneration(invoiceNumber);
  
  // Výsledky
  console.log('\n📊 Výsledky testů:');
  console.log('==================');
  console.log(`✅ Vytvoření faktury: ${invoiceNumber ? 'ÚSPĚCH' : 'SELHALO'}`);
  console.log(`${noteAdded ? '✅' : '❌'} Přidání poznámky přes AI: ${noteAdded ? 'ÚSPĚCH' : 'SELHALO'}`);
  console.log(`${noteVerified ? '✅' : '❌'} Ověření poznámky v DB: ${noteVerified ? 'ÚSPĚCH' : 'SELHALO'}`);
  console.log(`${allUpdatesSuccess ? '✅' : '❌'} Všechny úpravy faktury: ${allUpdatesSuccess ? 'ÚSPĚCH' : 'SELHALO'}`);
  console.log(`${pdfSuccess ? '✅' : '❌'} PDF generace: ${pdfSuccess ? 'ÚSPĚCH' : 'SELHALO'}`);
  
  const totalTests = 5;
  const passedTests = [invoiceNumber, noteAdded, noteVerified, allUpdatesSuccess, pdfSuccess].filter(Boolean).length;
  
  console.log(`\n📈 Celkový výsledek: ${passedTests}/${totalTests} testů prošlo`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Všechny testy prošly!');
  } else {
    console.log('⚠️  Některé testy selhaly - je třeba oprava');
  }
}

// Spuštění testů
testCompleteInvoiceWorkflow().catch(console.error);