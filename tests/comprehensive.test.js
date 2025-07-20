#!/usr/bin/env node

/**
 * 🧪 Comprehensive Test Suite
 * Runs all test suites and provides overall system health report
 */

import { runAPITests } from './api.test.js';
import { runAITests } from './ai.test.js';
import { runPDFTests } from './pdf.test.js';
import { runIntegrationTests } from './integration.test.js';
import { runExpenseTests } from './expense.test.js';
import { runAdvancedFeatureTests } from './advanced-features.test.js';
import { checkServerHealth, formatDuration } from './helpers/test-utils.js';

async function runComprehensiveTests() {
  console.log('🚀 === COMPREHENSIVE SYSTEM TEST SUITE ===\n');
  
  const overallStartTime = Date.now();
  let totalPassed = 0;
  let totalFailed = 0;
  const testResults = [];

  // Check server health first
  console.log('🔍 Checking server health...');
  const serverHealthy = await checkServerHealth();
  
  if (!serverHealthy) {
    console.log('❌ Server is not running or not accessible at http://localhost:5000');
    console.log('💡 Please start the server with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running and accessible\n');

  // Test suites to run
  const testSuites = [
    { name: 'Core API', func: runAPITests, critical: true },
    { name: 'AI Assistant', func: runAITests, critical: true },
    { name: 'Expense Management', func: runExpenseTests, critical: true },
    { name: 'PDF Generation', func: runPDFTests, critical: false },
    { name: 'Advanced Features', func: runAdvancedFeatureTests, critical: false },
    { name: 'Integration Tests', func: runIntegrationTests, critical: true }
  ];

  // Run each test suite
  for (const suite of testSuites) {
    try {
      console.log(`\n📋 Running ${suite.name} tests...`);
      const result = await suite.func();
      
      testResults.push({
        name: suite.name,
        ...result,
        critical: suite.critical,
        success: result.failed === 0
      });
      
      totalPassed += result.passed;
      totalFailed += result.failed;
      
    } catch (error) {
      console.log(`❌ Error running ${suite.name} tests: ${error.message}`);
      testResults.push({
        name: suite.name,
        passed: 0,
        failed: 1,
        total: 1,
        critical: suite.critical,
        success: false,
        error: error.message
      });
      totalFailed += 1;
    }
  }

  // Overall results
  console.log('\n' + '='.repeat(60));
  console.log('📊 === COMPREHENSIVE TEST RESULTS ===');
  console.log('='.repeat(60));
  
  // Individual suite results
  testResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const critical = result.critical ? '🔴' : '🟡';
    console.log(`${status} ${critical} ${result.name}: ${result.passed}✅ / ${result.failed}❌`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });
  
  console.log('\n' + '-'.repeat(60));
  console.log(`📈 OVERALL RESULT: ${totalPassed}✅ / ${totalFailed}❌`);
  console.log(`⏱️ Total Duration: ${formatDuration(Date.now() - overallStartTime)}`);
  
  // Categorize results
  const criticalSuites = testResults.filter(r => r.critical);
  const nonCriticalSuites = testResults.filter(r => !r.critical);
  
  const criticalFailures = criticalSuites.filter(r => !r.success).length;
  const nonCriticalFailures = nonCriticalSuites.filter(r => !r.success).length;
  
  console.log('\n🎯 SYSTEM HEALTH ASSESSMENT:');
  
  if (criticalFailures === 0 && nonCriticalFailures === 0) {
    console.log('🟢 EXCELLENT - All systems operational');
    console.log('   ✅ All critical features working');
    console.log('   ✅ All advanced features working');
    console.log('   🚀 System ready for production use');
  } else if (criticalFailures === 0 && nonCriticalFailures > 0) {
    console.log('🟡 GOOD - Core system functional');
    console.log('   ✅ All critical features working');
    console.log(`   ⚠️ ${nonCriticalFailures} advanced feature(s) need attention`);
    console.log('   ✅ System safe for production use');
  } else if (criticalFailures <= 2) {
    console.log('🟠 CAUTION - Some issues detected');
    console.log(`   ⚠️ ${criticalFailures} critical feature(s) failing`);
    console.log(`   ⚠️ ${nonCriticalFailures} advanced feature(s) failing`);
    console.log('   🔧 Fix critical issues before production');
  } else {
    console.log('🔴 CRITICAL - Major issues detected');
    console.log(`   ❌ ${criticalFailures} critical features failing`);
    console.log(`   ❌ ${nonCriticalFailures} advanced features failing`);
    console.log('   🚨 System not ready for production');
  }
  
  // Feature coverage report
  console.log('\n📋 FEATURE COVERAGE REPORT:');
  console.log('   🔐 Authentication & Security');
  console.log('   📊 Dashboard & Analytics');
  console.log('   🧾 Invoice Management (CRUD)');
  console.log('   👥 Customer Management');
  console.log('   💰 Expense Management');
  console.log('   🤖 AI Assistant & Function Calling');
  console.log('   📄 PDF Generation');
  console.log('   🔗 Invoice Sharing');
  console.log('   📧 Email Integration');
  console.log('   🏢 ARES Company Lookup');
  console.log('   👁️ Vision API for Receipts');
  console.log('   📈 Business Intelligence');
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (totalFailed === 0) {
    console.log('   🎉 System is fully functional - ready to deploy!');
    console.log('   🔄 Run tests regularly after code changes');
    console.log('   📈 Consider adding performance monitoring');
  } else {
    const failedSuites = testResults.filter(r => !r.success);
    console.log('   🔧 Priority fixes needed:');
    failedSuites.forEach(suite => {
      if (suite.critical) {
        console.log(`      🔴 HIGH: Fix ${suite.name} issues`);
      } else {
        console.log(`      🟡 MEDIUM: Investigate ${suite.name} failures`);
      }
    });
    console.log('   📞 Contact development team if issues persist');
  }
  
  console.log('\n📚 TEST DOCUMENTATION:');
  console.log('   📖 See TEST_COMMANDS.md for individual test commands');
  console.log('   🔍 Run specific test suites to debug issues');
  console.log('   🤖 Test AI features manually via chat interface');
  
  console.log('\n' + '='.repeat(60));
  
  // Exit with appropriate code
  const exitCode = criticalFailures > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Run comprehensive tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests().catch(error => {
    console.error('❌ Comprehensive test suite failed:', error.message);
    process.exit(1);
  });
}

export { runComprehensiveTests };