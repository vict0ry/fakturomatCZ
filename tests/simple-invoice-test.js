// Zjednodušený test pro problém s poznámkami
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
let authToken = '';

async function authenticate() {
  const testUsername = 'testuser' + Date.now();
  
  // Registrace
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
        username: testUsername,
        password: 'testpass123',
        email: testUsername + '@example.com'
      }
    })
  });
  
  // Přihlášení
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
    authToken = loginData.sessionId;
    console.log('✅ Autentifikace úspěšná');
    return true;
  }
  return false;
}

async function testInvoiceCreationAndNotes() {
  console.log('🧪 Test poznámek ve faktuře');
  console.log('============================');
  
  if (!await authenticate()) {
    console.log('❌ Autentifikace selhala');
    return;
  }
  
  // 1. Vytvořit fakturu přes AI
  console.log('\n📝 Vytváření faktury přes AI...');
  const createResponse = await fetch(`${BASE_URL}/api/chat/universal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      message: 'vytvoř fakturu pro TestFirma, 1ks test product za 1000kc',
      context: {},
      currentPath: '/dashboard',
      chatHistory: [],
      attachments: []
    })
  });
  
  if (createResponse.ok) {
    const createData = await createResponse.json();
    console.log('✅ AI odpověď:', createData.content.substring(0, 100) + '...');
    
    // Extrahovat číslo faktury
    const match = createData.content.match(/(\d{8})/);
    if (match) {
      const invoiceNumber = match[1];
      console.log(`📋 Číslo faktury: ${invoiceNumber}`);
      
      // 2. Ověřit fakturu v databázi
      console.log('\n🔍 Kontrola faktury v databázi...');
      const invoicesResponse = await fetch(`${BASE_URL}/api/invoices`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (invoicesResponse.ok) {
        const invoices = await invoicesResponse.json();
        console.log(`📊 Počet faktur v databázi: ${invoices.length}`);
      
      // Debug - zkusíme najít fakturu bez filtru
      console.log('\n🔧 Debug - kontrola bez filtru...');
      const debugResponse = await fetch(`${BASE_URL}/api/invoices/debug`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('Debug data:', debugData);
      }
        
        const invoice = invoices.find(inv => inv.invoiceNumber === invoiceNumber);
        if (invoice) {
          console.log('✅ Faktura nalezena v databázi');
          console.log(`   ID: ${invoice.id}, Číslo: ${invoice.invoiceNumber}`);
          console.log(`   Částka: ${invoice.total}`);
          console.log(`   Poznámky: "${invoice.notes || 'žádné'}"`);
          
          // 3. Přidat poznámku přes AI
          console.log('\n📝 Přidávání poznámky přes AI...');
          const noteResponse = await fetch(`${BASE_URL}/api/chat/universal`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              message: `přidej do faktury ${invoiceNumber} poznámku: hello world test`,
              context: {},
              currentPath: '/invoices',
              chatHistory: [],
              attachments: []
            })
          });
          
          if (noteResponse.ok) {
            const noteData = await noteResponse.json();
            console.log('✅ AI odpověď na poznámku:', noteData.content.substring(0, 100) + '...');
            
            // 4. Ověřit poznámku v databázi
            console.log('\n🔍 Kontrola poznámky v databázi...');
            const updatedInvoicesResponse = await fetch(`${BASE_URL}/api/invoices`, {
              headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (updatedInvoicesResponse.ok) {
              const updatedInvoices = await updatedInvoicesResponse.json();
              const updatedInvoice = updatedInvoices.find(inv => inv.invoiceNumber === invoiceNumber);
              
              if (updatedInvoice) {
                console.log(`📋 Aktualizovaná faktura:`);
                console.log(`   Poznámky: "${updatedInvoice.notes || 'žádné'}"`);
                
                if (updatedInvoice.notes && updatedInvoice.notes.includes('hello world')) {
                  console.log('✅ Poznámka úspěšně přidána!');
                } else {
                  console.log('❌ Poznámka se nepřidala');
                }
                
                // 5. Test PDF generace
                console.log('\n📄 Test PDF generace...');
                const pdfResponse = await fetch(`${BASE_URL}/api/invoices/${invoiceNumber}/pdf`, {
                  headers: { 'Authorization': `Bearer ${authToken}` }
                });
                
                if (pdfResponse.ok) {
                  console.log('✅ PDF generace úspěšná');
                } else {
                  console.log('❌ PDF generace selhala:', await pdfResponse.text());
                }
              }
            }
          } else {
            console.log('❌ Chyba při přidávání poznámky přes AI');
          }
        } else {
          console.log('❌ Faktura nenalezena v databázi');
        }
      } else {
        console.log('❌ Chyba při načítání faktur');
      }
    } else {
      console.log('❌ Číslo faktury nenalezeno v odpovědi AI');
    }
  } else {
    console.log('❌ Chyba při vytváření faktury přes AI');
  }
}

testInvoiceCreationAndNotes().catch(console.error);