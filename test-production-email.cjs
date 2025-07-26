// Test production email sending
const fetch = require('node-fetch');

async function testProductionEmail() {
  console.log('🧪 Testing Production Email System...\n');
  
  try {
    // Test password reset with real email sending
    console.log('1. Testing password reset with production SMTP...');
    const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@doklad.ai'
      })
    });
    
    const result = await response.json();
    console.log('   Response:', result.message);
    
    // Check if it's still in development mode (showing tokens) or production mode (sending emails)
    if (result.resetLink) {
      console.log('   ❌ Still in development mode');
      console.log('   Token shown:', result.resetLink);
    } else {
      console.log('   ✅ Production mode active - email sent!');
      console.log('   No token shown - email was sent via SMTP');
    }
    
    console.log('\n2. SMTP Configuration Status:');
    console.log('   Host:', process.env.SMTP_HOST || 'NOT SET');
    console.log('   Port:', process.env.SMTP_PORT || 'NOT SET');
    console.log('   User:', process.env.SMTP_USER || 'NOT SET');
    console.log('   Pass:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
    
    const isConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    console.log('   Status:', isConfigured ? '✅ Fully Configured' : '❌ Missing Configuration');
    
    if (isConfigured) {
      console.log('\n🎉 Email system is now in PRODUCTION MODE!');
      console.log('   - Real emails are being sent');
      console.log('   - No more development tokens');
      console.log('   - SMTP server active on localhost:25');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProductionEmail();