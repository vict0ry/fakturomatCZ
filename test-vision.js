import OpenAI from "openai";
import fs from "fs";

// Test ChatGPT Vision API s reálnou účtenkou
async function testVisionAPI() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not found in environment variables");
    return;
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    // Načítanie obrázku účtenky
    const imagePath = "./attached_assets/IMG_3952_1753036696298.png";
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');

    console.log("🔍 Analyzujem účtenku pomocou ChatGPT Vision API...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Prosím analyzuj túto účtenku a extrahuj tieto informácie v JSON formáte:
              
{
  "supplierName": "Názov obchodu/firmy",
  "supplierICO": "IČO ak je k dispozícii",
  "supplierDIC": "DIČ ak je k dispozícii",
  "receiptNumber": "Číslo účtenky/dokladu",
  "totalAmount": "Celková suma v korunách (len číslo)",
  "vatAmount": "Suma DPH v korunách (len číslo)", 
  "netAmount": "Suma bez DPH v korunách (len číslo)",
  "vatRate": "Sadzba DPH v percentách",
  "currency": "Mena (CZK/EUR/USD)",
  "date": "Dátum v formáte YYYY-MM-DD",
  "paymentMethod": "Spôsob platby",
  "description": "Krátky popis nákupu",
  "category": "Kategória nákladu (Office, Food, Travel, IT, Other)",
  "items": [
    {
      "name": "Názov položky",
      "quantity": "Množstvo",
      "price": "Cena za jednotku",
      "total": "Celková cena položky"
    }
  ]
}

Skoncentruj sa na presnú extrakciu všetkých viditeľných údajov z účtenky. Ak nejaký údaj nie je jasne viditeľný, použij null.`
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
      max_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    console.log("\n✅ ChatGPT úspešne prečítal účtenku!");
    console.log("📄 Extrahované údaje:");
    console.log(JSON.stringify(result, null, 2));

    // Test vytvorenia nákladu s týmito údajmi
    console.log("\n💰 Testovanie vytvorenia nákladu:");
    console.log(`Dodávateľ: ${result.supplierName}`);
    console.log(`Celková suma: ${result.totalAmount} ${result.currency}`);
    console.log(`DPH: ${result.vatAmount} ${result.currency} (${result.vatRate}%)`);
    console.log(`Dátum: ${result.date}`);
    console.log(`Platba: ${result.paymentMethod}`);
    console.log(`Kategória: ${result.category}`);

    if (result.items && result.items.length > 0) {
      console.log("\n📋 Položky na účtenke:");
      result.items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} - ${item.quantity} x ${item.price} = ${item.total} Kč`);
      });
    }

    return result;

  } catch (error) {
    console.error("❌ Chyba pri testovaní Vision API:", error);
    throw error;
  }
}

// Spustiť test
testVisionAPI()
  .then(() => {
    console.log("\n🎉 Test Vision API úspešne dokončený!");
  })
  .catch(error => {
    console.error("💥 Test zlyhal:", error.message);
  });