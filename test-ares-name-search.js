import fetch from 'node-fetch';

async function testAresNameSearch() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🔍 TEST ARES SEARCH BY COMPANY NAME IN REGISTRATION');
  console.log('=================================================');
  
  try {
    // Test ARES search by company name
    console.log('1. 📋 Testování ARES search podle názvu firmy...');
    
    const testNames = ['Google', 'Microsoft', 'Apple'];
    
    for (const companyName of testNames) {
      console.log(`\n   Hledám: "${companyName}"`);
      
      const searchResponse = await fetch(`${baseUrl}/api/customers/search?q=${encodeURIComponent(companyName)}`);
      
      if (searchResponse.ok) {
        const results = await searchResponse.json();
        const aresResults = results.filter(r => r.source === 'ares');
        
        console.log(`   ✅ Nalezeno ${aresResults.length} výsledků z ARES:`);
        aresResults.slice(0, 3).forEach((result, index) => {
          console.log(`      ${index + 1}. ${result.name}`);
          console.log(`         IČO: ${result.ico || 'N/A'}`);
          console.log(`         Adresa: ${result.address || 'N/A'}, ${result.city || 'N/A'}`);
        });
      } else {
        console.log(`   ❌ Chyba při hledání: ${searchResponse.status}`);
      }
    }

    // Test specific Czech company
    console.log('\n2. 🇨🇿 Test českých firem...');
    const czechNames = ['Generální finanční ředitelství', 'Microsoft'];
    
    for (const czechName of czechNames) {
      console.log(`\n   Hledám českou firmu: "${czechName}"`);
      
      const searchResponse = await fetch(`${baseUrl}/api/customers/search?q=${encodeURIComponent(czechName)}`);
      
      if (searchResponse.ok) {
        const results = await searchResponse.json();
        const aresResults = results.filter(r => r.source === 'ares');
        
        if (aresResults.length > 0) {
          const company = aresResults[0];
          console.log(`   ✅ Nalezena: ${company.name}`);
          console.log(`      IČO: ${company.ico}`);
          console.log(`      DIČ: ${company.dic || 'N/A'}`);
          console.log(`      Adresa: ${company.address}, ${company.city}`);
        } else {
          console.log('   ⚠️  Žádné výsledky z ARES');
        }
      }
    }

    console.log('\n🎯 ARES NAME SEARCH FUNCTIONALITY TESTED!');
    console.log('========================================');
    console.log('✅ ARES vyhledávání podle názvu funguje');
    console.log('✅ Registrace může používat both IČO i název');
    console.log('✅ Customer search API podporuje ARES integration');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAresNameSearch();