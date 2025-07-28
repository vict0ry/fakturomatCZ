#!/usr/bin/env node

import nodemailer from 'nodemailer';

async function testCurrentStatus() {
  console.log('🧪 Test současného stavu email systému\n');

  console.log('📋 Environment Variables:');
  console.log('SMTP_USER:', process.env.SMTP_USER || 'NENÍ NASTAVENO');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'NASTAVENO' : 'NENÍ NASTAVENO');
  console.log('AWS_SES_REGION:', process.env.AWS_SES_REGION || 'NENÍ NASTAVENO');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n❌ SMTP credentials nejsou správně nastavené');
    console.log('💡 Potřebujeme nové Amazon SES SMTP credentials');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'email-smtp.eu-north-1.amazonaws.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    console.log('\n🔍 Test SMTP připojení...');
    await transporter.verify();
    console.log('✅ SMTP připojení úspěšné!');
    
    console.log('\n📧 Email systém je připraven k použití');
    console.log('🎯 Status: FUNKČNÍ pro development testování');

  } catch (error) {
    console.log('\n❌ SMTP test selhal:', error.message);
    
    if (error.message.includes('535')) {
      console.log('\n🔧 Řešení:');
      console.log('1. Vygenerovat nové SMTP credentials v AWS SES Console');
      console.log('2. Nastavit správné SMTP_USER a SMTP_PASS environment variables');
      console.log('3. SMTP_USER by měl začínat "AKIA..." (jako Access Key)');
    }
  }
}

testCurrentStatus().catch(console.error);