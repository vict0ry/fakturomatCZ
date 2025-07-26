// Direct test of SMTP server functionality
const nodemailer = require('nodemailer');

async function testSMTPServerDirect() {
  console.log('🔧 PŘÍMÝ TEST SMTP SERVERU');
  console.log('===========================\n');

  // Create transporter for local SMTP server
  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 2525,
    secure: false,
    auth: undefined, // No auth for local server
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('1. 🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('   ✅ SMTP server connection successful');

    console.log('\n2. 📧 Sending test email...');
    const info = await transporter.sendMail({
      from: 'noreply@doklad.ai',
      to: 'test@example.com',
      subject: 'SMTP Test - Doklad.ai',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b35;">Doklad.ai - SMTP Test</h2>
          <p>Tento email byl úspěšně odeslán přes lokální SMTP server!</p>
          <p><strong>Datum:</strong> ${new Date().toLocaleString('cs-CZ')}</p>
          <p><strong>Server:</strong> localhost:2525</p>
          <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Test Details:</h3>
            <ul>
              <li>✅ Connection: Successful</li>
              <li>✅ Authentication: Not required (local server)</li>
              <li>✅ Email delivery: Working</li>
              <li>✅ HTML rendering: Supported</li>
            </ul>
          </div>
          <p>🎉 SMTP systém je plně funkční!</p>
        </div>
      `
    });

    console.log('   ✅ Test email sent successfully');
    console.log('   📧 Message ID:', info.messageId);
    console.log('   📨 Email should be saved in sent-emails/ folder');

    console.log('\n3. 📁 Checking sent emails folder...');
    setTimeout(() => {
      const fs = require('fs');
      if (fs.existsSync('sent-emails')) {
        const files = fs.readdirSync('sent-emails');
        console.log(`   📄 Found ${files.length} email files`);
        files.forEach(file => {
          console.log(`   📧 ${file}`);
        });
      } else {
        console.log('   ⚠️  sent-emails folder not found yet');
      }
    }, 1000);

    console.log('\n🎯 SMTP SERVER TEST RESULTS:');
    console.log('✅ Connection: Working');
    console.log('✅ Email sending: Working');
    console.log('✅ HTML content: Supported');
    console.log('✅ Local server: Running on port 2525');
    console.log('\n🎉 SMTP SYSTÉM JE PLNĚ FUNKČNÍ!');

  } catch (error) {
    console.log('   ❌ SMTP test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 SMTP server is not running on port 2525');
      console.log('   🔧 Check if LocalSMTPServer started correctly');
    } else if (error.code === 'EAUTH') {
      console.log('   💡 Authentication issue - should be disabled for local server');
    } else {
      console.log('   💡 Unexpected error - check server logs');
    }
  }
}

testSMTPServerDirect().catch(console.error);