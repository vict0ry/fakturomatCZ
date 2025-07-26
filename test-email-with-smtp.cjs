// Test script to verify email functionality with SMTP
const fetch = require('node-fetch');

async function testEmailSystem() {
  console.log('🧪 Testing Email System...\n');
  
  try {
    // Test 1: Password Reset (should work in dev mode)
    console.log('1. Testing password reset...');
    const resetResponse = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@doklad.ai'
      })
    });
    
    const resetResult = await resetResponse.json();
    console.log('   Result:', resetResult.message);
    
    if (resetResult.resetLink) {
      console.log('   Token mode: Development (no SMTP)');
      console.log('   Reset link:', resetResult.resetLink);
    } else {
      console.log('   Email mode: Production (SMTP active)');
    }
    
    console.log('\n2. Checking SMTP configuration...');
    
    // Check if SMTP env vars are set
    const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    const dkimConfigured = process.env.DKIM_DOMAIN && process.env.DKIM_SELECTOR && process.env.DKIM_PRIVATE_KEY;
    
    console.log('   SMTP Host:', process.env.SMTP_HOST || 'NOT SET');
    console.log('   SMTP User:', process.env.SMTP_USER || 'NOT SET');
    console.log('   SMTP Pass:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
    console.log('   DKIM Domain:', process.env.DKIM_DOMAIN || 'NOT SET');
    console.log('   DKIM Selector:', process.env.DKIM_SELECTOR || 'NOT SET');
    console.log('   DKIM Key:', process.env.DKIM_PRIVATE_KEY ? '***SET***' : 'NOT SET');
    
    console.log('\n📧 Email System Status:');
    console.log(`   Configuration: ${smtpConfigured ? '✅ Complete' : '❌ Incomplete'}`);
    console.log(`   DKIM Security: ${dkimConfigured ? '✅ Enabled' : '⚠️  Disabled'}`);
    console.log(`   Mode: ${smtpConfigured ? 'Production (sends real emails)' : 'Development (shows tokens)'}`);
    
    if (!smtpConfigured) {
      console.log('\n🔧 To enable real email sending:');
      console.log('   1. Run: node setup-smtp.js');
      console.log('   2. Follow the configuration instructions');
      console.log('   3. Restart the server');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmailSystem();