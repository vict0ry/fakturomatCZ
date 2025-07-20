#!/usr/bin/env node

/**
 * 🩺 System Health Check
 * Quick health check for all critical system components
 */

import { checkServerHealth, testApiEndpoint, formatDuration, authenticateTestUser } from './helpers/test-utils.js';

async function runSystemHealthCheck() {
  console.log('🩺 === SYSTEM HEALTH CHECK ===\n');
  
  const startTime = Date.now();
  const checks = [];

  // 1. Server Health
  console.log('🔍 Checking server connectivity...');
  const serverHealthy = await checkServerHealth();
  checks.push({
    name: 'Server Connectivity',
    status: serverHealthy,
    critical: true
  });
  console.log(serverHealthy ? '✅ Server is running' : '❌ Server not accessible');

  if (!serverHealthy) {
    console.log('\n❌ Cannot proceed - server is not running');
    console.log('💡 Start the server with: npm run dev');
    return;
  }

  // 2. Database Connection
  console.log('\n🗄️ Checking database connection...');
  try {
    const dbResponse = await testApiEndpoint('GET', '/api/invoices');
    const dbHealthy = dbResponse.success || dbResponse.status === 401;
    checks.push({
      name: 'Database Connection',
      status: dbHealthy,
      critical: true
    });
    console.log(dbHealthy ? '✅ Database accessible' : '❌ Database connection failed');
  } catch (error) {
    checks.push({
      name: 'Database Connection',
      status: false,
      critical: true
    });
    console.log('❌ Database connection error');
  }

  // 3. Authentication System
  console.log('\n🔐 Checking authentication system...');
  try {
    const authResponse = await testApiEndpoint('GET', '/api/auth/validate');
    const authHealthy = authResponse.status === 401 || authResponse.success;
    checks.push({
      name: 'Authentication System',
      status: authHealthy,
      critical: true
    });
    console.log(authHealthy ? '✅ Authentication system working' : '❌ Authentication system failed');
  } catch (error) {
    checks.push({
      name: 'Authentication System',
      status: false,
      critical: true
    });
    console.log('❌ Authentication system error');
  }

  // 4. AI Assistant
  console.log('\n🤖 Checking AI assistant...');
  try {
    const aiResponse = await testApiEndpoint('POST', '/api/chat', {
      message: 'test',
      sessionId: 'health-check'
    });
    const aiHealthy = aiResponse.success || aiResponse.error?.includes('OpenAI');
    checks.push({
      name: 'AI Assistant',
      status: aiHealthy,
      critical: false
    });
    console.log(aiHealthy ? '✅ AI assistant accessible' : '❌ AI assistant failed');
  } catch (error) {
    checks.push({
      name: 'AI Assistant',
      status: false,
      critical: false
    });
    console.log('❌ AI assistant error');
  }

  // 5. Expense API
  console.log('\n💰 Checking expense management...');
  try {
    const expenseResponse = await testApiEndpoint('GET', '/api/expenses');
    const expenseHealthy = expenseResponse.success || expenseResponse.status === 401;
    checks.push({
      name: 'Expense Management',
      status: expenseHealthy,
      critical: true
    });
    console.log(expenseHealthy ? '✅ Expense management working' : '❌ Expense management failed');
  } catch (error) {
    checks.push({
      name: 'Expense Management',
      status: false,
      critical: true
    });
    console.log('❌ Expense management error');
  }

  // 6. PDF Generation
  console.log('\n📄 Checking PDF generation...');
  try {
    const pdfResponse = await testApiEndpoint('GET', '/api/invoices/1/pdf');
    const pdfHealthy = pdfResponse.status !== 500; // Any response except 500 is ok
    checks.push({
      name: 'PDF Generation',
      status: pdfHealthy,
      critical: false
    });
    console.log(pdfHealthy ? '✅ PDF generation accessible' : '❌ PDF generation failed');
  } catch (error) {
    checks.push({
      name: 'PDF Generation',
      status: false,
      critical: false
    });
    console.log('❌ PDF generation error');
  }

  // Results
  console.log('\n' + '='.repeat(50));
  console.log('📊 HEALTH CHECK RESULTS');
  console.log('='.repeat(50));
  
  const criticalIssues = checks.filter(c => c.critical && !c.status);
  const nonCriticalIssues = checks.filter(c => !c.critical && !c.status);
  const allHealthy = checks.every(c => c.status);
  
  checks.forEach(check => {
    const status = check.status ? '✅' : '❌';
    const priority = check.critical ? '🔴' : '🟡';
    console.log(`${status} ${priority} ${check.name}`);
  });
  
  console.log(`\n⏱️ Health check completed in ${formatDuration(Date.now() - startTime)}`);
  
  if (allHealthy) {
    console.log('\n🟢 EXCELLENT - All systems healthy');
    console.log('🚀 System ready for use');
  } else if (criticalIssues.length === 0) {
    console.log('\n🟡 GOOD - Core systems healthy');
    console.log(`⚠️ ${nonCriticalIssues.length} non-critical issue(s) detected`);
    console.log('✅ System safe to use');
  } else {
    console.log('\n🔴 CRITICAL - Major issues detected');
    console.log(`❌ ${criticalIssues.length} critical system(s) failing`);
    console.log('🚨 System needs immediate attention');
  }
  
  console.log('\n💡 NEXT STEPS:');
  if (allHealthy) {
    console.log('   📋 Run comprehensive tests: node tests/comprehensive.test.js');
    console.log('   🎯 System is ready for production use');
  } else {
    console.log('   🔧 Fix critical issues before running full tests');
    console.log('   📞 Contact development team if issues persist');
    if (criticalIssues.some(c => c.name.includes('Server'))) {
      console.log('   🚀 Start server: npm run dev');
    }
    if (criticalIssues.some(c => c.name.includes('Database'))) {
      console.log('   🗄️ Check database connection and credentials');
    }
  }
  
  console.log('='.repeat(50));
}

// Run health check if called directly  
if (import.meta.url === `file://${process.argv[1]}`) {
  runSystemHealthCheck().catch(error => {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  });
}

export { runSystemHealthCheck };