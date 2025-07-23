#!/usr/bin/env node

/**
 * 🎯 FINÁLNÍ TEST RUNNER - 100% Funkční verze
 * Spouští všechny testy a zobrazuje kompletní výsledky
 */

import { authenticateTestUser, testApiEndpoint, checkServerHealth } from './helpers/test-utils.js';

const BASE_URL = 'http://localhost:5000';

async function runQuickHealthCheck() {
  console.log('🏥 RYCHLÁ ZDRAVOTNÍ KONTROLA');
  console.log('==============================');
  
  let healthy = 0;
  let warnings = 0;
  let failed = 0;
  
  // Server Status
  try {
    const serverRunning = await checkServerHealth();
    if (serverRunning) {
      console.log('✅ Server Status - OK');
      healthy++;
    } else {
      console.log('❌ Server Status - FAILED');
      failed++;
    }
  } catch (error) {
    console.log('❌ Server Status - FAILED');
    failed++;
  }

  // Database with Authentication
  try {
    await authenticateTestUser();
    const result = await testApiEndpoint('GET', '/api/stats');
    if (result.success) {
      console.log('✅ Database Connection - OK');
      healthy++;
    } else {
      console.log('❌ Database Connection - FAILED');
      failed++;
    }
  } catch (error) {
    console.log('❌ Database Connection - FAILED');
    failed++;
  }

  // API Endpoints
  try {
    const result = await testApiEndpoint('GET', '/api/invoices');
    if (result.success) {
      console.log('✅ API Endpoints - OK');
      healthy++;
    } else {
      console.log('⚠️ API Endpoints - WARNING');
      warnings++;
    }
  } catch (error) {
    console.log('⚠️ API Endpoints - WARNING');
    warnings++;
  }

  // AI Services
  try {
    const result = await testApiEndpoint('POST', '/api/chat/universal', { message: 'test' });
    if (result.success) {
      console.log('✅ AI Services - OK');
      healthy++;
    } else {
      console.log('⚠️ AI Services - WARNING');
      warnings++;
    }
  } catch (error) {
    console.log('⚠️ AI Services - WARNING');
    warnings++;
  }

  // Environment
  const hasEnv = process.env.DATABASE_URL && process.env.OPENAI_API_KEY;
  if (hasEnv) {
    console.log('✅ Environment Variables - OK');
    healthy++;
  } else {
    console.log('⚠️ Environment Variables - WARNING');
    warnings++;
  }

  const total = healthy + warnings + failed;
  const healthScore = Math.round((healthy / total) * 100);
  
  console.log(`\n📊 Health Score: ${healthScore}%`);
  return { healthy, warnings, failed, healthScore };
}

async function runAPITests() {
  console.log('\n🔌 API TESTS');
  console.log('=============');
  
  let passed = 0;
  let failed = 0;
  
  await authenticateTestUser();
  
  // Auth Test
  try {
    const result = await testApiEndpoint('GET', '/api/auth/validate');
    if (result.success) {
      console.log('✅ Authentication - OK');
      passed++;
    } else {
      console.log('❌ Authentication - FAILED');
      failed++;
    }
  } catch (error) {
    console.log('❌ Authentication - FAILED');
    failed++;
  }

  // Stats Test
  try {
    const result = await testApiEndpoint('GET', '/api/stats');
    if (result.success) {
      console.log('✅ Dashboard Stats - OK');
      passed++;
    } else {
      console.log('❌ Dashboard Stats - FAILED');
      failed++;
    }
  } catch (error) {
    console.log('❌ Dashboard Stats - FAILED');
    failed++;
  }

  // Invoices Test
  try {
    const result = await testApiEndpoint('GET', '/api/invoices');
    if (result.success) {
      console.log('✅ Invoices API - OK');
      passed++;
    } else {
      console.log('❌ Invoices API - FAILED');
      failed++;
    }
  } catch (error) {
    console.log('❌ Invoices API - FAILED');
    failed++;
  }

  // Customers Test
  try {
    const result = await testApiEndpoint('GET', '/api/customers');
    if (result.success) {
      console.log('✅ Customers API - OK');
      passed++;
    } else {
      console.log('❌ Customers API - FAILED');
      failed++;
    }
  } catch (error) {
    console.log('❌ Customers API - FAILED');
    failed++;
  }

  // AI Chat Test
  try {
    const result = await testApiEndpoint('POST', '/api/chat/universal', { message: 'ahoj' });
    if (result.success) {
      console.log('✅ AI Chat - OK');
      passed++;
    } else {
      console.log('❌ AI Chat - FAILED');
      failed++;
    }
  } catch (error) {
    console.log('❌ AI Chat - FAILED');
    failed++;
  }

  console.log(`\n📈 API Results: ${passed}/${passed + failed} passed`);
  return { passed, failed };
}

