// Test přihlášení admin účtu
// Spustit: node test-admin-login.js

const BASE_URL = 'http://localhost:5000';

async function testAdminLogin() {
  console.log('🔐 TESTOVÁNÍ ADMIN PŘIHLÁŠENÍ');
  console.log('==============================\n');

  // Test 1: Přihlášení pomocí username
  console.log('1️⃣ Test přihlášení s username: "admin"');
  try {
    const response1 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const data1 = await response1.json();
    
    if (response1.ok) {
      console.log('✅ SUCCESS - username login');
      console.log(`   SessionId: ${data1.sessionId}`);
      console.log(`   User: ${data1.user.username} (${data1.user.email})`);
      console.log(`   Role: ${data1.user.role}`);
    } else {
      console.log('❌ FAILED - username login');
      console.log(`   Error: ${data1.message}`);
    }
  } catch (error) {
    console.log('❌ ERROR - username login:', error.message);
  }

  console.log();

  // Test 2: Přihlášení pomocí email
  console.log('2️⃣ Test přihlášení s email: "admin@doklad.ai"');
  try {
    const response2 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin@doklad.ai',
        password: 'admin123'
      })
    });

    const data2 = await response2.json();
    
    if (response2.ok) {
      console.log('✅ SUCCESS - email login');
      console.log(`   SessionId: ${data2.sessionId}`);
      console.log(`   User: ${data2.user.username} (${data2.user.email})`);
      console.log(`   Role: ${data2.user.role}`);
    } else {
      console.log('❌ FAILED - email login');
      console.log(`   Error: ${data2.message}`);
    }
  } catch (error) {
    console.log('❌ ERROR - email login:', error.message);
  }

  console.log();

  // Test 3: Špatné heslo
  console.log('3️⃣ Test špatného hesla');
  try {
    const response3 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin@doklad.ai',
        password: 'spatne-heslo'
      })
    });

    const data3 = await response3.json();
    
    if (!response3.ok) {
      console.log('✅ SPRÁVNĚ - špatné heslo odmítnuto');
      console.log(`   Error: ${data3.message}`);
    } else {
      console.log('❌ PROBLÉM - špatné heslo přijato!');
    }
  } catch (error) {
    console.log('❌ ERROR - bad password test:', error.message);
  }

  console.log();

  // Test 4: Prázdné údaje
  console.log('4️⃣ Test prázdných údajů');
  try {
    const response4 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: '',
        password: ''
      })
    });

    const data4 = await response4.json();
    
    if (!response4.ok) {
      console.log('✅ SPRÁVNĚ - prázdné údaje odmítnuty');
      console.log(`   Error: ${data4.message}`);
    } else {
      console.log('❌ PROBLÉM - prázdné údaje přijaty!');
    }
  } catch (error) {
    console.log('❌ ERROR - empty data test:', error.message);
  }

  console.log('\n🏁 KONEC TESTOVÁNÍ');
}

testAdminLogin().catch(console.error);