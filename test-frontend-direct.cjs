// Přímý test frontend přihlášení formuláře
const fetch = require('node-fetch');

async function testFrontendLogin() {
  console.log('🎯 PŘÍMÝ TEST FRONTEND PŘIHLÁŠENÍ');
  console.log('=================================\n');

  try {
    // 1. Test API endpoint přímo
    console.log('1️⃣ Test API endpointu...');
    const apiResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin@doklad.ai',
        password: 'admin123'
      })
    });

    const apiData = await apiResponse.json();
    console.log(`   API Status: ${apiResponse.status}`);
    console.log(`   API Response: ${JSON.stringify(apiData, null, 2)}`);

    if (apiResponse.status !== 200) {
      console.log('❌ API nefunguje - konec testu');
      return;
    }

    // 2. Test login stránky
    console.log('\n2️⃣ Test přístupu k login stránce...');
    const loginPageResponse = await fetch('http://localhost:5000/login');
    console.log(`   Login page status: ${loginPageResponse.status}`);

    if (loginPageResponse.status === 200) {
      console.log('   ✅ Login stránka je dostupná');
    } else {
      console.log('   ❌ Login stránka není dostupná');
    }

    // 3. Test admin route přístupu
    console.log('\n3️⃣ Test admin route...');
    const adminResponse = await fetch('http://localhost:5000/admin');
    console.log(`   Admin page status: ${adminResponse.status}`);

    // 4. Test session validation
    console.log('\n4️⃣ Test session validation...');
    const sessionResponse = await fetch('http://localhost:5000/api/auth/validate', {
      headers: {
        'Authorization': `Bearer ${apiData.sessionId}`
      }
    });

    const sessionData = await sessionResponse.json();
    console.log(`   Session status: ${sessionResponse.status}`);
    console.log(`   Session data: ${JSON.stringify(sessionData, null, 2)}`);

    // 5. Resumé
    console.log('\n📋 RESUMÉ:');
    console.log(`   ✅ API přihlášení: FUNGUJE (200)`);
    console.log(`   ${loginPageResponse.status === 200 ? '✅' : '❌'} Login stránka: ${loginPageResponse.status === 200 ? 'DOSTUPNÁ' : 'NEDOSTUPNÁ'}`);
    console.log(`   ${adminResponse.status === 200 ? '✅' : '❌'} Admin stránka: ${adminResponse.status === 200 ? 'DOSTUPNÁ' : 'NEDOSTUPNÁ'}`);
    console.log(`   ${sessionResponse.status === 200 ? '✅' : '❌'} Session validace: ${sessionResponse.status === 200 ? 'FUNGUJE' : 'NEFUNGUJE'}`);

    if (apiResponse.status === 200 && sessionResponse.status === 200) {
      console.log('\n🎉 ZÁVĚR: Backend a API fungují správně!');
      console.log('   Problém je pravděpodobně ve frontend React komponentě.');
      console.log('   Doporučení: Zkontrolovat Network tab v Developer Tools při přihlášení.');
    }

  } catch (error) {
    console.log(`💥 Test selhal: ${error.message}`);
  }
}

testFrontendLogin().catch(console.error);