#!/usr/bin/env node

/**
 * 🤖 AI TEST S PROPER SESSION HANDLING
 */

const BASE_URL = 'http://localhost:5000';

async function testAIWithProperSession() {
  console.log('🤖 AI TEST S PROPER SESSION MANAGEMENT');
  console.log('=====================================\n');

  // Přihlášení a získání session cookie
  console.log('🔐 Admin login...');
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin@doklad.ai',
      password: 'admin123'
    })
  });

  if (!loginResponse.ok) {
    console.log('❌ Login failed:', await loginResponse.text());
    return false;
  }

  const loginData = await loginResponse.json();
  
  // Získání session cookie ze Set-Cookie header
  const setCookieHeader = loginResponse.headers.get('set-cookie');
  let sessionCookie = '';
  
  if (setCookieHeader) {
    const cookies = setCookieHeader.split(',');
    const sessionCookieEntry = cookies.find(cookie => cookie.trim().startsWith('connect.sid='));
    if (sessionCookieEntry) {
      sessionCookie = sessionCookieEntry.split(';')[0].trim();
    }
  }

  console.log('✅ Login successful');
  console.log('   User:', loginData.user?.username);
  console.log('   SessionId:', loginData.sessionId);
  console.log('   Cookie:', sessionCookie ? 'Získáno' : 'Chybí');

  if (!sessionCookie) {
    console.log('❌ Session cookie nebyl získán');
    return false;
  }

  // Test AI endpointů s proper session cookie
  const aiTests = [
    { name: 'Základní pozdrav', message: 'Ahoj!' },
    { name: 'Help request', message: 'Pomoc!' },
    { name: 'Navigace', message: 'Přejdi na zákazníky' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of aiTests) {
    console.log(`\n🧪 Test: ${test.name}`);
    try {
      const response = await fetch(`${BASE_URL}/api/chat/universal`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': sessionCookie
        },
        body: JSON.stringify({ message: test.message })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name} - ÚSPĚCH`);
        console.log(`   Odpověď: ${data.response?.substring(0, 60)}...`);
        passed++;
      } else {
        const errorText = await response.text();
        console.log(`❌ ${test.name} - SELHAL (${response.status})`);
        console.log(`   Error: ${errorText.substring(0, 100)}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - CHYBA: ${error.message}`);
      failed++;
    }
  }

  // Summary
  console.log('\n=====================================');
  console.log('📊 VÝSLEDKY AI TESTŮ');
  console.log('=====================================');
  console.log(`✅ Úspěšné: ${passed}`);
  console.log(`❌ Neúspěšné: ${failed}`);
  console.log(`📈 Úspěšnost: ${Math.round((passed / (passed + failed)) * 100)}%`);

  return failed === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testAIWithProperSession().catch(console.error);
}

export { testAIWithProperSession };