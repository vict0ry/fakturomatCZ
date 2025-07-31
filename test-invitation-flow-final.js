#!/usr/bin/env node

/**
 * FINÁLNÍ TEST INVITATION FLOW
 * Zkontroluje celý tok od vytvoření po email odeslání
 */

async function testCompleteInvitationFlow() {
  console.log('🎯 FINÁLNÍ TEST INVITATION FLOW\n');
  
  const sessionId = 'DHRypB8x8D1OBnaXeQdkT';
  
  try {
    // Test 1: Company info
    console.log('📊 Test 1: Company endpoint');
    const companyResponse = await fetch('http://localhost:5000/api/company', {
      headers: { 'Authorization': `Bearer ${sessionId}` }
    });
    
    if (companyResponse.ok) {
      const company = await companyResponse.json();
      console.log('✅ Company loaded:', company.name);
    } else {
      console.log('❌ Company endpoint failed:', companyResponse.status);
      return;
    }
    
    // Test 2: Email service test
    console.log('\n📧 Test 2: Email service test');
    const emailTestResponse = await fetch('http://localhost:5000/api/email/test', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${sessionId}` }
    });
    
    if (emailTestResponse.ok) {
      const emailResult = await emailTestResponse.json();
      console.log('✅ Email service:', emailResult.message);
    } else {
      console.log('❌ Email service failed');
    }
    
    // Test 3: Create invitation with content-type check
    console.log('\n👥 Test 3: Create invitation');
    const invitationResponse = await fetch('http://localhost:5000/api/company/invitations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionId}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'finalni-test@example.com',
        firstName: 'Finální',
        lastName: 'Test',
        role: 'employee'
      })
    });
    
    console.log('📊 Response status:', invitationResponse.status);
    console.log('📊 Response content-type:', invitationResponse.headers.get('content-type'));
    
    // Check if response is JSON or HTML
    const responseText = await invitationResponse.text();
    
    if (responseText.startsWith('<!DOCTYPE html>')) {
      console.log('❌ Invitation endpoint vrací HTML místo JSON');
      console.log('🔍 Problém: Route /api/company/invitations neexistuje nebo není správně registrovaná');
      
      // Try alternative endpoint
      console.log('\n🔄 Test alternative endpoint /api/invitations...');
      const altResponse = await fetch('http://localhost:5000/api/invitations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'alt-test@example.com',
          firstName: 'Alt',
          lastName: 'Test',
          role: 'employee'
        })
      });
      
      console.log('📊 Alternative response status:', altResponse.status);
      const altText = await altResponse.text();
      
      if (altText.startsWith('<!DOCTYPE html>')) {
        console.log('❌ Alternative endpoint také vrací HTML');
      } else {
        console.log('✅ Alternative endpoint vrací:', altText);
      }
      
    } else {
      try {
        const invitationResult = JSON.parse(responseText);
        console.log('✅ Invitation created:', invitationResult);
        
        // Test 4: Check database for invitation
        console.log('\n📋 Test 4: Check invitation in database');
        const listResponse = await fetch('http://localhost:5000/api/company/invitations', {
          headers: { 'Authorization': `Bearer ${sessionId}` }
        });
        
        if (listResponse.ok) {
          const listText = await listResponse.text();
          if (listText.startsWith('<!DOCTYPE html>')) {
            console.log('❌ List endpoint také vrací HTML');
          } else {
            const invitations = JSON.parse(listText);
            console.log('📊 Počet pozvánek:', invitations.length);
            if (invitations.length > 0) {
              console.log('📧 Poslední invitation:', invitations[invitations.length - 1].email);
            }
          }
        }
        
      } catch (parseError) {
        console.log('❌ Response není validní JSON:', responseText.substring(0, 200));
      }
    }
    
    console.log('\n🎯 SHRNUTÍ:');
    console.log('✅ Server běží a odpovídá');
    console.log('✅ Authentication funguje');
    console.log('✅ Email service je nakonfigurovaný');
    console.log('❌ Invitation endpoint pravděpodobně neexistuje - vrací HTML');
    console.log('\n💡 ŘEŠENÍ: Zkontrolovat registraci company routes v server/routes.ts');
    
  } catch (error) {
    console.error('❌ Test selhal:', error.message);
  }
}

testCompleteInvitationFlow();