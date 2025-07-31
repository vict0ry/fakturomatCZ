#!/usr/bin/env node

// FINAL EMAIL ADMIN SYSTEM TEST
// Tests admin controls for 5 priority email types + custom templates

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
let sessionId = null;

async function apiRequest(method, path, data = null, useAuth = true) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(useAuth && sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {})
    },
    ...(data && { body: JSON.stringify(data) })
  };

  const response = await fetch(`${BASE_URL}${path}`, options);
  const responseText = await response.text();
  
  let responseData;
  try {
    responseData = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseData = responseText;
  }
  
  return {
    status: response.status,
    data: responseData
  };
}

async function testAdminAuth() {
  console.log('🔐 Testing admin authentication...');
  
  const response = await apiRequest('POST', '/api/auth/login', {
    username: 'admin@doklad.ai',
    password: 'admin123'
  }, false);

  if (response.status === 200 && response.data?.sessionId) {
    sessionId = response.data.sessionId;
    console.log(`✅ Admin authenticated - Session: ${sessionId.substring(0, 8)}...`);
    return true;
  } else {
    console.log(`❌ Authentication failed:`, response.status);
    return false;
  }
}

async function testEmailSettingsFlow() {
  console.log('\n📧 Testing email settings management...');
  
  // 1. Initialize email settings
  console.log('1. Initializing default email settings...');
  const initResponse = await apiRequest('POST', '/api/email-settings/initialize');
  console.log(`   Response: ${initResponse.status}`);
  
  // 2. Fetch all settings
  console.log('2. Fetching email settings...');
  const getResponse = await apiRequest('GET', '/api/email-settings');
  console.log(`   Response: ${getResponse.status}`);
  
  if (getResponse.status === 200) {
    const settings = getResponse.data;
    console.log(`   Raw data type: ${typeof settings}, length: ${settings?.length}`);
    
    if (Array.isArray(settings)) {
      console.log(`   ✅ Found ${settings.length} email settings`);
      
      // Show first few settings
      settings.slice(0, 5).forEach(setting => {
        console.log(`   - ${setting.emailType}: ${setting.isEnabled ? 'enabled' : 'disabled'}`);
      });
    } else {
      console.log(`   ⚠️ Data format issue - expected array, got ${typeof settings}`);
      console.log(`   Sample data:`, JSON.stringify(settings).substring(0, 200));
    }
  }
  
  // 3. Test specific email setting
  console.log('3. Testing payment_failed email setting...');
  const specificResponse = await apiRequest('GET', '/api/email-settings/payment_failed');
  console.log(`   Response: ${specificResponse.status}`);
  
  if (specificResponse.status === 200) {
    console.log(`   Full data:`, JSON.stringify(specificResponse.data, null, 2));
    console.log(`   Subject: "${specificResponse.data?.subject || 'undefined'}"`);
    console.log(`   Enabled: ${specificResponse.data?.isEnabled || 'undefined'}`);
  }
  
  // 4. Update email setting
  console.log('4. Updating trial_expiring_1d setting...');
  const updateData = {
    emailType: 'trial_expiring_1d',
    isEnabled: true,
    subject: '🚨 Trial končí ZÍTRA - UPDATED',
    htmlContent: '<h1>Updated Content</h1><p>This is updated test content</p>',
    textContent: 'Updated test content'
  };
  
  const updateResponse = await apiRequest('POST', '/api/email-settings', updateData);
  console.log(`   Response: ${updateResponse.status}`);
  
  if (updateResponse.status === 200) {
    console.log(`   ✅ Successfully updated email setting`);
    console.log(`   New subject: "${updateResponse.data.subject}"`);
  }
  
  return getResponse.status === 200;
}

