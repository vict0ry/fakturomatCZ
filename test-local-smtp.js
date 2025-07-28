#!/usr/bin/env node

import nodemailer from 'nodemailer';

async function testLocalSMTP() {
  console.log('🏠 Test lokálního SMTP serveru pro development\n');

  // Test lokálního SMTP serveru běžícího na portu 2525
  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 2525,
    secure: false,
    // Žádná autentifikace pro lokální server
  });

  try {
    console.log('🔍 Test připojení na localhost:2525...');
    await transporter.verify();
    console.log('✅ Lokální SMTP server je dostupný!');

    console.log('\n📧 Odesílání testovacího emailu...');
    const result = await transporter.sendMail({
      from: 'noreply@doklad.ai',
      to: 'test@example.com',
      subject: 'Test z lokálního SMTP serveru',
      html: `
        <h2>🏠 Doklad.ai Development Email</h2>
        <p>✅ Lokální SMTP server funguje!</p>
        <p>📧 Odesláno: ${new Date().toLocaleString('cs-CZ')}</p>
        <p>🔧 Mode: Development (localhost:2525)</p>
        <p>💾 Email se ukládá do sent-emails/ složky</p>
      `,
    });

    console.log('✅ Email úspěšně odeslán!');
    console.log('📧 Message ID:', result.messageId);
    console.log('💾 Email uložen do: sent-emails/');
    console.log('🎯 STATUS: Development email systém funguje!');

  } catch (error) {
    console.log('❌ Lokální SMTP test selhal:', error.message);
    console.log('💡 Zkontrolujte, že aplikace běží (npm run dev)');
  }
}

testLocalSMTP().catch(console.error);