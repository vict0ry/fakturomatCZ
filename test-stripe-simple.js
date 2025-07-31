#!/usr/bin/env node

/**
 * JEDNODUCHÝ STRIPE TEST S ADMIN UŽIVATELEM
 */

console.log('🎯 JEDNODUCHÝ STRIPE TEST');
console.log('=========================');
console.log('');

async function testStripeSimple() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    // 1. Přihlaš se jako admin
    console.log('1. 🔐 Přihlašování jako admin...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin@doklad.ai',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log(`❌ Admin přihlášení selhalo: ${loginResponse.status}`);
      const errorText = await loginResponse.text();
      console.log(`   Error: ${errorText}`);
      return;
    }

    // Získej session cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    const sessionCookie = setCookieHeader ? setCookieHeader.split(';')[0] : '';

    console.log('✅ Admin přihlášen úspěšně!');
    console.log(`   Session: ${sessionCookie.substring(0, 30)}...`);

    // 2. Test subscription status
    console.log('');
    console.log('2. 📊 Kontrola subscription status...');
    const statusResponse = await fetch(`${baseUrl}/api/stripe/subscription-status`, {
      headers: { 'Cookie': sessionCookie }
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Subscription status endpoint funguje!');
      console.log(`   Status: ${statusData.status || 'žádné předplatné'}`);
      console.log(`   Plan: ${statusData.planType || 'žádný plán'}`);
      console.log(`   Trial: ${statusData.trialEndsAt || 'bez trial'}`);
    } else {
      console.log(`❌ Subscription status selhává: ${statusResponse.status}`);
      const errorText = await statusResponse.text();
      console.log(`   Error: ${errorText}`);
      return;
    }

    // 3. Vytvoř checkout session
    console.log('');
    console.log('3. 💳 Vytváření Stripe checkout session...');
    const checkoutResponse = await fetch(`${baseUrl}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      }
    });

    if (checkoutResponse.ok) {
      const checkoutData = await checkoutResponse.json();
      console.log('✅ Checkout session vytvořena úspěšně!');
      console.log(`   Session ID: ${checkoutData.sessionId}`);
      console.log('');
      
      console.log('🌐 MANUÁLNÍ TEST - CHECKOUT URL:');
      console.log('==============================');
      console.log(checkoutData.url);
      console.log('');
      console.log('💳 TESTOVACÍ KARTA (žádné skutečné peníze!):');
      console.log('   Číslo: 4242424242424242');  
      console.log('   Expiry: 12/25 (nebo jakékoliv budoucí datum)');
      console.log('   CVC: 123 (nebo jakékoliv 3 číslice)');
      console.log('   ZIP: 12345 (nebo jakékoliv PSČ)');
      console.log('   Jméno: Test User');
      console.log('');
      console.log('🎯 POSTUP:');
      console.log('1. Otevři výše uvedený URL v prohlížeči');
      console.log('2. Vyplň testovací kartu (ŽÁDNÉ SKUTEČNÉ PENÍZE!)');
      console.log('3. Klikni "Subscribe"');
      console.log('4. Po úspěchu budeš přesměrován na dashboard');
      console.log('5. Zkontroluj /subscription pro nový status');
      console.log('');
      console.log('🔄 Po dokončení spusť znovu test pro ověření');
      
    } else {
      console.log(`❌ Checkout session selhává: ${checkoutResponse.status}`);
      const errorText = await checkoutResponse.text();
      console.log(`   Error: ${errorText}`);
    }

  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

testStripeSimple();