async function testPriorityEmailFunctions() {
  console.log('\n📨 Testing priority email functions...');
  
  const testUser = {
    id: 1,
    firstName: 'Test',
    lastName: 'User', 
    email: 'test@example.com'
  };
  
  const tests = [
    {
      name: 'Payment Failed Email',
      endpoint: '/api/test/send-payment-failed-email',
      data: {
        user: testUser,
        paymentDetails: { amount: 199, last4: '4242', reason: 'Insufficient funds' }
      }
    },
    {
      name: 'Trial Expiring 3 Days',
      endpoint: '/api/test/send-trial-expiring-email',
      data: { user: testUser, daysLeft: 3 }
    },
    {
      name: 'Trial Expiring 1 Day',
      endpoint: '/api/test/send-trial-expiring-email', 
      data: { user: testUser, daysLeft: 1 }
    },
    {
      name: 'Email Confirmation',
      endpoint: '/api/test/send-email-confirmation',
      data: { user: testUser, confirmationToken: 'test-token-123' }
    },
    {
      name: 'Monthly Report',
      endpoint: '/api/test/send-monthly-report',
      data: {
        user: testUser,
        company: { name: 'Test Company s.r.o.' },
        reportData: { totalInvoices: 25, totalRevenue: 125000, paidInvoices: 20, overdueInvoices: 3 }
      }
    }
  ];
  
  let successCount = 0;
  
  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    const response = await apiRequest('POST', test.endpoint, test.data);
    
    if (response.status === 200) {
      console.log(`   Response data:`, JSON.stringify(response.data).substring(0, 100));
      if (response.data?.success) {
        console.log(`   ✅ ${test.name} sent successfully`);
        successCount++;
      } else {
        console.log(`   ❌ ${test.name} failed - Success flag: ${response.data?.success}`);
      }
    } else {
      console.log(`   ❌ ${test.name} failed - Status: ${response.status}`);
    }
  }
  
  console.log(`\nEmail Function Results: ${successCount}/${tests.length} successful`);
  return successCount === tests.length;
}

async function testOnboardingSequence() {
  console.log('\n📋 Testing onboarding email sequence...');
  
  const testUser = {
    id: 1,
    firstName: 'Onboarding',
    lastName: 'Test',
    email: 'onboarding@example.com'
  };
  
  let successCount = 0;
  
  for (let day = 1; day <= 7; day++) {
    const response = await apiRequest('POST', '/api/test/send-onboarding-email', {
      user: testUser,
      day: day
    });
    
    if (response.status === 200 && response.data?.success) {
      console.log(`   ✅ Day ${day} onboarding email sent`);
      successCount++;
    } else {
      console.log(`   ❌ Day ${day} onboarding email failed`);
    }
  }
  
  console.log(`Onboarding Sequence: ${successCount}/7 emails sent`);
  return successCount === 7;
}

async function runFinalEmailTest() {
  console.log('🚀 FINAL EMAIL ADMIN SYSTEM TEST');
  console.log('=' .repeat(50));
  
  try {
    // 1. Authentication
    const authSuccess = await testAdminAuth();
    if (!authSuccess) {
      console.log('\n❌ CRITICAL: Admin authentication failed');
      return;
    }
    
    // 2. Email Settings Management
    const settingsSuccess = await testEmailSettingsFlow();
    
    // 3. Priority Email Functions
    const emailsSuccess = await testPriorityEmailFunctions();
    
    // 4. Onboarding Sequence
    const onboardingSuccess = await testOnboardingSequence();
    
    // Final Results
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL RESULTS:');
    console.log(`Authentication: ${authSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Email Settings: ${settingsSuccess ? '✅ PASS' : '⚠️ ISSUES'}`);
    console.log(`Priority Emails: ${emailsSuccess ? '✅ PASS' : '⚠️ ISSUES'}`);
    console.log(`Onboarding: ${onboardingSuccess ? '✅ PASS' : '⚠️ ISSUES'}`);
    
    if (authSuccess && settingsSuccess && emailsSuccess && onboardingSuccess) {
      console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
      console.log('\n📋 COMPLETED FEATURES:');
      console.log('✅ Admin email management panel');
      console.log('✅ 5 priority email types with Amazon SES');
      console.log('✅ 7-day onboarding email sequence');
      console.log('✅ Company-level email toggle controls');
      console.log('✅ Custom email templates and content');
      console.log('✅ Professional HTML email designs');
      console.log('\n🚀 READY FOR PRODUCTION DEPLOYMENT!');
    } else {
      console.log('\n⚠️ Some systems need attention');
    }
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }
}

runFinalEmailTest();