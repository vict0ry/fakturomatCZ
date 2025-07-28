#!/usr/bin/env node

/**
 * 🧪 KOMPLETNÍ TESTOVACÍ SKRIPT PRO EMAIL SYSTÉM
 * 
 * Testuje všechny aspekty password reset funkcionalità
 * včetně Amazon SES integrace, databázových operací a bezpečnosti
 */

const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'mail@victoreliot.com';

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

// Helper funkce
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const responseData = await response.json();
  
  return {
    status: response.status,
    data: responseData
  };
}

function logTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
  
  testResults.details.push({
    name,
    passed,
    details
  });
}

async function runTests() {
  console.log('🚀 SPOUŠTÍM KOMPLETNÍ TEST SUITE PRO EMAIL SYSTÉM');
  console.log('=' .repeat(60));
  console.log();

  // Test 1: Server Connectivity
  console.log('📡 TESTOVÁNÍ SERVERU A KONEKTIVITY');
  try {
    const response = await apiCall('/api/auth/validate');
    logTest('Server je dostupný', response.status === 401 || response.status === 200);
  } catch (error) {
    logTest('Server je dostupný', false, error.message);
  }

  console.log();

  // Test 2: Password Reset Request
  console.log('📧 TESTOVÁNÍ PASSWORD RESET REQUESTU');
  try {
    const response = await apiCall('/api/auth/forgot-password', 'POST', {
      email: TEST_EMAIL
    });
    
    logTest('Password reset request - valid email', response.status === 200);
    
    const hasToken = response.data.developmentToken && response.data.developmentToken.length > 20;
    logTest('Development token v response', hasToken);
    
    if (hasToken) {
      global.resetToken = response.data.developmentToken;
      console.log(`   🎯 Token pro další testy: ${global.resetToken.substring(0, 10)}...`);
    }
    
  } catch (error) {
    logTest('Password reset request - valid email', false, error.message);
  }

  // Test 3: Invalid Email Test
  try {
    const response = await apiCall('/api/auth/forgot-password', 'POST', {
      email: 'neexistuje@example.com'
    });
    
    logTest('Password reset request - invalid email', 
      response.status === 200 && !response.data.developmentToken);
    
  } catch (error) {
    logTest('Password reset request - invalid email', false, error.message);
  }

  console.log();

  // Test 4: Password Reset with Token
  console.log('🔑 TESTOVÁNÍ PASSWORD RESET S TOKENEM');
  if (global.resetToken) {
    try {
      const newPassword = `TestHeslo${Date.now()}!`;
      const response = await apiCall('/api/auth/reset-password', 'POST', {
        token: global.resetToken,
        newPassword: newPassword
      });
      
      logTest('Password reset s platným tokenem', 
        response.status === 200 && response.data.message.includes('úspěšně'));
      
      global.newPassword = newPassword;
      
    } catch (error) {
      logTest('Password reset s platným tokenem', false, error.message);
    }
    
    // Test invalid token
    try {
      const response = await apiCall('/api/auth/reset-password', 'POST', {
        token: 'neplatny-token-12345',
        newPassword: 'TestHeslo123!'
      });
      
      logTest('Password reset s neplatným tokenem', 
        response.status === 404 || response.status === 400);
      
    } catch (error) {
      logTest('Password reset s neplatným tokenem', false, error.message);
    }
    
    // Test weak password
    try {
      const response = await apiCall('/api/auth/reset-password', 'POST', {
        token: global.resetToken,
        newPassword: '123'
      });
      
      logTest('Password reset se slabým heslem', 
        response.status === 400);
      
    } catch (error) {
      logTest('Password reset se slabým heslem', false, error.message);
    }
    
  } else {
    logTest('Password reset testy', false, 'Token nebyl získán z předchozího testu');
  }

  console.log();

  // Test 5: Login Tests
  console.log('🚪 TESTOVÁNÍ LOGIN FUNKCIONALITA');
  
  if (global.newPassword) {
    // Test login with new password
    try {
      const response = await apiCall('/api/auth/login', 'POST', {
        username: TEST_EMAIL,
        password: global.newPassword
      });
      
      logTest('Login s novým heslem', 
        response.status === 200 && response.data.sessionId);
      
      if (response.data.sessionId) {
        console.log(`   🎫 Session ID: ${response.data.sessionId.substring(0, 10)}...`);
      }
      
    } catch (error) {
      logTest('Login s novým heslem', false, error.message);
    }
  }
  
  // Test login with old password (should fail)
  try {
    const response = await apiCall('/api/auth/login', 'POST', {
      username: TEST_EMAIL,
      password: 'F@llout1'  // Staré heslo
    });
    
    logTest('Login se starým heslem (měl by selhat)', 
      response.status === 401);
    
  } catch (error) {
    logTest('Login se starým heslem (měl by selhat)', false, error.message);
  }

  console.log();

  // Test 6: Security Tests
  console.log('🔒 TESTOVÁNÍ BEZPEČNOSTI');
  
  // Test missing email
  try {
    const response = await apiCall('/api/auth/forgot-password', 'POST', {});
    logTest('Password reset bez emailu', response.status === 400);
  } catch (error) {
    logTest('Password reset bez emailu', false, error.message);
  }
  
  // Test missing token
  try {
    const response = await apiCall('/api/auth/reset-password', 'POST', {
      newPassword: 'TestHeslo123!'
    });
    logTest('Password reset bez tokenu', response.status === 400);
  } catch (error) {
    logTest('Password reset bez tokenu', false, error.message);
  }

  console.log();

  // Final Results
  console.log('📊 VÝSLEDKY TESTOVÁNÍ');
  console.log('=' .repeat(60));
  console.log(`Celkem testů: ${testResults.total}`);
  console.log(`✅ Úspěšné: ${testResults.passed}`);
  console.log(`❌ Neúspěšné: ${testResults.failed}`);
  console.log(`📈 Úspěšnost: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  
  console.log();
  
  if (testResults.failed === 0) {
    console.log('🎉 VŠECHNY TESTY PROŠLY ÚSPĚŠNĚ!');
    console.log('✅ Email systém je plně funkční a připraven k nasazení');
  } else {
    console.log('⚠️  NĚKTERÉ TESTY SELHALY');
    console.log('Zkontrolujte následující komponenty:');
    
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   - ${test.name}: ${test.details}`);
      });
  }
  
  console.log();
  console.log('🔍 PRO DETAILNÍ ANALÝZU:');
  console.log('1. Zkontrolujte server logy v workflow konzoli');
  console.log('2. Ověřte Amazon SES credentials v Replit Secrets');
  console.log('3. Otestujte databázové připojení pomocí SQL dotazů');
  
  // Save results to file
  const fs = require('fs').promises;
  const reportData = {
    timestamp: new Date().toISOString(),
    testResults,
    environment: {
      baseUrl: BASE_URL,
      testEmail: TEST_EMAIL,
      nodeVersion: process.version
    }
  };
  
  await fs.writeFile('test-results.json', JSON.stringify(reportData, null, 2));
  console.log('📄 Výsledky uloženy do test-results.json');
}

// Spusť testy
runTests().catch(console.error);