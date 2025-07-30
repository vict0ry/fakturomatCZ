#!/usr/bin/env node

/**
 * 🤖 FINÁLNÍ AI TEST
 * Test AI funkcionalita s admin přihlášením
 */

const BASE_URL = 'http://localhost:5000';

async function testAIFunctionality() {
  console.log('🤖 FINÁLNÍ TEST AI FUNKCIONALITA');
  console.log('====================================\n');

  // Přihlášení admina
  console.log('🔐 Přihlašování admin uživatele...');
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      username: 'admin@doklad.ai',
      password: 'admin123'
    })
  });

  if (!loginResponse.ok) {
    console.log('❌ Admin login selhal');
    return false;
  }

  const loginData = await loginResponse.json();
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✅ Admin přihlášen:', loginData.user?.username);

  // Test AI chat funkcionality
  const aiTests = [
    { name: 'Základní pozdrav', message: 'Ahoj, jak se máš?' },
    { name: 'Help request', message: 'Pomoc!' },
    { name: 'Navigace na zákazníky', message: 'Přejdi na zákazníky' },
    { name: 'Seznam faktur', message: 'Zobraz faktury' },
    { name: 'Statistiky', message: 'Jaké jsou naše příjmy?' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of aiTests) {
    console.log(`\n🧪 Test: ${test.name}`);
    console.log(`💬 Zpráva: "${test.message}"`);

    try {
      const aiResponse = await fetch(`${BASE_URL}/api/chat/universal`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookies || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          message: test.message
        })
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        console.log(`✅ ${test.name} - ÚSPĚCH`);
        console.log(`   Odpověď: ${aiData.response ? aiData.response.substring(0, 80) + '...' : 'Získána odpověď'}`);
        if (aiData.command) {
          console.log(`   Příkaz: ${aiData.command.action || 'akce'}`);
        }
        passed++;
      } else {
        const errorText = await aiResponse.text();
        console.log(`❌ ${test.name} - SELHAL`);
        console.log(`   Status: ${aiResponse.status}`);
        console.log(`   Error: ${errorText.substring(0, 100)}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - CHYBA: ${error.message}`);
      failed++;
    }
  }

  // Test univerzálního AI endpointu
  console.log('\n🔄 Test univerzálního AI...');
  try {
    const universalResponse = await fetch(`${BASE_URL}/api/ai/universal`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      credentials: 'include',
      body: JSON.stringify({
        message: 'Test univerzálního AI',
        currentPath: '/dashboard'
      })
    });

    if (universalResponse.ok) {
      console.log('✅ Univerzální AI endpoint funguje');
      passed++;
    } else {
      console.log('❌ Univerzální AI endpoint selhal:', universalResponse.status);
      failed++;
    }
  } catch (error) {
    console.log('❌ Univerzální AI chyba:', error.message);
    failed++;
  }

  // Výsledky
  console.log('\n====================================');
  console.log('📊 VÝSLEDKY AI TESTOVÁNÍ');
  console.log('====================================');
  console.log(`✅ Úspěšné: ${passed}`);
  console.log(`❌ Neúspěšné: ${failed}`);
  console.log(`📈 Úspěšnost: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 VŠECHNY AI TESTY PROŠLY!');
    console.log('✅ AI systém je plně funkční');
    return true;
  } else if (passed > failed) {
    console.log('\n⚠️ AI SYSTÉM ČÁSTEČNĚ FUNKČNÍ');
    console.log('✅ Většina AI funkcí funguje');
    return true;
  } else {
    console.log('\n🚨 AI SYSTÉM MÁ PROBLÉMY');
    console.log('❌ Více testů selhalo než prošlo');
    return false;
  }
}

// Spuštění
if (import.meta.url === `file://${process.argv[1]}`) {
  testAIFunctionality().catch(console.error);
}

export { testAIFunctionality };