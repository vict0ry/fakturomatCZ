#!/usr/bin/env node

/**
 * TEST STRIPE S REÁLNÝM UŽIVATELEM
 */

console.log('🎯 STRIPE TEST S REÁLNÝM UŽIVATELEM');
console.log('===================================');
console.log('');

async function testWithRealUser() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    // 1. Vytvoř test uživatele
    console.log('1. 👤 Vytváření test uživatele...');
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `test_${Date.now()}@stripe.test`,
        email: `test_${Date.now()}@stripe.test`,
        password: 'test123',
        firstName: 'Test',
        lastName: 'Stripe',
        company: {
          name: 'Test Company s.r.o.',
          ico: '12345678'
        }
      })
    });

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();  
      console.log(`❌ Registrace selhala: ${registerResponse.status}`);
      console.log(`   Error: ${errorText}`);
      return;
    }

    const userData = await registerResponse.json();
    console.log('✅ Test uživatel vytvořen!');
    console.log(`   Email: ${userData.user?.username}`);
    console.log(`   User ID: ${userData.user?.id}`);

    // 2. Přihlaš se
    console.log('');
    console.log('2. 🔐 Přihlašování...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: userData.user.username,
        password: 'test123'
      })
    });

    if (!loginResponse.ok) {
      console.log(`❌ Přihlášení selhalo: ${loginResponse.status}`);
      return;
    }

    // Získej session cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    const sessionCookie = setCookieHeader ? setCookieHeader.split(';')[0] : '';

    console.log('✅ Přihlášení úspěšné!');
    console.log(`   Session: ${sessionCookie.substring(0, 30)}...`);

    // 3. Test subscription status
    console.log('');
    console.log('3. 📊 Testování subscription status...');
    const statusResponse = await fetch(`${baseUrl}/api/stripe/subscription-status`, {
      headers: { 'Cookie': sessionCookie }
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Subscription status funguje!');
      console.log(`   Status: ${statusData.status || 'žádné předplatné'}`);
      console.log(`   Plan: ${statusData.planType || 'none'}`);
    } else {
      console.log(`❌ Subscription status: ${statusResponse.status}`);
      const errorText = await statusResponse.text();
      console.log(`   Error: ${errorText}`);
      return;
    }

    // 4. Vytvoř checkout session
    console.log('');
    console.log('4. 💳 Vytváření checkout session...');
    const checkoutResponse = await fetch(`${baseUrl}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      }
    });

    if (checkoutResponse.ok) {
      const checkoutData = await checkoutResponse.json();
      console.log('✅ Checkout session vytvořena!');
      console.log(`   Session ID: ${checkoutData.sessionId}`);
      console.log(`   URL: ${checkoutData.url}`);
      console.log('');
      
      console.log('🎯 MANUÁLNÍ TEST - OTEVŘI V PROHLÍŽEČI:');
      console.log('======================================');
      console.log(`URL: ${checkoutData.url}`);
      console.log('');
      console.log('💳 TESTOVACÍ KARTA (žádné skutečné peníze!):');
      console.log('   Číslo: 4242424242424242');  
      console.log('   Expiry: 12/25');
      console.log('   CVC: 123');
      console.log('   ZIP: 12345');
      console.log('');
      console.log('📋 PO DOKONČENÍ PLATBY:');
      console.log('1. Měl bys být přesměrován na /dashboard');
      console.log('2. Zkontroluj /subscription pro status');
      console.log('3. Ve Stripe dashboard uvidíš:');
      console.log('   - Nového zákazníka');
      console.log('   - Nové předplatné s trial');
      console.log('   - Payment intent');
      console.log('');
      console.log('🔄 Pro kontrolu spusť znovu tento test');
      
    } else {
      console.log(`❌ Checkout session: ${checkoutResponse.status}`);
      const errorText = await checkoutResponse.text();
      console.log(`   Error: ${errorText}`);
    }

  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

testWithRealUser();