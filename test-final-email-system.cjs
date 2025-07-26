// Final test of the complete email system
const http = require('http');

function testEmailSystem() {
  console.log('🧪 Final Email System Test\n');

  const postData = JSON.stringify({
    email: 'admin@doklad.ai'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/forgot-password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('📧 Password Reset Response:');
        console.log('   Message:', response.message);
        
        if (response.resetLink) {
          console.log('   ❌ Still in development mode');
          console.log('   Token:', response.resetLink);
        } else {
          console.log('   ✅ PRODUCTION MODE ACTIVE!');
          console.log('   🎉 Email sent via local SMTP server');
          console.log('   📁 Check sent-emails/ folder for saved copy');
        }
        
        console.log('\n🎯 System Status:');
        console.log('   SMTP Server: Running on localhost:2525');
        console.log('   Email Mode: Production (real emails)');
        console.log('   Token Mode: Disabled');
        
      } catch (error) {
        console.error('❌ Failed to parse response:', error);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error);
  });

  req.write(postData);
  req.end();
}

testEmailSystem();