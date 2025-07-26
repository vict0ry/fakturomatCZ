// Configure local SMTP server for doklad.ai
const nodemailer = require('nodemailer');
const fs = require('fs');

console.log('🚀 Konfigurace lokálního SMTP serveru pro doklad.ai');
console.log('==================================================');

// Set up local SMTP configuration
const localSMTPConfig = {
  host: 'localhost',
  port: 25,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'noreply',
    pass: 'doklad2025'
  },
  tls: {
    rejectUnauthorized: false
  }
};

console.log('📧 Lokální SMTP konfigurace:');
console.log(`   Host: ${localSMTPConfig.host}`);
console.log(`   Port: ${localSMTPConfig.port}`);
console.log(`   User: ${localSMTPConfig.auth.user}`);
console.log(`   Pass: ***${localSMTPConfig.auth.pass.slice(-4)}`);

// Create transporter for testing
const transporter = nodemailer.createTransporter(localSMTPConfig);

// Test email sending function
async function testLocalSMTP() {
  try {
    console.log('\n🧪 Testování lokálního SMTP...');
    
    // Verify SMTP connection
    await transporter.verify();
    console.log('✅ SMTP server připojení úspěšné');
    
    // Send test email
    const testEmail = {
      from: 'noreply@doklad.ai',
      to: 'test@doklad.ai',
      subject: 'Test lokálního SMTP serveru',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b35;">Doklad.ai - Test SMTP</h2>
          <p>Tento email byl odeslán z lokálního SMTP serveru.</p>
          <p><strong>Datum:</strong> ${new Date().toLocaleString('cs-CZ')}</p>
          <p><strong>Server:</strong> localhost:25</p>
          <p>Lokální SMTP server je nyní plně funkční! 🎉</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email odeslán:', info.messageId);
    
    return true;
  } catch (error) {
    console.error('❌ SMTP test failed:', error.message);
    return false;
  }
}

// Export configuration for use in main application
const envConfig = `
# Local SMTP Configuration - Generated Server
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_USER=noreply
SMTP_PASS=doklad2025
SMTP_FROM_NAME=Doklad.ai

# DKIM Configuration (using generated keys)
DKIM_DOMAIN=doklad.ai
DKIM_SELECTOR=default
DKIM_PRIVATE_KEY="${fs.readFileSync('dkim_private.key', 'utf8').replace(/\n/g, '\\n')}"
`;

console.log('\n📝 Environment konfigurace pro .env:');
console.log(envConfig);

console.log('\n🔧 Pro aktivaci proveďte:');
console.log('1. sudo ./setup-local-smtp.sh');
console.log('2. Nastavte environment proměnné výše');
console.log('3. Restartujte aplikaci');
console.log('4. node configure-local-smtp.js (pro test)');

// Run test if called directly
if (require.main === module) {
  testLocalSMTP();
}

module.exports = { localSMTPConfig, testLocalSMTP };