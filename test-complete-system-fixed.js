#!/usr/bin/env node

/**
 * 🚀 KOMPLETNÍ SYSTÉMOVÝ TEST
 * Testuje všechny funkce se správnou autentifikací
 */

const BASE_URL = 'http://localhost:5000';

// Helper pro přihlášení admina
async function loginAdmin() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        username: 'admin@doklad.ai',
        password: 'admin123'
      })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const result = await response.json();
    const cookies = response.headers.get('set-cookie');
    
    return {
      sessionId: result.sessionId,
      cookies: cookies,
      user: result.user
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Helper pro authenticated API volání
async function authenticatedRequest(method, endpoint, data = null, auth = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    };

    if (auth && auth.cookies) {
      options.headers['Cookie'] = auth.cookies;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function runCompleteSystemTest() {
  console.log('🚀 SPOUŠTÍM KOMPLETNÍ SYSTÉMOVÝ TEST');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  // Test 1: Server Connectivity
  console.log('📡 TEST 1: Server Connectivity');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      console.log('✅ Server je dostupný');
      passed++;
      results.push({ test: 'Server Connectivity', status: 'PASSED' });
    } else {
      throw new Error('Server nedostupný');
    }
  } catch (error) {
    console.log('❌ Server connectivity failed:', error.message);
    failed++;
    results.push({ test: 'Server Connectivity', status: 'FAILED', error: error.message });
  }

  // Test 2: Admin Login
  console.log('\n🔐 TEST 2: Admin Login');
  let adminAuth = null;
  try {
    adminAuth = await loginAdmin();
    console.log('✅ Admin login úspěšný');
    console.log(`   SessionId: ${adminAuth.sessionId}`);
    console.log(`   User: ${adminAuth.user.username} (${adminAuth.user.email})`);
    passed++;
    results.push({ test: 'Admin Login', status: 'PASSED' });
  } catch (error) {
    console.log('❌ Admin login failed:', error.message);
    failed++;
    results.push({ test: 'Admin Login', status: 'FAILED', error: error.message });
    return { passed, failed, results }; // Exit early if admin login fails
  }

  // Test 3: API Endpoints
  console.log('\n📊 TEST 3: Core API Endpoints');
  const apiTests = [
    { name: 'Users List', endpoint: '/api/admin/users' },
    { name: 'Company Stats', endpoint: '/api/stats' },
    { name: 'Recent Invoices', endpoint: '/api/invoices/recent' },
    { name: 'Customers List', endpoint: '/api/customers' },
    { name: 'Auth Validation', endpoint: '/api/auth/validate' }
  ];

  for (const apiTest of apiTests) {
    try {
      const result = await authenticatedRequest('GET', apiTest.endpoint, null, adminAuth);
      if (result.success) {
        console.log(`✅ ${apiTest.name} - OK`);
        if (result.data && Array.isArray(result.data)) {
          console.log(`   📊 Returned ${result.data.length} items`);
        }
        passed++;
        results.push({ test: apiTest.name, status: 'PASSED' });
      } else {
        throw new Error(`HTTP ${result.status}: ${result.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ ${apiTest.name} failed:`, error.message);
      failed++;
      results.push({ test: apiTest.name, status: 'FAILED', error: error.message });
    }
  }

  // Test 4: AI Chat (simplified)
  console.log('\n🤖 TEST 4: AI Chat System');
  try {
    const result = await authenticatedRequest('POST', '/api/chat/universal', {
      message: 'Ahoj, jak se máš?'
    }, adminAuth);
    
    if (result.success) {
      console.log('✅ AI Chat funguje');
      console.log(`   Response: ${result.data.response || 'No response'}`);
      passed++;
      results.push({ test: 'AI Chat', status: 'PASSED' });
    } else {
      throw new Error(`AI Chat failed: ${result.status} - ${result.data?.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ AI Chat failed:', error.message);
    failed++;
    results.push({ test: 'AI Chat', status: 'FAILED', error: error.message });
  }

  // Test 5: Email System Status
  console.log('\n📧 TEST 5: Email System');
  try {
    const result = await authenticatedRequest('GET', '/api/email/settings', null, adminAuth);
    if (result.success) {
      console.log('✅ Email system dostupný');
      passed++;
      results.push({ test: 'Email System', status: 'PASSED' });
    } else {
      throw new Error(`Email system unavailable: ${result.status}`);
    }
  } catch (error) {
    console.log('⚠️ Email system warning:', error.message);
    // Don't fail the whole test for email issues
    results.push({ test: 'Email System', status: 'WARNING', error: error.message });
  }

  // Summary
  console.log('\n============================================================');
  console.log('📊 VÝSLEDKY TESTOVÁNÍ');
  console.log('============================================================');
  
  results.forEach(result => {
    const icon = result.status === 'PASSED' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`${icon} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n============================================================');
  console.log(`✅ Úspěšné: ${passed}`);
  console.log(`❌ Neúspěšné: ${failed}`);
  console.log(`📈 Úspěšnost: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  const warnings = results.filter(r => r.status === 'WARNING').length;
  if (warnings > 0) {
    console.log(`⚠️ Varování: ${warnings}`);
  }

  if (failed === 0) {
    console.log('\n🎉 VŠECHNY KRITICKÉ TESTY PROŠLY!');
    console.log('✅ Systém je připraven k nasazení');
  } else {
    console.log('\n🚨 NĚKTERÉ TESTY SELHALY');
    console.log('❌ Systém vyžaduje opravy před nasazením');
  }

  return { passed, failed, results, warnings };
}

// Spuštění testů
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteSystemTest().catch(console.error);
}

export { runCompleteSystemTest };