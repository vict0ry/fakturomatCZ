import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
let authToken = null;

// Helper pro autentifikaci
async function authenticate() {
  try {
    // Vytvoření testovacího uživatele
    const username = `testuser${Date.now()}`;
    const email = `${username}@example.com`;
    
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: {
          name: `Test Company ${Date.now()}`,
          ico: '12345678',
          address: 'Test Street 123',
          city: 'Prague',
          postalCode: '10000'
        },
        user: {
          username,
          email,
          password: 'testpassword123',
          firstName: 'Test',
          lastName: 'User'
        }
      })
    });

    if (!registerResponse.ok) {
      console.log('Register failed, trying login...');
    }

    // Přihlášení
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password: 'testpassword123'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('Login data:', loginData);
      authToken = loginData.sessionId;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Auth error:', error);
    return false;
  }
}

// Test vytvoření nákladu přes AI
async function testCreateExpenseViaAI() {
  console.log('\n🧪 Test: Vytvoření nákladu přes AI');
  
  const response = await fetch(`${BASE_URL}/api/chat/universal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      message: 'vytvor naklad: Dodavatel XYZ s.r.o., kategorie office, popis Office Supplies nakup, castka 6050kc, cislo N20258539',
      context: {},
      currentPath: '/expenses',
      chatHistory: [],
      attachments: []
    })
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ AI odpověď:', data.content);
    
    // Extrahovat číslo nákladu
    const expenseMatch = data.content.match(/N\d+/);
    if (expenseMatch) {
      const expenseNumber = expenseMatch[0];
      console.log(`📋 Číslo nákladu: ${expenseNumber}`);
      return expenseNumber;
    }
  } else {
    const errorData = await response.text();
    console.log('❌ Chyba při vytváření nákladu:', errorData);
  }
  
  return null;
}

// Test ověření nákladu v databázi
async function testVerifyExpenseInDatabase(expenseNumber) {
  console.log('\n🔍 Test: Ověření nákladu v databázi');
  
  const response = await fetch(`${BASE_URL}/api/expenses`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (response.ok) {
    const expenses = await response.json();
    console.log(`📊 Počet nákladů v databázi: ${expenses.length}`);
    
    if (expenseNumber) {
      const expense = expenses.find(exp => exp.expenseNumber === expenseNumber);
      if (expense) {
        console.log('✅ Náklad nalezen v databázi');
        console.log(`   ID: ${expense.id}, Číslo: ${expense.expenseNumber}`);
        console.log(`   Dodavatel: ${expense.supplierName || 'N/A'}`);
        console.log(`   Kategorie: ${expense.category}`);
        console.log(`   Částka: ${expense.total}`);
        return true;
      } else {
        console.log('❌ Náklad nenalezen v databázi');
        console.log('📋 Dostupné náklady:');
        expenses.forEach(exp => {
          console.log(`   - ${exp.expenseNumber}: ${exp.description}`);
        });
      }
    }
  } else {
    console.log('❌ Chyba při načítání nákladů:', await response.text());
  }
  
  return false;
}

// Test úprav nákladu
async function testExpenseUpdates(expenseNumber) {
  console.log('\n🔄 Test: Úpravy nákladu');
  
  const updates = [
    {
      name: 'Změna statusu na Schváleno',
      data: { status: 'approved' }
    },
    {
      name: 'Přidání poznámky',
      data: { notes: 'Test poznámka k nákladu' }
    }
  ];
  
  let allSuccessful = true;
  
  for (const update of updates) {
    console.log(`   → ${update.name}`);
    
    const response = await fetch(`${BASE_URL}/api/expenses/${expenseNumber}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(update.data)
    });
    
    if (response.ok) {
      console.log(`     ✅ ${update.name} - úspěch`);
    } else {
      console.log(`     ❌ ${update.name} - chyba:`, await response.text());
      allSuccessful = false;
    }
  }
  
  return allSuccessful;
}

// Hlavní test workflow
async function testCompleteExpenseWorkflow() {
  console.log('🧪 Kompletní test expense workflow');
  console.log('===================================');
  
  // Autentifikace
  console.log('\n🔑 Autentifikace...');
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('❌ Autentifikace selhala');
    return;
  }
  console.log('✅ Autentifikace úspěšná');
  
  // 1. Vytvoření nákladu přes AI
  const expenseNumber = await testCreateExpenseViaAI();
  if (!expenseNumber) {
    console.log('❌ Test ukončen - náklad nebyl vytvořen');
    return;
  }
  
  // 2. Ověření nákladu v databázi
  const expenseVerified = await testVerifyExpenseInDatabase(expenseNumber);
  
  // 3. Test úprav nákladu
  const updatesSuccess = await testExpenseUpdates(expenseNumber);
  
  // Výsledky
  console.log('\n📊 Výsledky testů:');
  console.log('==================');
  console.log(`✅ Vytvoření nákladu: ${expenseNumber ? 'ÚSPĚCH' : 'SELHALO'}`);
  console.log(`✅ Ověření v databázi: ${expenseVerified ? 'ÚSPĚCH' : 'SELHALO'}`);
  console.log(`✅ Úpravy nákladu: ${updatesSuccess ? 'ÚSPĚCH' : 'SELHALO'}`);
  
  const totalTests = 3;
  const passedTests = [expenseNumber, expenseVerified, updatesSuccess].filter(Boolean).length;
  
  console.log(`\n📈 Celkový výsledek: ${passedTests}/${totalTests} testů prošlo`);
  if (passedTests === totalTests) {
    console.log('🎉 Všechny testy prošly!');
  } else {
    console.log('⚠️  Některé testy selhaly - je třeba oprava');
  }
}

// Spuštění testů
testCompleteExpenseWorkflow().catch(console.error);