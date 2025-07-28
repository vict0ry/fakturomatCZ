#!/usr/bin/env node

/**
 * 📧 EMAIL DELIVERY TEST
 * 
 * Testuje specificky Amazon SES email delivery funkcionalitu
 */

const TEST_EMAIL = 'mail@victoreliot.com';
const BASE_URL = 'http://localhost:5000';

async function testEmailDelivery() {
  console.log('📧 TESTOVÁNÍ EMAIL DELIVERY SYSTÉMU');
  console.log('=' .repeat(50));
  console.log();

  // Test 1: Check email service status
  console.log('🔍 Krok 1: Kontrola stavu email služby');
  console.log('Očekávané logy při startu serveru:');
  console.log('   ✅ SMTP: ✅ Configured');
  console.log('   ✅ From: noreply@doklad.ai');
  console.log('   ✅ Server: email-smtp.eu-north-1.amazonaws.com:587');
  console.log();

  // Test 2: Send password reset email
  console.log('📨 Krok 2: Odesílání password reset emailu');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL })
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, data);
    
    if (response.status === 200) {
      console.log('✅ Email request úspěšný');
      
      if (data.developmentToken) {
        console.log(`🎯 Development token: ${data.developmentToken}`);
        console.log('✅ Token generován pro testování');
      }
      
      console.log();
      console.log('📬 Očekávané akce:');
      console.log('1. Email dorazí na mail@victoreliot.com');
      console.log('2. Email bude od noreply@doklad.ai');
      console.log('3. Email obsahuje reset link s tokenem');
      console.log('4. V server logu: "✅ Password reset email sent"');
      
    } else {
      console.log('❌ Email request selhal');
    }

  } catch (error) {
    console.log('❌ Chyba při odesílání emailu:', error.message);
  }

  console.log();
  console.log('🔧 KONTROLNÍ BODY PRO TESTERA:');
  console.log();
  console.log('Amazon SES Status:');
  console.log('□ Server logy ukazují "✅ SMTP: ✅ Configured"');
  console.log('□ Email service používá email-smtp.eu-north-1.amazonaws.com');
  console.log('□ From adresa je noreply@doklad.ai');
  console.log();
  console.log('Email Delivery:');
  console.log('□ Email skutečně dorazil na testovací adresu');
  console.log('□ Email má správné headers (From, Message-ID, atd.)');
  console.log('□ Email obsahuje funkční reset link');
  console.log('□ Email má profesionální formátování');
  console.log();
  console.log('Development Mode:');
  console.log('□ API response obsahuje developmentToken');
  console.log('□ Token má správnou délku (32+ znaků)');
  console.log('□ Server logy jsou transparentní a informativné');
  console.log();
  console.log('Error Handling:');
  console.log('□ Neexistující email nevyvolá chybu (bezpečnost)');
  console.log('□ Prázdný email vrátí 400 error');
  console.log('□ Malformed JSON vrátí správnou chybu');
}

testEmailDelivery().catch(console.error);