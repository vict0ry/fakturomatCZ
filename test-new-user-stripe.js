#!/usr/bin/env node

/**
 * TEST STRIPE S NOVÝM UŽIVATELEM
 */

console.log('👤 TEST STRIPE S NOVÝM UŽIVATELEM');
console.log('=================================');
console.log('');

async function testNewUserStripe() {
  const baseUrl = 'http://localhost:5000';
  const timestamp = Date.now();
  
  try {
    // 1. Vytvoř test uživatele
    console.log('1. 🔧 Vytváření nového test uživatele...');
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: {
          firstName: 'Stripe',
          lastName: 'Tester',
          email: `stripe-test-${timestamp}@test.com`,
          password: 'test123456',
          username: `stripe-test-${timestamp}@test.com`
        },
        company: {
          name: `Test Company ${timestamp}`,
          ico: '12345678',
          dic: 'CZ12345678',
          address: 'Test Street 123',
          city: 'Praha',
          postalCode: '10000'
        }
      })
    });

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.log(`❌ Registrace selhala: ${registerResponse.status}`);
      console.log(`   Error: ${errorText}`);
      return;
    }

    console.log('✅ Test uživatel vytvořen!');
    
    // 2. Přihlaš se
    console.log('');
    console.log('2. 🔐 Přihlašování...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `stripe-test-${timestamp}@test.com`,
        password: 'test123456'
      })
    });

    if (!loginResponse.ok) {
      console.log(`❌ Přihlášení selhalo: ${loginResponse.status}`);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Přihlášení úspěšné!');

    // 3. Test Stripe s session cookie
    console.log('');
    console.log('3. 📊 Testování Stripe s novým uživatelem...');
    
    // Use session ID from login data
    const sessionId = loginData.sessionId;

    const statusResponse = await fetch(`${baseUrl}/api/stripe/subscription-status`, {
      headers: { 'Authorization': `Bearer ${sessionId}` }
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Nový uživatel může přistupovat ke Stripe!');
      console.log(`   Status: ${statusData.status || 'žádné předplatné'}`);
      console.log(`   User ID: ${loginData.user?.id}`);
    } else {
      console.log(`❌ Stripe status pro nového uživatele: ${statusResponse.status}`);
      const errorText = await statusResponse.text();
      console.log(`   Error: ${errorText}`);
      return;
    }

    // 4. Test checkout session creation
    console.log('');
    console.log('4. 💳 Testování vytvoření checkout session...');
    const checkoutResponse = await fetch(`${baseUrl}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionId}`,
        'Content-Type': 'application/json'
      }
    });

    if (checkoutResponse.ok) {
      const checkoutData = await checkoutResponse.json();
      console.log('✅ Checkout session pro nového uživatele funguje!');
      console.log('');
      console.log('🎯 STRIPE INTEGRATION FUNGUJE PRO NOVÉ UŽIVATELE!');
      console.log('==================================================');
      console.log(`URL: ${checkoutData.url}`);
      console.log('');
      console.log('💳 Test s kartou 4242424242424242 (žádné skutečné peníze)');
      
    } else {
      console.log(`❌ Checkout pro nového uživatele: ${checkoutResponse.status}`);
      const errorText = await checkoutResponse.text();
      console.log(`   Error: ${errorText}`);
    }

  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

testNewUserStripe();