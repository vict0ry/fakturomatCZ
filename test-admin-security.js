#!/usr/bin/env node

const BASE_URL = 'http://localhost:5000';

async function testAdminSecurity() {
  console.log('🛡️  TESTOVÁNÍ ADMIN BEZPEČNOSTI');
  console.log('================================\n');

  // Test 1: Přístup na /admin bez přihlášení
  console.log('1️⃣ Test přístupu na admin panel bez přihlášení');
  try {
    const response = await fetch(`${BASE_URL}/admin`);
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('❌ BEZPEČNOSTNÍ RIZIKO - Admin panel je přístupný bez přihlášení!');
    } else {
      console.log('✅ Správně blokováno - Admin panel vyžaduje přihlášení');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log();

  // Test 2: API endpointy bez autentifikace
  console.log('2️⃣ Test admin API endpointů bez autentifikace');
  
  const adminEndpoints = [
    '/api/admin/users/stats',
    '/api/admin/revenue/stats', 
    '/api/admin/system/health',
    '/api/admin/users/recent'
  ];

  for (const endpoint of adminEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      
      if (response.status === 401 || response.status === 403) {
        console.log(`✅ ${endpoint} - Správně zabezpečeno (${response.status})`);
      } else {
        console.log(`❌ ${endpoint} - BEZPEČNOSTNÍ RIZIKO (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - ERROR: ${error.message}`);
    }
  }

  console.log();

  // Test 3: Admin přihlášení
  console.log('3️⃣ Test admin přihlášení');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin@doklad.ai',
        password: 'admin123'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Admin přihlášení úspěšné');
      console.log(`   SessionId: ${loginData.sessionId}`);
      console.log(`   Role: ${loginData.user.role}`);
      
      // Test 4: Přístup k admin API s autentifikací
      console.log('\n4️⃣ Test admin API s autentifikací');
      
      for (const endpoint of adminEndpoints) {
        try {
          const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${loginData.sessionId}`
            }
          });
          
          if (response.ok) {
            console.log(`✅ ${endpoint} - Úspěšný přístup s autentifikací`);
          } else {
            console.log(`❌ ${endpoint} - Stále blokováno i s autentifikací (${response.status})`);
          }
        } catch (error) {
          console.log(`❌ ${endpoint} - ERROR: ${error.message}`);
        }
      }
      
    } else {
      console.log('❌ Admin přihlášení selhalo');
    }
  } catch (error) {
    console.log('❌ ERROR při admin přihlášení:', error.message);
  }

  console.log('\n================================');
  console.log('📊 BEZPEČNOSTNÍ AUDIT DOKONČEN');
  console.log('================================');
}

testAdminSecurity().catch(console.error);