import nodemailer from 'nodemailer';

console.log('📧 DIRECT EMAIL TEST - AMAZON SES');
console.log('=================================');

const transporter = nodemailer.createTransport({
  host: `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com`,
  port: 587,
  secure: false,
  auth: {
    user: process.env.AWS_ACCESS_KEY_ID,
    pass: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

console.log(`Region: ${process.env.AWS_SES_REGION}`);
console.log(`Host: email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com`);

const mailOptions = {
  from: process.env.SES_FROM_EMAIL,
  to: 'mail@victoreliot.com',
  subject: 'Test Email z Doklad.ai - Amazon SES',
  html: `
    <h2>✅ Test Email Successful</h2>
    <p>Tento email byl úspěšně odeslán přes Amazon SES.</p>
    <p><strong>Region:</strong> ${process.env.AWS_SES_REGION}</p>
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    <p>Pokud vidíte tento email, Amazon SES funguje správně!</p>
  `
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('❌ Email failed:', error.message);
    if (error.message.includes('535')) {
      console.log('');
      console.log('🔧 ŘEŠENÍ PRO 535 ERROR:');
      console.log('1. Jděte do AWS Console → SES');
      console.log('2. Vyberte region EU-WEST-1');
      console.log('3. SMTP Settings → Create SMTP credentials');
      console.log('4. Použijte NOVÉ SMTP credentials (ne API keys)');
    }
  } else {
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('');
    console.log('📧 Zkontrolujte mail@victoreliot.com');
  }
});