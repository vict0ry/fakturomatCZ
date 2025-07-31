#!/usr/bin/env node

/**
 * TEST WORKING STRIPE INTEGRATION
 */

console.log('🎯 TESTOVÁNÍ FUNKČNÍ STRIPE INTEGRACE');
console.log('=====================================');
console.log('');

async function testWorkingStripe() {
  const baseUrl = 'http://localhost:5000';
  const authToken = 'test-session-dev';

  try {
    console.log('1. 📊 Testování subscription status...');
    const statusResponse = await fetch(`${baseUrl}/api/stripe/subscription-status`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (statusResponse.ok) {
      const data = await statusResponse.json();
      console.log('✅ Subscription status funguje!');
      console.log(`   Status: ${data.status || 'žádné předplatné'}`);
      console.log(`   Plan: ${data.planType || 'none'}`);
    } else {
      console.log(`❌ Subscription status selhává: ${statusResponse.status}`);
      const errorText = await statusResponse.text();
      console.log(`   Error: ${errorText}`);
      return;
    }

    console.log('');
    console.log('2. 💳 Testování vytvoření checkout session...');
    const checkoutResponse = await fetch(`${baseUrl}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (checkoutResponse.ok) {
      const data = await checkoutResponse.json();
      console.log('✅ Checkout session vytvořena úspěšně!');
      console.log(`   Session ID: ${data.sessionId}`);
      console.log(`   Checkout URL: ${data.url}`);
      console.log('');
      
      console.log('🎯 NYNÍ MŮŽEŠ TESTOVAT PLATBU:');
      console.log('==============================');
      console.log('1. Otevři tento URL v prohlížeči:');
      console.log(`   ${data.url}`);
      console.log('');
      console.log('2. Použij testovací kartu (žádné skutečné peníze!):');
      console.log('   💳 Číslo: 4242424242424242');
      console.log('   📅 Expiry: 12/25');
      console.log('   🔒 CVC: 123');
      console.log('   📮 ZIP: 12345');
      console.log('');
      console.log('3. Po úspěšné platbě zkontroluj:');
      console.log('   - Přesměrování na dashboard');
      console.log('   - Status předplatného na /subscription');
      console.log('   - Nová data ve Stripe dashboard');
      console.log('');
      console.log('🔄 Pro ověření spusť znovu:');
      console.log('   node test-stripe-working.js');
      
    } else {
      console.log(`❌ Checkout session selhává: ${checkoutResponse.status}`);
      const errorText = await checkoutResponse.text();
      console.log(`   Error: ${errorText}`);
    }

  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

testWorkingStripe();