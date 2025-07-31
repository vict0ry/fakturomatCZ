#!/usr/bin/env node

/**
 * DEBUG STRIPE CHECKOUT PROCESS
 */

import fetch from 'node-fetch';

async function debugStripeCheckout() {
  console.log('🔍 DEBUG STRIPE CHECKOUT PROCESS');
  console.log('=================================');
  console.log('');

  // Test with development session token
  const authToken = 'test-session-dev';
  const baseUrl = 'http://localhost:5000';

  try {
    // 1. Check subscription status
    console.log('📊 Checking current subscription status...');
    const statusResponse = await fetch(`${baseUrl}/api/stripe/subscription-status`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Current subscription status:');
      console.log(`   Status: ${statusData.status || 'none'}`);
      console.log(`   Plan: ${statusData.planType || 'none'}`);
      console.log(`   Trial End: ${statusData.trialEnd || 'none'}`);
      console.log(`   Monthly Price: ${statusData.monthlyPrice || 'none'}`);
    } else {
      console.log(`❌ Failed to get subscription status: ${statusResponse.status}`);
      console.log(`   Error: ${await statusResponse.text()}`);
    }
    console.log('');

    // 2. Create new checkout session for debugging
    console.log('💳 Creating new checkout session...');
    const checkoutResponse = await fetch(`${baseUrl}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (checkoutResponse.ok) {
      const checkoutData = await checkoutResponse.json();
      console.log('✅ New checkout session created:');
      console.log(`   Session ID: ${checkoutData.sessionId}`);
      console.log(`   Checkout URL: ${checkoutData.url}`);
      console.log('');
      
      console.log('🎯 NEXT STEPS FOR MANUAL TESTING:');
      console.log('1. Open this URL in browser:');
      console.log(`   ${checkoutData.url}`);
      console.log('');
      console.log('2. Use TEST card: 4242424242424242');
      console.log('   CVC: 123, Expiry: 12/25, ZIP: 12345');
      console.log('');
      console.log('3. After successful payment, check:');
      console.log('   - Browser should redirect to success page');
      console.log('   - Run this script again to see updated status');
      console.log('   - Check Stripe dashboard for new data');
      
    } else {
      console.log(`❌ Failed to create checkout session: ${checkoutResponse.status}`);
      console.log(`   Error: ${await checkoutResponse.text()}`);
    }

  } catch (error) {
    console.error('🚨 Debug error:', error.message);
  }

  console.log('');
  console.log('📋 TROUBLESHOOTING CHECKLIST:');
  console.log('============================');
  console.log('□ Server is running on port 5000');
  console.log('□ You are logged in to the application');  
  console.log('□ Stripe keys are configured correctly');
  console.log('□ You completed the entire checkout process');
  console.log('□ You were redirected to success page');
  console.log('□ No JavaScript errors in browser console');
  console.log('');
  console.log('💡 TIP: Open browser developer tools to check for errors!');
}

debugStripeCheckout();