// Simple API test without auth
import fetch from 'node-fetch';

async function testSimpleAPI() {
  console.log('🔍 Testing simple API endpoints...');
  
  try {
    // Test a working endpoint that should return JSON
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin@doklad.ai',
        password: 'admin123'
      })
    });
    
    const responseText = await response.text();
    console.log(`Login response status: ${response.status}`);
    console.log(`Response type: ${response.headers.get('content-type')}`);
    console.log(`Response start: ${responseText.substring(0, 100)}`);
    
    if (responseText.startsWith('<!DOCTYPE html>')) {
      console.log('❌ API returning HTML instead of JSON!');
    } else {
      console.log('✅ API returning proper JSON');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSimpleAPI();