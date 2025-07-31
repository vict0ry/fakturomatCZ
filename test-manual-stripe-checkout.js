#!/usr/bin/env node

/**
 * MANUÁLNÍ STRIPE CHECKOUT TEST
 * 
 * Tento script ti pomůže otestovat celý Stripe checkout flow
 * s falešnými kartami bez skutečných poplatků
 */

import { setupTestUser, loginTestUser } from './tests/test-utils.js';

console.log('🎯 MANUÁLNÍ STRIPE CHECKOUT TEST');
console.log('================================');
console.log('');

async function createManualTest() {
  try {
    // Create test user pro manual testing
    console.log('🔧 Vytváření test uživatele...');
    const { userId, token, username, password } = await setupTestUser();
    
    console.log('✅ Test uživatel vytvořen:');
    console.log(`   📧 Email: ${username}`);
    console.log(`   🔑 Heslo: ${password}`);
    console.log(`   🆔 User ID: ${userId}`);
    console.log(`   🎫 Token: ${token.substring(0, 20)}...`);
    console.log('');
    
    // Test checkout session creation
    console.log('💳 Testování vytvoření checkout session...');
    const response = await fetch('http://localhost:5000/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Checkout session úspěšně vytvořena!');
      console.log(`   🔗 Session ID: ${data.sessionId}`);
      console.log(`   🌐 Checkout URL: ${data.url}`);
      console.log('');
      
      console.log('🎯 MANUÁLNÍ TESTOVACÍ POSTUP:');
      console.log('============================');
      console.log('1. Otevři tento odkaz v prohlížeči:');
      console.log(`   ${data.url}`);
      console.log('');
      console.log('2. Použij TESTOVACÍ kartu (žádné skutečné peníze se nestrhnou!):');
      console.log('   💳 Číslo karty: 4242424242424242');
      console.log('   📅 Expiry: 12/25');
      console.log('   🔒 CVC: 123');
      console.log('   📮 ZIP: 12345');
      console.log('   👤 Jméno: Test User');
      console.log('');
      console.log('3. Po dokončení platby se vrátíš na success page');
      console.log('');
      console.log('4. Zkontroluj subscription status:');
      console.log('   http://localhost:5000/subscription');
      console.log('');
      console.log('5. ALTERNATIVNÍ LOGIN (pokud se odhlásíš):');
      console.log(`   📧 Email: ${username}`);
      console.log(`   🔑 Heslo: ${password}`);
      console.log('   🌐 Login: http://localhost:5000/login');
      console.log('');
      
      console.log('🧪 DALŠÍ TESTOVACÍ KARTY:');
      console.log('========================');
      console.log('❌ ZAMÍTNUTÁ KARTA:       4000000000000002');
      console.log('💸 NEDOSTATEK PROSTŘEDKŮ: 4000000000009995');
      console.log('🔐 VYŽADUJE OVĚŘENÍ:      4000000000000341');
      console.log('⏰ PROŠLÁ KARTA:         4000000000000069');
      console.log('');
      
      console.log('📊 CO OČEKÁVAT VE STRIPE DASHBOARDU:');
      console.log('===================================');
      console.log('Po dokončení platby uvidíš:');
      console.log('- Nového zákazníka v "Customers"');
      console.log('- Subscription v "Subscriptions"');
      console.log('- Payment Intent v "Payments"');
      console.log('- Webhook události v "Developers > Webhooks"');
      console.log('');
      
      console.log('⚠️  DŮLEŽITÉ:');
      console.log('=============');
      console.log('- Všechny platby jsou v TEST módu');
      console.log('- Žádné skutečné peníze se nestrhávají');
      console.log('- Test data můžeš smazat kdykoli');
      console.log('- Pro produkci použij LIVE klíče');
      
    } else {
      console.log('❌ Chyba při vytváření checkout session:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${await response.text()}`);
    }
    
  } catch (error) {
    console.error('🚨 Chyba:', error.message);
  }
}

// Spusť test
createManualTest();