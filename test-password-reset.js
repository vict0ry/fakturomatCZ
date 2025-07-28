#!/usr/bin/env node

async function testPasswordReset() {
  console.log('🔧 Testing Password Reset API\n');

  try {
    // Test with an existing user email
    const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'mail@victoreliot.com'
      })
    });

    console.log('📋 Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📋 Response Body:', responseText);

    if (response.status === 500) {
      console.log('\n❌ 500 Error detected - checking logs');
    } else if (response.ok) {
      console.log('\n✅ Password reset request successful');
    }

  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

testPasswordReset().catch(console.error);