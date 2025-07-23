/**
 * Test Runner - Execute All Test Suites
 * Run with: node tests/run-all.js
 */

import { runCompleteSystemTest } from './complete-system.test.js';

class TestSuite {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async runSuite(name, testFn) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🧪 RUNNING: ${name.toUpperCase()}`);
    console.log(`${'='.repeat(50)}`);
    
    const suiteStart = Date.now();
    let success = false;
    
    try {
      success = await testFn();
      const duration = Date.now() - suiteStart;
      console.log(`\n⏱️  ${name} completed in ${duration}ms`);
      
      this.results.push({
        name,
        success,
        duration,
        status: success ? 'PASSED' : 'FAILED'
      });
    } catch (error) {
      const duration = Date.now() - suiteStart;
      console.log(`\n💥 ${name} crashed: ${error.message}`);
      
      this.results.push({
        name,
        success: false,
        duration,
        status: 'CRASHED',
        error: error.message
      });
    }
    
    return success;
  }

  summary() {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.length - passed;
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 FINAL TEST RESULTS');
    console.log('='.repeat(60));
    
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = `${result.duration}ms`.padStart(8);
      console.log(`${status} ${result.name.padEnd(20)} ${duration} ${result.status}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('-'.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Time: ${Math.round(totalDuration/1000)}s`);
    console.log('-'.repeat(60));
    
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Application is ready for deployment.');
    } else {
      console.log('⚠️  Some tests failed. Please review and fix issues before deployment.');
    }
    
    return failed === 0;
  }
}

async function runAllTests() {
  console.log('🎯 SPOUŠTÍM KOMPLETNÍ SYSTÉMOVÝ TEST');
  console.log('='.repeat(50));
  console.log('ℹ️  Nyní používáme nový kompletní test runner');
  console.log('   který zahrnuje všechny funkce systému');
  console.log('='.repeat(50));
  
  return await runCompleteSystemTest();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test suite execution failed:', error);
    process.exit(1);
  });
}

export { runAllTests };