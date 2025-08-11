const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testPaymentMatching() {
  console.log('🧪 Testing Payment Matching System\n');

  try {
    // 1. Test payment matching stats
    console.log('1. Testing payment matching stats...');
    const statsResponse = await fetch(`${BASE_URL}/payment-matching/stats`, {
      headers: {
        'Cookie': 'session=your-session-cookie-here' // Replace with actual session
      }
    });
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Stats loaded:', stats);
    } else {
      console.log('❌ Failed to load stats:', statsResponse.status);
    }

    // 2. Test bank transactions
    console.log('\n2. Testing bank transactions...');
    const transactionsResponse = await fetch(`${BASE_URL}/payment-matching/transactions?limit=10`, {
      headers: {
        'Cookie': 'session=your-session-cookie-here'
      }
    });
    
    if (transactionsResponse.ok) {
      const transactions = await transactionsResponse.json();
      console.log('✅ Transactions loaded:', transactions.data?.length || 0, 'transactions');
    } else {
      console.log('❌ Failed to load transactions:', transactionsResponse.status);
    }

    // 3. Test payment matches
    console.log('\n3. Testing payment matches...');
    const matchesResponse = await fetch(`${BASE_URL}/payment-matching/matches?limit=10`, {
      headers: {
        'Cookie': 'session=your-session-cookie-here'
      }
    });
    
    if (matchesResponse.ok) {
      const matches = await matchesResponse.json();
      console.log('✅ Payment matches loaded:', matches.data?.length || 0, 'matches');
    } else {
      console.log('❌ Failed to load matches:', matchesResponse.status);
    }

    // 4. Test email processing with sample data
    console.log('\n4. Testing email processing...');
    const sampleEmailContent = `
Subject: Bankovní výpis - 15.01.2025

Dobrý den,

zasíláme Vám výpis z účtu 219819-2602094613/2010 za období 15.01.2025.

PŘÍCHODZÍ PLATBY:
15.01.2025  25 000,00 CZK  VS: 2025001  KS: 0308  SS: 
Protistrana: Firma ABC s.r.o., 123456789/0800
Popis: Platba za fakturu 2025001

15.01.2025  15 500,00 CZK  VS: 2025002  KS: 0308  SS:
Protistrana: Společnost XYZ, 987654321/0100
Popis: Úhrada faktury

S pozdravem,
Fio banka
    `;

    const processResponse = await fetch(`${BASE_URL}/payment-matching/process-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session=your-session-cookie-here'
      },
      body: JSON.stringify({
        emailContent: sampleEmailContent,
        bankAccountId: 1 // Replace with actual bank account ID
      })
    });
    
    if (processResponse.ok) {
      const result = await processResponse.json();
      console.log('✅ Email processing result:', result);
    } else {
      console.log('❌ Failed to process email:', processResponse.status);
      const error = await processResponse.text();
      console.log('Error details:', error);
    }

    // 5. Test webhook endpoint
    console.log('\n5. Testing webhook endpoint...');
    const webhookData = {
      from: 'noreply@fio.cz',
      to: 'bank.219819.b7a9415jfb@doklad.ai',
      subject: 'Bankovní výpis - 15.01.2025',
      body: sampleEmailContent,
      timestamp: new Date().toISOString()
    };

    const webhookResponse = await fetch(`${BASE_URL}/payment-matching/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    });
    
    if (webhookResponse.ok) {
      const webhookResult = await webhookResponse.json();
      console.log('✅ Webhook processing result:', webhookResult);
    } else {
      console.log('❌ Failed to process webhook:', webhookResponse.status);
      const error = await webhookResponse.text();
      console.log('Error details:', error);
    }

    console.log('\n🎉 Payment matching tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test AI payment extraction
async function testAIExtraction() {
  console.log('\n🤖 Testing AI Payment Extraction\n');

  try {
    const sampleEmail = `
Subject: Výpis z účtu 123456789/0800

Dobrý den,

zasíláme Vám výpis z účtu 123456789/0800 za období 15.01.2025.

PŘÍCHODZÍ PLATBY:
15.01.2025  50 000,00 CZK  VS: 2025003  KS: 0308  SS: 
Protistrana: Velká Firma s.r.o., 987654321/0100
Popis: Platba za dodávku materiálu

15.01.2025  12 500,00 CZK  VS: 2025004  KS: 0308  SS:
Protistrana: Malá Firma, 111222333/0600
Popis: Úhrada faktury za služby

S pozdravem,
Česká spořitelna
    `;

    const response = await fetch(`${BASE_URL}/openai/simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `Analyzuj tento bankovní výpis a extrahuj všechny platby. Vrať JSON pole s platbami:

PRAVIDLA EXTRACE:
- Hledej částky, datumy, VS, KS, SS, protistranu
- Ignoruj záporné částky (odchozí platby)
- Pro datum použij ISO formát (YYYY-MM-DD)
- Pro částky použij čísla bez měny
- VS = variabilní symbol, KS = konstantní symbol, SS = specifický symbol

Formát odpovědi:
{
  "payments": [
    {
      "amount": 25000,
      "currency": "CZK",
      "variableSymbol": "123456",
      "constantSymbol": "0308",
      "specificSymbol": "",
      "counterpartyAccount": "123456789/0800",
      "counterpartyName": "Firma ABC s.r.o.",
      "description": "Platba za fakturu 2025001",
      "transactionDate": "2025-01-15",
      "bankReference": "REF123456"
    }
  ]
}

Email obsah:
${sampleEmail}`,
        maxTokens: 1000
      })
    });

    if (response.ok) {
      const result = await response.text();
      console.log('✅ AI extraction result:');
      console.log(result);
      
      try {
        const parsed = JSON.parse(result);
        console.log('✅ Parsed JSON:', parsed);
      } catch (parseError) {
        console.log('⚠️ Could not parse as JSON, but AI responded:', result);
      }
    } else {
      console.log('❌ AI extraction failed:', response.status);
    }

  } catch (error) {
    console.error('❌ AI test failed:', error);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting Payment Matching System Tests\n');
  
  await testPaymentMatching();
  await testAIExtraction();
  
  console.log('\n✨ All tests completed!');
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testPaymentMatching, testAIExtraction };
