// Debug session auth for email settings
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
let sessionId = null;

async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin@doklad.ai',
      password: 'admin123'
    })
  });
  
  const data = await response.json();
  sessionId = data.sessionId;
  
  console.log(`Login success: ${response.status}`);
  console.log(`Session ID: ${sessionId}`);
  console.log(`User data:`, JSON.stringify(data.user, null, 2));
  return sessionId;
}

async function testWithSession() {
  console.log('\n🔍 Testing email settings with session...');
  
  const response = await fetch(`${BASE_URL}/api/email-settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionId}`
    }
  });
  
  const responseText = await response.text();
  const contentType = response.headers.get('content-type');
  
  console.log(`Email settings response: ${response.status}`);
  console.log(`Content-Type: ${contentType}`);
  console.log(`Response start: ${responseText.substring(0, 200)}`);
  
  if (responseText.startsWith('<!DOCTYPE html>')) {
    console.log('❌ Still getting HTML instead of JSON!');
    console.log('This suggests authentication middleware might not be working properly');
  } else {
    console.log('✅ Got JSON response');
    try {
      const data = JSON.parse(responseText);
      console.log('Parsed data:', data);
    } catch (e) {
      console.log('Failed to parse as JSON:', e.message);
    }
  }
}

async function testDirect() {
  console.log('\n🔧 Testing with hardcoded session token...');
  
  const response = await fetch(`${BASE_URL}/api/email-settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-session-dev'
    }
  });
  
  const responseText = await response.text();
  const contentType = response.headers.get('content-type');
  
  console.log(`Direct test response: ${response.status}`);
  console.log(`Content-Type: ${contentType}`);
  console.log(`Response start: ${responseText.substring(0, 200)}`);
}

async function run() {
  console.log('🚀 Debugging session authentication...');
  
  await login();
  await testWithSession();
  await testDirect();
}

run();