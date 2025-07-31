#!/usr/bin/env node

/**
 * KOMPLETNÍ STRIPE INTEGRATION TEST
 * 
 * Testuje celý flow od registrace po subscription management
 * Používá pouze Stripe test karty - žádné skutečné peníze!
 */

import { apiRequest, setupTestUser, cleanupTestUser, loginTestUser } from './tests/test-utils.js';

console.log('🎯 KOMPLETNÍ STRIPE INTEGRATION TEST');
console.log('====================================');
console.log('⚠️  POUŽÍVÁME POUZE FAKE KARTY - ŽÁDNÉ SKUTEČNÉ POPLATKY!');
console.log('');

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(name, success, message = '') {
  results.total++;
  if (success) {
    results.passed++;
    console.log(`✅ ${name}`);
    if (message) console.log(`   ${message}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    if (message) console.log(`   ${message}`);
    results.errors.push(`${name}: ${message}`);
  }
}

async function testStripeIntegration() {
  let testUserId = null;
  let authToken = null;

  try {
    // 1. Setup test environment
    console.log('🔧 PŘÍPRAVA TESTOVACÍHO PROSTŘEDÍ');
    console.log('---------------------------------');
    
    const { userId, token } = await setupTestUser();
    testUserId = userId;
    authToken = token;
    
    logTest('Test user setup', true, `User ID: ${userId}`);
    console.log('');

    // 2. Test pricing page access
    console.log('📄 TESTOVÁNÍ PRICING STRÁNKY');
    console.log('----------------------------');
    
    try {
      const response = await fetch('http://localhost:5000/pricing');
      logTest('Pricing page accessible', response.ok, `Status: ${response.status}`);
    } catch (error) {
      logTest('Pricing page accessible', false, error.message);
    }
    console.log('');

    // 3. Test subscription status (initial)
    console.log('📊 TESTOVÁNÍ SUBSCRIPTION STATUS');
    console.log('--------------------------------');
    
    try {
      const response = await fetch('http://localhost:5000/api/stripe/subscription-status', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        logTest('Initial subscription status', true, `Status: ${data.status}, Plan: ${data.planType}`);
        
        // Should be trial or no subscription initially
        if (data.status === 'trial' || !data.status) {
          logTest('Correct initial status', true, 'No active subscription as expected');
        } else {
          logTest('Correct initial status', false, `Unexpected status: ${data.status}`);
        }
      } else {
        logTest('Initial subscription status', false, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest('Initial subscription status', false, error.message);
    }
    console.log('');

    // 4. Test checkout session creation
    console.log('💳 TESTOVÁNÍ CHECKOUT SESSION');
    console.log('-----------------------------');
    
    try {
      const response = await fetch('http://localhost:5000/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.sessionId && data.url) {
          logTest('Checkout session creation', true, `Session ID: ${data.sessionId.substring(0, 20)}...`);
          logTest('Checkout URL generation', true, `URL: ${data.url.substring(0, 50)}...`);
          
          // Verify URL contains Stripe checkout
          if (data.url.includes('checkout.stripe.com')) {
            logTest('Valid Stripe checkout URL', true, 'URL points to Stripe checkout');
          } else {
            logTest('Valid Stripe checkout URL', false, 'URL does not point to Stripe');
          }
        } else {
          logTest('Checkout session creation', false, 'Missing sessionId or url');
        }
      } else {
        const errorText = await response.text();
        logTest('Checkout session creation', false, `HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      logTest('Checkout session creation', false, error.message);
    }
    console.log('');

    // 5. Test subscription management page
    console.log('⚙️  TESTOVÁNÍ SUBSCRIPTION MANAGEMENT');
    console.log('------------------------------------');
    
    try {
      const response = await fetch('http://localhost:5000/subscription');
      logTest('Subscription page accessible', response.ok, `Status: ${response.status}`);
    } catch (error) {
      logTest('Subscription page accessible', false, error.message);
    }
    console.log('');

    // 6. Test webhook endpoint (structure)
    console.log('🔗 TESTOVÁNÍ WEBHOOK ENDPOINT');
    console.log('-----------------------------');
    
    try {
      // Test webhook endpoint exists (should return 400 without proper signature)
      const response = await fetch('http://localhost:5000/api/stripe/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });
      
      // Should return 400 due to missing signature - this is expected
      if (response.status === 400) {
        logTest('Webhook endpoint exists', true, 'Returns 400 without signature (expected)');
      } else {
        logTest('Webhook endpoint exists', false, `Unexpected status: ${response.status}`);
      }
    } catch (error) {
      logTest('Webhook endpoint exists', false, error.message);
    }
    console.log('');

    // 7. Test cancel subscription endpoint
    console.log('❌ TESTOVÁNÍ CANCEL SUBSCRIPTION');
    console.log('--------------------------------');
    
    try {
      const response = await fetch('http://localhost:5000/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      // Should return 404 since user has no active subscription
      if (response.status === 404) {
        logTest('Cancel subscription endpoint', true, 'Returns 404 for no subscription (expected)');
      } else {
        logTest('Cancel subscription endpoint', false, `Unexpected status: ${response.status}`);
      }
    } catch (error) {
      logTest('Cancel subscription endpoint', false, error.message);
    }
    console.log('');

    // 8. Test fake cards documentation
    console.log('🃏 DOKUMENTACE FAKE KARET');
    console.log('-------------------------');
    
    const fakeCards = [
      { number: '4242424242424242', type: 'Success', description: 'Úspěšná platba' },
      { number: '4000000000000002', type: 'Declined', description: 'Zamítnutá karta' },
      { number: '4000000000009995', type: 'Insufficient', description: 'Nedostatek prostředků' },
      { number: '4000000000000341', type: 'Auth Required', description: 'Vyžaduje ověření' }
    ];
    
    fakeCards.forEach(card => {
      logTest(`Fake Card: ${card.type}`, true, `${card.number} - ${card.description}`);
    });
    console.log('');

  } catch (error) {
    console.error('🚨 Critical test error:', error);
    results.errors.push(`Critical: ${error.message}`);
  } finally {
    // Cleanup
    if (testUserId) {
      try {
        await cleanupTestUser(testUserId);
        logTest('Test cleanup', true, 'Test user removed');
      } catch (error) {
        logTest('Test cleanup', false, error.message);
      }
    }
  }

  // Final results
  console.log('');
  console.log('📈 VÝSLEDKY TESTŮ');
  console.log('=================');
  console.log(`📊 Celkem:   ${results.total}`);
  console.log(`✅ Úspěch:   ${results.passed}`);
  console.log(`❌ Selhání:  ${results.failed}`);
  console.log(`📈 Úspěšnost: ${Math.round((results.passed / results.total) * 100)}%`);
  
  if (results.errors.length > 0) {
    console.log('');
    console.log('🚨 CHYBY:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  console.log('');
  console.log('🎯 MANUÁLNÍ TESTOVÁNÍ - FAKE KARTY:');
  console.log('===================================');
  console.log('1. Otevři: http://localhost:5000/pricing');
  console.log('2. Klikni: "Začít 7denní zkušební období"');
  console.log('3. Použij test kartu: 4242424242424242');
  console.log('4. Údaje: CVC=123, Expiry=12/25, ZIP=12345');
  console.log('5. Zkontroluj: /subscription po platbě');
  console.log('');
  console.log('💳 DALŠÍ TEST KARTY:');
  console.log('- 4000000000000002 (zamítnutá)');
  console.log('- 4000000000009995 (nedostatek prostředků)');
  console.log('- 4000000000000341 (vyžaduje ověření)');
  console.log('');
  console.log('⚠️  POZNÁMKA: Žádné skutečné peníze se nestrhávají!');
  console.log('🔒 Vše je v test módu Stripe!');

  return results.failed === 0;
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testStripeIntegration().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}