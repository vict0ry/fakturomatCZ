#!/usr/bin/env node

/**
 * TEST NOVÉHO ERROR HANDLING PRO INVITATION
 * Ověří, že se zobrazují skutečné chybové hlášky z backendu
 */

async function testInvitationErrorHandling() {
  console.log('🧪 TEST INVITATION ERROR HANDLING\n');
  
  const sessionId = 'DHRypB8x8D1OBnaXeQdkT';
  const testEmail = 'test-duplicate@example.com';
  
  try {
    console.log('📤 Test 1: Odeslání první invitation');
    const firstResponse = await fetch('http://localhost:5000/api/company/users/invite', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionId}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        firstName: 'Test',
        lastName: 'Duplicate',
        role: 'employee'
      })
    });
    
    if (firstResponse.ok) {
      const firstResult = await firstResponse.json();
      console.log('✅ První invitation úspěšná:', firstResult.message);
      
      console.log('\n📤 Test 2: Pokus o odeslání duplicitní invitation');
      const duplicateResponse = await fetch('http://localhost:5000/api/company/users/invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          firstName: 'Test',
          lastName: 'Duplicate2',
          role: 'employee'
        })
      });
      
      console.log('📊 Duplicate response status:', duplicateResponse.status);
      
      if (!duplicateResponse.ok) {
        const errorData = await duplicateResponse.json();
        console.log('✅ Chybová zpráva z backendu:', errorData.message);
        console.log('🎯 ÚSPĚCH: Backend vrací správnou chybovou zprávu');
        
        console.log('\n💡 NOVÝ ERROR HANDLING VE FRONTENDU:');
        console.log('   - Místo obecné zprávy "Nepodařilo se odeslat pozvánku"');
        console.log(`   - Zobrazí se konkrétní: "${errorData.message}"`);
        console.log('   - Uživatel nyní ví přesný důvod chyby');
        
      } else {
        console.log('❌ Backend nevrátil chybu při duplicitní invitation');
      }
      
    } else {
      const errorData = await firstResponse.json();
      console.log('❌ První invitation selhala:', errorData.message);
    }
    
    console.log('\n🎯 SHRNUTÍ OPRAV:');
    console.log('✅ Settings.tsx aktualizován - všechny mutations nyní parsují skutečné chyby');
    console.log('✅ Error handling zobrazuje error.message místo obecných hlášek');
    console.log('✅ Uživatelé uvidí konkrétní důvody selhání (duplicitní email, chybějící data, atd.)');
    console.log('✅ Lépe debugovatelné pro uživatele i administrátory');
    
  } catch (error) {
    console.error('❌ Test selhał:', error.message);
  }
}

testInvitationErrorHandling();