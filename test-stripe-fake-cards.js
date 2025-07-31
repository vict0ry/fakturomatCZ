#!/usr/bin/env node

/**
 * STRIPE FAKE CARDS TESTING GUIDE
 * 
 * Tento soubor obsahuje kompletní průvodce pro testování Stripe plateb
 * s falešnými kartami. Žádné skutečné peníze se nestrhávají!
 */

console.log('🧪 STRIPE FAKE CARDS TESTING GUIDE');
console.log('==================================');
console.log('');

console.log('💳 ÚSPĚŠNÉ TEST KARTY:');
console.log('----------------------');
console.log('Visa:              4242424242424242');
console.log('Visa (debit):      4000056655665556'); 
console.log('Mastercard:        5555555555554444');
console.log('Mastercard (debit): 5200828282828210');
console.log('American Express:  378282246310005');
console.log('American Express:  371449635398431');
console.log('Discover:          6011111111111117');
console.log('Diners Club:       30569309025904');
console.log('JCB:               3566002020360505');
console.log('UnionPay:          6200000000000005');
console.log('');

console.log('❌ NEÚSPĚŠNÉ TEST KARTY:');
console.log('------------------------');
console.log('Generic decline:               4000000000000002');
console.log('Insufficient funds:            4000000000009995');
console.log('Lost card:                     4000000000009987');
console.log('Stolen card:                   4000000000009979');
console.log('Expired card:                  4000000000000069');
console.log('Incorrect CVC:                 4000000000000127');
console.log('Processing error:              4000000000000119');
console.log('Incorrect number:              4242424242424241');
console.log('');

console.log('🔐 3D SECURE TEST KARTY:');
console.log('------------------------');
console.log('Authentication required:       4000000000000341');
console.log('Authentication unavailable:    4000000000000002');
console.log('Authentication failed:         4000000000000002');
console.log('');

console.log('💸 SPECIFIC AMOUNT TESTS:');
console.log('-------------------------');
console.log('Charge succeeds, dispute:      4000000000000259');
console.log('Charge succeeds, fraud:        4100000000000019');
console.log('');

console.log('🇨🇿 ČESKÉ SPECIFICKÉ TESTY:');
console.log('---------------------------');
console.log('CZK currency tests:            4242424242424242');
console.log('European card:                 4000000000000077');
console.log('');

console.log('📋 NÁVOD PRO TESTOVÁNÍ:');
console.log('=======================');
console.log('1. Spusť aplikaci: npm run dev');
console.log('2. Přejdi na: http://localhost:5000/pricing');
console.log('3. Klikni "Začít 7denní zkušební období"');
console.log('4. Použij jednu z test karet výše');
console.log('5. Použij tyto údaje:');
console.log('   - CVC: jakékoli 3 číslice (např. 123)');
console.log('   - Expiry: jakékoli budoucí datum (např. 12/25)');
console.log('   - ZIP: jakýkoliv (např. 10001)');
console.log('   - Jméno: jakékoli (např. Test User)');
console.log('');

console.log('✅ CO OČEKÁVAT:');
console.log('===============');
console.log('ÚSPĚŠNÁ PLATBA (4242424242424242):');
console.log('- Přesměrování na success page');
console.log('- Email s potvrzením předplatného');
console.log('- Status "trial" v /subscription');
console.log('- Trial period 7 dní');
console.log('');

console.log('NEÚSPĚŠNÁ PLATBA (4000000000000002):');
console.log('- Chybová hláška "Your card was declined"');
console.log('- Zůstaneš na Stripe checkout');
console.log('- Můžeš zkusit jinou kartu');
console.log('');

console.log('🔬 POKROČILÉ TESTOVÁNÍ:');
console.log('=======================');
console.log('1. Test webhooků:');
console.log('   stripe listen --forward-to localhost:5000/api/stripe/webhook');
console.log('');
console.log('2. Test subscriptions:');
console.log('   stripe subscriptions list --limit 10');
console.log('');
console.log('3. Test customers:');
console.log('   stripe customers list --limit 10');
console.log('');

console.log('⚠️  DŮLEŽITÉ UPOZORNĚNÍ:');
console.log('========================');
console.log('- VŠECHNY test karty fungují pouze v TEST módu');
console.log('- ŽÁDNÉ skutečné peníze se nikdy nestrhávají');
console.log('- Pro produkci musíš nastavit LIVE Stripe klíče');
console.log('- Test data jsou automaticky smazána po 90 dnech');
console.log('');

console.log('🚀 SPUŠTĚNÍ TESTŮ:');
console.log('==================');
console.log('node test-stripe-integration.js  # Automatické API testy');
console.log('node test-stripe-fake-cards.js   # Tento průvodce');
console.log('');

// Interaktivní test runner
if (process.argv.includes('--interactive')) {
  console.log('🎮 INTERAKTIVNÍ REŽIM:');
  console.log('======================');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  }

  async function interactiveTest() {
    console.log('Vyberte test kartu:');
    console.log('1. 4242424242424242 (úspěšná)');
    console.log('2. 4000000000000002 (zamítnutá)');
    console.log('3. 4000000000009995 (nedostatek prostředků)');
    console.log('4. 4000000000000341 (vyžaduje ověření)');
    
    const choice = await askQuestion('Vaše volba (1-4): ');
    
    const cards = {
      '1': { number: '4242424242424242', name: 'Úspěšná karta' },
      '2': { number: '4000000000000002', name: 'Zamítnutá karta' },
      '3': { number: '4000000000009995', name: 'Nedostatek prostředků' },
      '4': { number: '4000000000000341', name: 'Vyžaduje ověření' }
    };
    
    const selectedCard = cards[choice];
    if (selectedCard) {
      console.log(`\n✅ Vybrána: ${selectedCard.name}`);
      console.log(`📋 Číslo karty: ${selectedCard.number}`);
      console.log('📋 CVC: 123');
      console.log('📋 Expiry: 12/25');
      console.log('📋 ZIP: 12345');
      console.log('\n🌐 Otevři: http://localhost:5000/pricing');
      console.log('💳 Klikni "Začít 7denní zkušební období"');
      console.log('📝 Zadej údaje výše do Stripe formuláře');
    } else {
      console.log('❌ Neplatná volba!');
    }
    
    rl.close();
  }

  interactiveTest();
}