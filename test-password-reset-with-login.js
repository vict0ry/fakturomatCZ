#!/usr/bin/env node

async function testPasswordResetAndLogin() {
  console.log('🎯 Testing Complete Password Reset + Login Flow\n');

  try {
    // Step 1: Request password reset
    console.log('📧 Step 1: Requesting password reset...');
    const resetResponse = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mail@victoreliot.com' })
    });

    const resetData = await resetResponse.json();
    console.log('Reset response:', resetData);

    if (resetData.resetLink) {
      // Extract token from reset link
      const tokenMatch = resetData.resetLink.match(/token=([^&]+)/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        console.log('🎯 Extracted token:', token);
        
        // Step 2: Reset password
        console.log('\n🔑 Step 2: Resetting password...');
        const newPasswordResponse = await fetch('http://localhost:5000/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token,
            newPassword: 'NewPassword123!'
          })
        });
        
        const passwordResetData = await newPasswordResponse.json();
        console.log('Password reset response:', passwordResetData);
        
        if (newPasswordResponse.ok) {
          console.log('✅ Password reset completed!');
          
          // Step 3: Test login with new password
          console.log('\n🚀 Step 3: Testing login with new password...');
          const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'mail@victoreliot.com',
              password: 'NewPassword123!'
            })
          });
          
          console.log('Login status:', loginResponse.status);
          const loginData = await loginResponse.json();
          console.log('Login response:', loginData);
          
          if (loginResponse.ok) {
            console.log('🎉 SUCCESS! Complete password reset flow working!');
            console.log('✅ User can now login with new password');
          } else {
            console.log('❌ Login failed after password reset');
          }
        }
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testPasswordResetAndLogin().catch(console.error);