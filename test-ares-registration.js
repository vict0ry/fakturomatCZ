#!/usr/bin/env node

/**
 * TEST ARES INTEGRACE V REGISTRACI
 */

console.log('🏢 TEST ARES INTEGRACE V REGISTRACI');
console.log('=================================');

async function testAresRegistration() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Test ARES API s reálným IČO
    console.log('1. 📋 Testování ARES API s reálným IČO...');
    
    const testIco = '72080043'; // Google Czech Republic s.r.o.
    const aresResponse = await fetch(`${baseUrl}/api/test/ares/${testIco}`);
    
    if (aresResponse.ok) {
      const aresData = await aresResponse.json();
      console.log('✅ ARES API funkční!');
      console.log(`   Název: ${aresData.data?.name || 'N/A'}`);
      console.log(`   Adresa: ${aresData.data?.address || 'N/A'}`);
      console.log(`   Město: ${aresData.data?.city || 'N/A'}`);
      console.log(`   DIČ: ${aresData.data?.dic || 'N/A'}`);
      
      // Test registrace s ARES údaji
      console.log('');
      console.log('2. 👤 Test registrace s ARES údaji...');
      
      const timestamp = Date.now();
      const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            firstName: 'ARES',
            lastName: 'Test',
            email: `ares-test-${timestamp}@test.com`,
            password: 'test123456',
            username: `ares-test-${timestamp}@test.com`
          },
          company: {
            name: aresData.data?.name || 'Test Company',
            ico: testIco,
            dic: aresData.data?.dic || '',
            address: aresData.data?.address || '',
            city: aresData.data?.city || '',
            postalCode: aresData.data?.postalCode || ''
          }
        })
      });
      
      if (registerResponse.ok) {
        console.log('✅ Registrace s ARES údaji úspěšná!');
        console.log('');
        console.log('🎯 ARES INTEGRACE FUNGUJE!');
        console.log('========================');
        console.log('✅ ARES API načítá reálné údaje');
        console.log('✅ Registrace přijímá ARES údaje');
        console.log('✅ Frontend může automaticky vyplnit formulář');
        
      } else {
        const errorText = await registerResponse.text();
        console.log(`❌ Registrace s ARES údaji selhala: ${registerResponse.status}`);
        console.log(`   Error: ${errorText}`);
      }
      
    } else {
      console.log(`❌ ARES API selhalo: ${aresResponse.status}`);
      const errorText = await aresResponse.text();
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

testAresRegistration();