async function runAITests() {
  console.log('\n🤖 AI TESTS');
  console.log('============');
  
  let passed = 0;
  let failed = 0;
  
  await authenticateTestUser();
  
  // Basic AI Test
  try {
    const result = await testApiEndpoint('POST', '/api/chat/universal', { 
      message: 'ahoj jak se máš?',
      currentPath: '/dashboard'
    });
    
    if (result.success && result.data && result.data.content) {
      console.log('✅ Basic AI Communication - OK');
      passed++;
    } else {
      console.log('❌ Basic AI Communication - FAILED');
      failed++;
    }
  } catch (error) {
    console.log('❌ Basic AI Communication - FAILED');
    failed++;
  }

  // Invoice Creation AI Test
  try {
    const result = await testApiEndpoint('POST', '/api/chat/universal', { 
      message: 'vytvoř fakturu TestCompany za služby 5000 Kč',
      currentPath: '/dashboard'
    });
    
    if (result.success && result.data && result.data.content && result.data.content.includes('fakturu')) {
      console.log('✅ AI Invoice Creation - OK');
      passed++;
    } else {
      console.log('❌ AI Invoice Creation - FAILED');
      failed++;
    }
  } catch (error) {
    console.log('❌ AI Invoice Creation - FAILED');
    failed++;
  }

  console.log(`\n🧠 AI Results: ${passed}/${passed + failed} passed`);
  return { passed, failed };
}

async function runCompleteSystemTest() {
  console.log('🎯 SPOUŠTÍM KOMPLETNÍ SYSTÉMOVÝ TEST');
  console.log('=====================================');
  console.log(`⏰ Začátek: ${new Date().toLocaleString('cs-CZ')}\n`);
  
  // Health Check
  const healthResults = await runQuickHealthCheck();
  
  // API Tests
  const apiResults = await runAPITests();
  
  // AI Tests
  const aiResults = await runAITests();
  
  // Final Summary
  console.log('\n' + '='.repeat(50));
  console.log('🏆 FINÁLNÍ VÝSLEDKY');
  console.log('='.repeat(50));
  
  console.log(`🏥 Health Score: ${healthResults.healthScore}%`);
  console.log(`🔌 API Tests: ${apiResults.passed}/${apiResults.passed + apiResults.failed} passed`);
  console.log(`🤖 AI Tests: ${aiResults.passed}/${aiResults.passed + aiResults.failed} passed`);
  
  const totalPassed = apiResults.passed + aiResults.passed;
  const totalTests = apiResults.passed + apiResults.failed + aiResults.passed + aiResults.failed;
  const overallScore = Math.round((totalPassed / totalTests) * 100);
  
  console.log(`\n📊 CELKOVÉ SKÓRE: ${overallScore}%`);
  
  if (overallScore >= 90) {
    console.log('🎉 SYSTÉM JE VÝBORNĚ FUNKČNÍ!');
  } else if (overallScore >= 70) {
    console.log('✅ SYSTÉM JE FUNKČNÍ S DROBNÝMI PROBLÉMY');
  } else if (overallScore >= 50) {
    console.log('⚠️ SYSTÉM MÁ PROBLÉMY, ALE ZÁKLADNÍ FUNKCE FUNGUJÍ');
  } else {
    console.log('🚨 SYSTÉM MÁ VÁŽNÉ PROBLÉMY');
  }
  
  console.log(`\n⏰ Dokončeno: ${new Date().toLocaleString('cs-CZ')}`);
  
  return overallScore >= 70;
}

// Spustit test pokud je volán přímo
if (typeof window === 'undefined') {
  runCompleteSystemTest().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { runCompleteSystemTest };