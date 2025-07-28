import nodemailer from 'nodemailer';

console.log('🧪 TESTOVÁNÍ AMAZON SES PŘIPOJENÍ');
console.log('=================================');
console.log('');

// Zkontrolovat environment variables
const hasAmazonSES = !!(process.env.AWS_SES_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

console.log('📋 Environment Variables:');
console.log(`   AWS_SES_REGION: ${process.env.AWS_SES_REGION || 'NOT SET'}`);
console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? 'SET (' + process.env.AWS_ACCESS_KEY_ID.substring(0,10) + '...)' : 'NOT SET'}`);
console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'}`); 
console.log(`   SES_FROM_EMAIL: ${process.env.SES_FROM_EMAIL || 'NOT SET'}`);
console.log('');

if (!hasAmazonSES) {
  console.log('❌ Amazon SES není kompletně nakonfigurován');
  process.exit(1);
}

// Vytvořit transporter
const transporter = nodemailer.createTransporter({
  host: `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com`,
  port: 587,
  secure: false,
  auth: {
    user: process.env.AWS_ACCESS_KEY_ID,
    pass: process.env.AWS_SECRET_ACCESS_KEY,
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log('🔌 Testuji SMTP připojení...');

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP připojení selhalo:');
    console.log('   Error:', error.message);
    console.log('');
    console.log('🔧 Možné příčiny:');
    console.log('   • Nesprávné AWS credentials');
    console.log('   • Region není podporován pro SMTP');
    console.log('   • SES doména není verifikována');
    console.log('   • Account je v sandbox módu');
  } else {
    console.log('✅ SMTP připojení úspěšné!');
    console.log('');
    
    // Test odeslání emailu
    console.log('📧 Testuji odeslání emailu...');
    
    const mailOptions = {
      from: process.env.SES_FROM_EMAIL || 'noreply@doklad.ai',
      to: 'mail@victoreliot.com',
      subject: 'Test Amazon SES - Doklad.ai',
      html: `
        <h2>✅ Amazon SES Test Successful!</h2>
        <p>Tento email byl úspěšně odeslán přes Amazon SES.</p>
        <p><strong>Server:</strong> email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com</p>
        <p><strong>From:</strong> ${process.env.SES_FROM_EMAIL || 'noreply@doklad.ai'}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('❌ Email se nepodařilo odeslat:');
        console.log('   Error:', error.message);
      } else {
        console.log('✅ Email úspěšně odeslán!');
        console.log('   Message ID:', info.messageId);
        console.log('   Response:', info.response);
      }
      console.log('');
      console.log('📧 Zkontrolujte schránku mail@victoreliot.com');
    });
  }
});