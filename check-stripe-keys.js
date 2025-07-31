#!/usr/bin/env node

/**
 * CHECK STRIPE KEYS AND CONFIGURATION
 */

console.log('🔑 STRIPE KEYS VERIFICATION');
console.log('===========================');
console.log('');

// Check environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.VITE_STRIPE_PUBLIC_KEY;

console.log('📋 Environment Variables:');
console.log(`STRIPE_SECRET_KEY: ${stripeSecretKey ? '✅ Set (sk_test_...)' : '❌ Missing'}`);
console.log(`VITE_STRIPE_PUBLIC_KEY: ${stripePublicKey ? '✅ Set (pk_test_...)' : '❌ Missing'}`);
console.log('');

if (stripeSecretKey) {
  console.log(`Secret Key Preview: ${stripeSecretKey.substring(0, 12)}...`);
  console.log(`Is Test Key: ${stripeSecretKey.startsWith('sk_test_') ? '✅ Yes' : '❌ No - LIVE KEY!'}`);
}

if (stripePublicKey) {
  console.log(`Public Key Preview: ${stripePublicKey.substring(0, 12)}...`);
  console.log(`Is Test Key: ${stripePublicKey.startsWith('pk_test_') ? '✅ Yes' : '❌ No - LIVE KEY!'}`);
}

console.log('');

// Test Stripe API connection
if (stripeSecretKey) {
  console.log('🧪 Testing Stripe API Connection...');
  
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey);
    
    // Simple API call to test connection
    const balance = await stripe.balance.retrieve();
    console.log('✅ Stripe API connection successful!');
    console.log(`Available balance: ${balance.available[0]?.amount || 0} ${balance.available[0]?.currency || 'CZK'}`);
    
  } catch (error) {
    console.log('❌ Stripe API connection failed:');
    console.log(`   Error: ${error.message}`);
    
    if (error.message.includes('Invalid API Key')) {
      console.log('   💡 Tip: Check your STRIPE_SECRET_KEY format');
    } else if (error.message.includes('No such')) {
      console.log('   💡 Tip: Make sure you are using the correct Stripe account');
    }
  }
} else {
  console.log('❌ Cannot test Stripe API - missing STRIPE_SECRET_KEY');
}

console.log('');
console.log('🔧 TROUBLESHOOTING:');
console.log('===================');
console.log('If Stripe API is failing:');
console.log('1. Check that STRIPE_SECRET_KEY starts with sk_test_');
console.log('2. Verify key is copied correctly from Stripe Dashboard');
console.log('3. Make sure you are in Test mode in Stripe Dashboard');
console.log('4. Try regenerating the API key if needed');
console.log('');
console.log('🌐 Get your keys from:');
console.log('https://dashboard.stripe.com/apikeys');