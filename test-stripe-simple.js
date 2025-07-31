#!/usr/bin/env node

/**
 * JEDNODUCHÝ STRIPE TEST - BEZ DEPENDENCIES
 */

console.log('🎯 STRIPE INTEGRATION TEST');
console.log('==========================');
console.log('');

async function testStripeEndpoints() {
  const baseUrl = 'http://localhost:5000';
  
  // Test 1: Pricing page
  console.log('📄 Testování pricing stránky...');
  try {
    const response = await fetch(`${baseUrl}/pricing`);
    if (response.ok) {
      console.log('✅ Pricing stránka dostupná');
    } else {
      console.log(`❌ Pricing stránka nedostupná: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Chyba při přístupu k pricing: ${error.message}`);
  }
  
  // Test 2: Subscription page
  console.log('📊 Testování subscription stránky...');
  try {
    const response = await fetch(`${baseUrl}/subscription`);
    if (response.ok) {
      console.log('✅ Subscription stránka dostupná');
    } else {
      console.log(`❌ Subscription stránka nedostupná: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Chyba při přístupu k subscription: ${error.message}`);
  }
  
  console.log('');
  console.log('🧪 MANUÁLNÍ TESTOVÁNÍ:');
  console.log('======================');
  console.log('1. Přejdi na: http://localhost:5000/pricing');
  console.log('2. Přihlaš se (nebo se registruj)');
  console.log('3. Klikni "Začít 7denní zkušební období"');
  console.log('4. Použij TESTOVACÍ kartu: 4242424242424242');
  console.log('5. Údaje: CVC=123, Expiry=12/25, ZIP=12345');
  console.log('');
  console.log('💳 TESTOVACÍ KARTY (žádné skutečné peníze!):');
  console.log('✅ Úspěšná:              4242424242424242');
  console.log('❌ Zamítnutá:            4000000000000002');
  console.log('💸 Nedostatek prostředků: 4000000000009995');
  console.log('🔐 Vyžaduje ověření:     4000000000000341');
  console.log('');
  console.log('📊 Po úspěšné platbě zkontroluj:');
  console.log('- /subscription - status předplatného');
  console.log('- Stripe dashboard - nový zákazník a subscription');
  console.log('');
  console.log('⚠️  DŮLEŽITÉ: Všechny platby jsou v TEST módu!');
}

testStripeEndpoints();