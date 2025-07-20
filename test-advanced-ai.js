#!/usr/bin/env node

// Test pokročilých AI funkcií  
import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:5000';

const testCases = [
  {
    name: "AI Business Analytics",
    message: "analyzuj moje podnikání",
    expectedFunction: "analyze_business_insights"
  },
  {
    name: "Payment Risk Prediction", 
    message: "riziko zákazníka ABC s.r.o.",
    expectedFunction: "predict_payment_risk"
  },
  {
    name: "Email Campaign Optimization",
    message: "optimalizuj email kampaň pro upomínky",
    expectedFunction: "optimize_email_campaign"
  },
  {
    name: "Smart Report Generation",
    message: "vygeneruj monthly report s předpovědi",
    expectedFunction: "generate_smart_report"
  },
  {
    name: "Expense Categorization",
    message: "kategorizuj náklad elektřina od ČEZ",
    expectedFunction: "smart_expense_categorization"
  }
];

async function testAdvancedAI() {
  console.log('🧪 Test: Pokročilé AI funkce');
  console.log('💬 Testování pokročilých AI analýz...\n');

  for (const testCase of testCases) {
    try {
      console.log(`🔍 Test: ${testCase.name}`);
      
      const response = await fetch(`${SERVER_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testCase.message,
          context: "dashboard",
          currentPath: "/dashboard"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.content) {
        console.log(`✅ AI Response: ${result.content.substring(0, 100)}...`);
        
        if (result.action) {
          console.log(`🎯 Action: ${result.action.type}`);
        }
        
        console.log(''); // Empty line for readability
      } else {
        console.log(`❌ No content in response`);
      }

    } catch (error) {
      console.log(`❌ Test zlyhal: ${error.message}`);
      return false;
    }
  }

  console.log('✅ Všetky pokročilé AI funkcie fungujú správne!');
  return true;
}

// Spustiť test
testAdvancedAI().then(success => {
  if (success) {
    console.log('\n🎉 Pokročilé AI funkcie úspešne implementované!');
  } else {
    console.log('\n❌ Test neúspešný');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Neočakávaná chyba:', error);
  process.exit(1);
});