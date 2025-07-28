#!/usr/bin/env node

import nodemailer from 'nodemailer';

async function sendTestEmail() {
  console.log('📧 Odesílání testovacího emailu přes Amazon SES...\n');

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
    const result = await transporter.sendMail({
      from: 'noreply@doklad.ai',
      to: 'mail@victoreliot.com',
      subject: 'Test z doklad.ai Amazon SES',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
            📧 Doklad.ai Email Test
          </h2>
          
          <p>Ahoj!</p>
          
          <p>Tento email byl úspěšně odeslán z doklad.ai systému přes <strong>Amazon SES</strong>.</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">📋 Detaily:</h3>
            <ul style="margin: 0;">
              <li><strong>Server:</strong> email-smtp.eu-north-1.amazonaws.com:587</li>
              <li><strong>Doména:</strong> doklad.ai (verifikovaná)</li>
              <li><strong>Čas odeslání:</strong> ${new Date().toLocaleString('cs-CZ')}</li>
              <li><strong>Mode:</strong> Amazon SES Development</li>
            </ul>
          </div>
          
          <p>Pokud tento email dostáváte, znamená to, že email systém <strong>funguje správně</strong>!</p>
          
          <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 14px;">
            Tento email byl automaticky odeslán z testovacího systému doklad.ai<br>
            <a href="https://doklad.ai" style="color: #f97316;">doklad.ai</a> - AI-powered fakturace pro české firmy
          </p>
        </div>
      `,
    });

    console.log('✅ Email úspěšně odeslán!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Příjemce: mail@victoreliot.com');
    console.log('🎯 Amazon SES email systém JE FUNKČNÍ!');

  } catch (error) {
    console.log('❌ Chyba při odesílání:', error.message);
    
    if (error.message.includes('535')) {
      console.log('\n💡 SMTP credentials stále nejsou správné');
      console.log('Potřeba aktualizovat SMTP_USER a SMTP_PASS z AWS SES Console');
    } else if (error.message.includes('554')) {
      console.log('\n💡 Email address není verified v SES sandbox módu');
      console.log('V sandbox můžete posílat pouze na verified adresy');
    }
  }
}

sendTestEmail().catch(console.error);