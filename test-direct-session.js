#!/usr/bin/env node

// Testuje přímo session ID generovaný při loginu

console.log('🔑 DIRECT SESSION TEST');
console.log('====================');

async function testDirectSession() {
  const baseUrl = 'http://localhost:5000';

  try {
    // 1. Login a získej session
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin@doklad.ai',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }

    const loginData = await loginResponse.json();
    console.log(`✅ Login successful, sessionId: ${loginData.sessionId}`);

    // 2. Použij session ID přímo jako Bearer token
    const stripeResponse = await fetch(`${baseUrl}/api/stripe/subscription-status`, {
      headers: { 'Authorization': `Bearer ${loginData.sessionId}` }
    });

    console.log(`📊 Stripe response status: ${stripeResponse.status}`);
    
    if (stripeResponse.ok) {
      const data = await stripeResponse.json();
      console.log('✅ Stripe works with session ID!', data);
    } else {
      const error = await stripeResponse.text();
      console.log('❌ Stripe failed:', error);
    }

  } catch (error) {
    console.error('🚨 Error:', error);
  }
}

testDirectSession();