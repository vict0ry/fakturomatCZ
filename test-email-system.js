#!/usr/bin/env node

import nodemailer from 'nodemailer';

async function testEmailSystem() {
  console.log('🔧 Testování doklad.ai email systému...\n');
  
  // Test 1: Základní SMTP připojení
  console.log('1️⃣ Test SMTP připojení:');
  const transporter = nodemailer.createTransport({
    host: 'email-smtp.eu-north-1.amazonaws.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP připojení úspěšné');
  } catch (error) {
    console.log('❌ SMTP připojení selhalo:', error.message);
    
    if (error.message.includes('535')) {
      console.log('💡 Možné příčiny:');
      console.log('   - Doména doklad.ai ještě není plně propagovaná v DNS');
      console.log('   - SMTP credentials jsou nesprávné');
      console.log('   - SES je stále v sandbox módu');
    }
    return;
  }

  // Test 2: Odeslání testovacího emailu
  console.log('\n2️⃣ Test odeslání emailu:');
  try {
    const info = await transporter.sendMail({
      from: 'noreply@doklad.ai',
      to: 'test@example.com',
      subject: 'Test z verifikované doklad.ai domény',
      html: `
        <h2>Doklad.ai Email Systém</h2>
        <p>✅ Email systém je plně funkční!</p>
        <p>📧 Odesláno: ${new Date().toLocaleString('cs-CZ')}</p>
        <p>🚀 Amazon SES Production Mode</p>
      `
    });
    
    console.log('✅ Email úspěšně odeslán!');
    console.log('📧 Message ID:', info.messageId);
    console.log('🎯 Status: Doklad.ai email systém JE FUNKČNÍ');
    
  } catch (error) {
    console.log('❌ Odeslání selhalo:', error.message);
  }
}

testEmailSystem().catch(console.error);