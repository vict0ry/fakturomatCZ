import fs from "fs";
import fetch from 'node-fetch';

// Direct test of AI chat with expense creation
async function testAIChatWithExpense() {
  console.log("🧪 Test: AI Chat s vytvorením nákladu");

  try {
    const sessionId = "1de490fd-ac4c-433e-937a-3b4cdc045eab";
    
    console.log("💬 Testovanie AI chatu pre vytvorenie nákladu...");

    // Test bez prílohy najprv
    const chatMessage = "Vytvor náklad pre dodávateľa OBI Česká republika s.r.o. IČO 60470968 na sumu 1378.06 Kč s DPH 239.17 Kč za stavebný materiál";

    const aiResponse = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `sessionId=${sessionId}`
      },
      body: JSON.stringify({
        message: chatMessage,
        attachments: [],
        context: {},
        currentPath: '/expenses',
        chatHistory: []
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI chat failed: ${aiResponse.status} ${aiResponse.statusText}\n${errorText}`);
    }

    const aiResult = await aiResponse.json();
    console.log("🤖 AI odpoveď:", aiResult.response);

    // Overenie vytvorenia nákladu
    console.log("\n📋 Kontrolujem vytvorené náklady...");
    const expensesResponse = await fetch('http://localhost:5000/api/expenses', {
      headers: { 'Cookie': `sessionId=${sessionId}` }
    });

    if (expensesResponse.ok) {
      const expenses = await expensesResponse.json();
      console.log(`📊 Počet nákladov: ${expenses.length}`);
      
      if (expenses.length > 0) {
        const latestExpense = expenses[0];
        console.log("✅ Najnovší náklad:");
        console.log(`📄 Popis: ${latestExpense.description}`);
        console.log(`💰 Suma: ${latestExpense.total} Kč`);
        console.log(`📅 Dátum: ${latestExpense.expenseDate}`);
        console.log(`🏷️ Kategória: ${latestExpense.category}`);
        console.log(`🏢 Dodávateľ ID: ${latestExpense.supplierId || 'N/A'}`);
      }
    } else {
      console.log("⚠️ Nemôžem načítať náklady:", expensesResponse.statusText);
    }

    console.log("\n🎉 Test dokončený!");
    return true;

  } catch (error) {
    console.error("❌ Test zlyhal:", error.message);
    return false;
  }
}

// Spustiť test
testAIChatWithExpense()
  .then(success => {
    console.log(success ? "\n✅ Test úspešný!" : "\n❌ Test neúspešný");
    process.exit(success ? 0 : 1);
  });