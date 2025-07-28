#!/usr/bin/env node

import { emailService } from './server/services/email-service.js';

async function testPasswordResetDirect() {
  console.log('🔧 Testing Password Reset Email Service Directly\n');

  // Test user object
  const testUser = {
    id: 1,
    email: 'mail@victoreliot.com',
    firstName: 'Victor',
    username: 'victor'
  };

  const resetToken = 'test-token-123';

  console.log('📧 Testing email service configuration...');
  console.log('Email service configured:', emailService.isConfigured());
  
  if (!emailService.isConfigured()) {
    console.log('❌ Email service is not configured properly');
    console.log('🔧 Checking environment variables...');
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS length:', process.env.SMTP_PASS?.length);
    console.log('AWS_SES_REGION:', process.env.AWS_SES_REGION);
    return;
  }

  try {
    console.log('📧 Testing SMTP connection...');
    const connectionTest = await emailService.testEmailConnection();
    console.log('Connection test result:', connectionTest);

    if (connectionTest) {
      console.log('✅ SMTP connection successful');
      console.log('📧 Sending password reset email...');
      
      const result = await emailService.sendPasswordResetEmail(testUser, resetToken);
      console.log('Password reset email result:', result);
      
      if (result) {
        console.log('✅ Password reset email sent successfully!');
      } else {
        console.log('❌ Password reset email failed');
      }
    } else {
      console.log('❌ SMTP connection failed');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testPasswordResetDirect().catch(console.error);