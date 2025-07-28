const nodemailer = require('nodemailer');

async function testProductionEmail() {
  console.log('🚀 Test produkčního email systému doklad.ai\n');

  // Test přímo z aplikace stejně jako EmailService
  const transporter = nodemailer.createTransport({
    host: 'email-smtp.eu-north-1.amazonaws.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log('📧 Konfigurace:');
  console.log('Host: email-smtp.eu-north-1.amazonaws.com:587');
  console.log('User:', process.env.SMTP_USER);
  console.log('From: noreply@doklad.ai');

  try {
    // Test připojení
    console.log('\n🔍 Test SMTP připojení...');
    await transporter.verify();
    console.log('✅ SMTP připojení úspěšné!');

    // Odeslání testovacího emailu
    console.log('\n📨 Odesílání testovacího emailu...');
    const result = await transporter.sendMail({
      from: 'noreply@doklad.ai',
      to: 'test@example.com',
      subject: 'Doklad.ai - Email systém je funkční!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #f97316;">🎉 Doklad.ai Email Systém</h2>
          <p>✅ Email systém je plně funkční a připraven k použití!</p>
          <p>📧 <strong>Odesláno:</strong> ${new Date().toLocaleString('cs-CZ')}</p>
          <p>🚀 <strong>Server:</strong> Amazon SES (eu-north-1)</p>
          <p>🔐 <strong>Doména:</strong> doklad.ai (verifikovaná)</p>
          <hr style="margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Tento email byl automaticky odeslán z testovacího systému doklad.ai
          </p>
        </div>
      `,
    });

    console.log('✅ Email úspěšně odeslán!');
    console.log('📧 Message ID:', result.messageId);
    console.log('🎯 STATUS: DOKLAD.AI EMAIL SYSTÉM JE PLNĚ FUNKČNÍ! ✅');

  } catch (error) {
    console.log('❌ Chyba:', error.message);
    
    if (error.message.includes('535')) {
      console.log('\n💡 Možné řešení:');
      console.log('1. Zkontrolujte, že doména doklad.ai je verifikovaná v AWS SES');
      console.log('2. Ověřte SMTP credentials v AWS SES console');
      console.log('3. Ujistěte se, že SES není v sandbox módu');
    }
  }
}

testProductionEmail().catch(console.error);