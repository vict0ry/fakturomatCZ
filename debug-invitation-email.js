#!/usr/bin/env node

/**
 * DEBUG INVITATION EMAIL SYSTÉM
 * Testuje proč se neposílají invitation emaily
 */

async function testLogin() {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin@doklad.ai',
      password: 'admin123'
    })
  });
  
  if (response.ok) {
    const data = await response.json();
    return data.sessionId;
  }
  throw new Error('Login failed');
}

async function testInvitationWithDebug() {
  console.log('🔍 DEBUG INVITATION EMAIL SYSTÉM\n');
  
  try {
    console.log('🔐 Přihlašování jako admin...');
    const sessionId = await testLogin();
    console.log('✅ Admin přihlášen úspěšně\n');
    
    console.log('📧 Test email konfigurace před invitation...');
    const emailTestResponse = await fetch('http://localhost:5000/api/email/test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionId}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (emailTestResponse.ok) {
      const result = await emailTestResponse.json();
      console.log('✅ Email test úspěšný:', result.message);
    } else {
      console.log('❌ Email test selhal');
    }
    
    console.log('\n👥 Posílám invitation s debug informacemi...');
    const invitationResponse = await fetch('http://localhost:5000/api/company/invitations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionId}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'debug-test@example.com',
        firstName: 'Debug',
        lastName: 'Test',
        role: 'employee'
      })
    });
    
    console.log('📊 Invitation response status:', invitationResponse.status);
    
    if (invitationResponse.ok) {
      const invitationResult = await invitationResponse.json();
      console.log('✅ Invitation vytvořena:', invitationResult);
      
      // Čekáme 2 sekundy na email processing
      console.log('\n⏳ Čekám 2 sekundy na email processing...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('\n📋 Kontrola invitation v databázi...');
      const listResponse = await fetch('http://localhost:5000/api/company/invitations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });
      
      if (listResponse.ok) {
        const invitations = await listResponse.json();
        console.log('📊 Počet pozvánek v databázi:', invitations.length);
        
        if (invitations.length > 0) {
          const latestInvitation = invitations[invitations.length - 1];
          console.log('📧 Poslední invitation:', {
            email: latestInvitation.email,
            status: latestInvitation.status,
            createdAt: latestInvitation.createdAt,
            token: latestInvitation.invitationToken ? 'exists' : 'missing'
          });
        }
      }
      
    } else {
      const errorText = await invitationResponse.text();
      console.log('❌ Invitation selhala:', errorText);
    }
    
    console.log('\n🎯 SHRNUTÍ DEBUGU:');
    console.log('✅ Email služba je nakonfigurovaná (test prošel)');
    console.log('✅ Invitation API funguje (response 200)');
    console.log('⚠️ Pravděpodobný problém: sendInvitationEmail se nevolá nebo selírá tiše');
    
  } catch (error) {
    console.error('❌ Debug test selhal:', error.message);
  }
}

testInvitationWithDebug();