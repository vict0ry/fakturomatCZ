#!/usr/bin/env node

import nodemailer from 'nodemailer';

async function sendViaLocal() {
  console.log('📧 Odesílání přes lokální SMTP server...\n');

  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 2525,
    secure: false,
  });

  try {
    const result = await transporter.sendMail({
      from: 'noreply@doklad.ai',
      to: 'mail@victoreliot.com',
      subject: 'Test z doklad.ai (lokální SMTP)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #f97316;">📧 Doklad.ai Local SMTP Test</h2>
          <p>Email pro mail@victoreliot.com byl úspěšně zpracován!</p>
          <p><strong>Server:</strong> localhost:2525</p>
          <p><strong>Čas:</strong> ${new Date().toLocaleString('cs-CZ')}</p>
          <p><strong>Uloženo do:</strong> sent-emails/ složky</p>
          <p>Toto je důkaz, že email systém doklad.ai funguje správně.</p>
        </div>
      `,
    });

    console.log('✅ Email zpracován lokálně!');
    console.log('📧 Message ID:', result.messageId);
    console.log('💾 Uloženo do sent-emails/ složky');
    console.log('🎯 Lokální email systém funguje!');

  } catch (error) {
    console.log('❌ Chyba:', error.message);
  }
}

sendViaLocal().catch(console.error);