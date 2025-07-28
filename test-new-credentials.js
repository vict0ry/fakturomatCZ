#!/usr/bin/env node

import nodemailer from 'nodemailer';

async function testNewCredentials() {
  console.log('🔧 Test nových Amazon SES SMTP credentials\n');

  const newCredentials = {
    user: 'AKIA3AIIBQDYVZ2P7VEP',
    pass: 'BKBN+yP6MRTBnyCFJGEHAXZjzR+IUSLw0tJG7p+WdmTG'
  };

  const transporter = nodemailer.createTransport({
    host: 'email-smtp.eu-north-1.amazonaws.com',
    port: 587,
    secure: false,
    auth: newCredentials,
  });

  try {
    console.log('🔍 Test SMTP připojení s novými credentials...');
    await transporter.verify();
    console.log('✅ SMTP připojení úspěšné!');

    console.log('\n📧 Odesílání testovacího emailu na mail@victoreliot.com...');
    const result = await transporter.sendMail({
      from: 'noreply@doklad.ai',
      to: 'mail@victoreliot.com',
      subject: 'SUCCESS: Amazon SES funguje!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">
            ✅ Amazon SES Email Systém FUNGUJE!
          </h2>
          
          <p>Ahoj!</p>
          
          <p><strong>Skvělá zpráva!</strong> Amazon SES email systém doklad.ai je nyní plně funkční.</p>
          
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="margin-top: 0; color: #15803d;">🎯 Úspěšně opraveno:</h3>
            <ul style="margin: 0;">
              <li>✅ SMTP credentials aktualizovány</li>
              <li>✅ Server: email-smtp.eu-north-1.amazonaws.com:587</li>
              <li>✅ Doména: doklad.ai (verifikovaná)</li>
              <li>✅ Čas odeslání: ${new Date().toLocaleString('cs-CZ')}</li>
            </ul>
          </div>
          
          <p>Email systém je připraven pro produkční použití!</p>
          
          <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 14px;">
            Doklad.ai - AI-powered fakturace pro české firmy<br>
            <a href="https://doklad.ai" style="color: #f97316;">doklad.ai</a>
          </p>
        </div>
      `,
    });

    console.log('🎉 EMAIL ÚSPĚŠNĚ ODESLÁN!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Příjemce: mail@victoreliot.com');
    console.log('🚀 Amazon SES email systém JE PLNĚ FUNKČNÍ!');

  } catch (error) {
    console.log('❌ Chyba:', error.message);
  }
}

testNewCredentials().catch(console.error);