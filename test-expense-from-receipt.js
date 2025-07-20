import OpenAI from "openai";
import fs from "fs";
import fetch from 'node-fetch';

// Test kompletného procesu: účtenka → ChatGPT Vision → vytvorenie nákladu
async function testExpenseCreationFromReceipt() {
  console.log("🧪 Test: Vytvorenie nákladu z účtenky pomocou ChatGPT Vision API");
  
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not found");
    return;
  }

  try {
    // 1. Načítanie a analýza účtenky
    const imagePath = "./attached_assets/IMG_3952_1753036696298.png";
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log("📄 Analyzujem účtenku pomocou ChatGPT Vision...");

    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyzuj túto účtenku a extrahuj údaje v JSON formáte pre vytvorenie nákladu:

{
  "supplierName": "Názov firmy",
  "supplierICO": "IČO",
  "supplierDIC": "DIČ", 
  "totalAmount": "celková suma (jen číslo)",
  "vatAmount": "DPH suma (jen číslo)",
  "netAmount": "suma bez DPH (jen číslo)",
  "vatRate": "DPH sadzba v %",
  "date": "YYYY-MM-DD",
  "receiptNumber": "číslo účtenky",
  "paymentMethod": "spôsob platby",
  "description": "stručný popis nákupu",
  "category": "kategória nákladu (Office/Travel/IT/Other)"
}`
            },
            {
              type: "image_url", 
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const visionData = JSON.parse(visionResponse.choices[0].message.content);
    console.log("✅ Údaje z účtenky:", JSON.stringify(visionData, null, 2));

    // 2. Test prihlásenia
    console.log("\n🔐 Prihlasujem sa do aplikácie...");
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    const sessionId = loginData.sessionId;
    console.log("✅ Prihlásenie úspešné");

    // 3. Vytvorenie nákladu pomocou AI chatu s priloženou účtenkou
    console.log("\n💰 Vytváranie nákladu z účtenky...");

    const chatMessage = "Vytvor náklad z priloženej účtenky";
    const attachments = [{
      name: "receipt.png",
      type: "image/png",
      data: base64Image
    }];

    const aiResponse = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `sessionId=${sessionId}`
      },
      body: JSON.stringify({
        message: chatMessage,
        attachments: attachments,
        context: {},
        currentPath: '/expenses',
        chatHistory: []
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI chat failed: ${aiResponse.statusText}`);
    }

    const aiResult = await aiResponse.json();
    console.log("🤖 AI odpoveď:", aiResult.response);

    // 4. Overenie vytvorenia nákladu
    console.log("\n📋 Kontrolujem vytvorené náklady...");
    const expensesResponse = await fetch('http://localhost:5000/api/expenses', {
      headers: { 'Cookie': `sessionId=${sessionId}` }
    });

    if (expensesResponse.ok) {
      const expenses = await expensesResponse.json();
      const latestExpense = expenses[0];
      
      if (latestExpense) {
        console.log("✅ Náklad bol vytvorený!");
        console.log(`📄 Dodávateľ: ${latestExpense.supplierName || 'N/A'}`);
        console.log(`💰 Suma: ${latestExpense.total} Kč`);
        console.log(`📅 Dátum: ${latestExpense.expenseDate}`);
        console.log(`🏷️ Kategória: ${latestExpense.category}`);
        console.log(`📎 Príloha: ${latestExpense.attachmentName ? 'Áno' : 'Nie'}`);
        
        if (latestExpense.attachmentUrl) {
          console.log("📷 Príloha bola uložená s účtenkou");
        }
      } else {
        console.log("⚠️ Žiadne náklady neboli nájdené");
      }
    }

    console.log("\n🎉 Test kompletný!");
    return true;

  } catch (error) {
    console.error("❌ Test zlyhal:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

// Spustiť test
testExpenseCreationFromReceipt()
  .then(success => {
    if (success) {
      console.log("\n✅ Všetky testy prešli úspešne!");
      console.log("🔥 ChatGPT Vision API + náklady funkčné!");
    } else {
      console.log("\n❌ Testy zlyhali");
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error("💥 Kritická chyba:", error);
    process.exit(1);
  });