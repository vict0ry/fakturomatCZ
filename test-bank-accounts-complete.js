#!/usr/bin/env node

const BASE_URL = 'http://localhost:5000';

async function testBankAccountsSystem() {
  console.log('🏦 TESTOVÁNÍ KOMPLETNÍHO SYSTÉMU BANKOVNÍCH ÚČTŮ');
  console.log('================================================\n');

  const sessionId = 'test-session-dev';
  
  console.log('1️⃣ Test načítání bankovních účtů');
  try {
    const response = await fetch(`${BASE_URL}/api/bank-accounts`, {
      headers: { 'Authorization': `Bearer ${sessionId}` }
    });
    
    const accounts = await response.json();
    console.log(`✅ Načteno ${accounts.length} bankovních účtů`);
    console.log('   Účty:', accounts.map(acc => `${acc.name} (${acc.accountNumber})`).join(', '));
  } catch (error) {
    console.log('❌ Chyba při načítání účtů:', error.message);
  }

  console.log('\n2️⃣ Test vytvoření nového bankovního účtu');
  try {
    const newAccount = {
      name: "Testovací účet CZK",
      accountNumber: "987654321/0800",
      iban: "CZ8708000000000987654321",
      swift: "GIBACZPX",
      currency: "CZK",
      bankName: "Česká spořitelna",
      bankCode: "0800",
      enablePaymentMatching: true,
      enableOutgoingPaymentMatching: false,
      enableBulkMatching: true,
      displayInOverview: true
    };

    const response = await fetch(`${BASE_URL}/api/bank-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionId}`
      },
      body: JSON.stringify(newAccount)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Bankovní účet úspěšně vytvořen');
      console.log(`   ID: ${result.id}, Název: ${result.name}`);
      
      // Test aktualizace účtu
      console.log('\n3️⃣ Test aktualizace bankovního účtu');
      const updateResponse = await fetch(`${BASE_URL}/api/bank-accounts/${result.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        },
        body: JSON.stringify({
          enablePaymentMatching: false,
          name: "Aktualizovaný testovací účet"
        })
      });

      if (updateResponse.ok) {
        console.log('✅ Bankovní účet úspěšně aktualizován');
      } else {
        console.log('❌ Chyba při aktualizaci účtu');
      }

    } else {
      const error = await response.text();
      console.log('❌ Chyba při vytváření účtu:', error);
    }
  } catch (error) {
    console.log('❌ Chyba při vytváření účtu:', error.message);
  }

  console.log('\n4️⃣ Test finálního načtení všech účtů');
  try {
    const response = await fetch(`${BASE_URL}/api/bank-accounts`, {
      headers: { 'Authorization': `Bearer ${sessionId}` }
    });
    
    const accounts = await response.json();
    console.log(`✅ Finální počet účtů: ${accounts.length}`);
    
    accounts.forEach((acc, i) => {
      console.log(`   ${i+1}. ${acc.name} (${acc.accountNumber})`);
      console.log(`      - Párování plateb: ${acc.enablePaymentMatching ? 'ANO' : 'NE'}`);
      console.log(`      - Email: ${acc.paymentEmail || 'Není nastaven'}`);
    });
    
  } catch (error) {
    console.log('❌ Chyba při finálním načítání:', error.message);
  }

  console.log('\n================================================');
  console.log('🎯 TEST BANKOVNÍCH ÚČTŮ DOKONČEN');
  console.log('================================================');
}

testBankAccountsSystem().catch(console.error);