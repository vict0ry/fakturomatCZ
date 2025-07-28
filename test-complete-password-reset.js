#!/usr/bin/env node

async function testCompletePasswordReset() {
  console.log('🔧 Testing Complete Password Reset Flow\n');

  try {
    // Step 1: Request password reset
    console.log('📧 Step 1: Requesting password reset...');
    const resetResponse = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'mail@victoreliot.com'
      })
    });

    console.log('Reset request status:', resetResponse.status);
    const resetData = await resetResponse.json();
    console.log('Reset response:', resetData);

    if (resetResponse.ok && !resetData.message.includes('SMTP není nakonfigurován')) {
      console.log('✅ Password reset email sent successfully!');
      console.log('📧 Email should arrive at mail@victoreliot.com');
    } else if (resetData.resetLink) {
      console.log('🔧 Development mode - reset link provided:');
      console.log('🔗 Reset link:', resetData.resetLink);
      
      // Extract token from reset link
      const tokenMatch = resetData.resetLink.match(/token=([^&]+)/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        console.log('🎯 Extracted token:', token);
        
        // Step 2: Test password reset with token
        console.log('\n📧 Step 2: Testing password reset with token...');
        const newPasswordResponse = await fetch('http://localhost:5000/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: token,
            newPassword: 'newpassword123'
          })
        });
        
        console.log('Password reset status:', newPasswordResponse.status);
        const passwordResetData = await newPasswordResponse.json();
        console.log('Password reset response:', passwordResetData);
        
        if (newPasswordResponse.ok) {
          console.log('✅ Password reset completed successfully!');
        } else {
          console.log('❌ Password reset failed:', passwordResetData.message);
        }
      }
    } else {
      console.log('❌ Password reset request failed');
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testCompletePasswordReset().catch(console.error);