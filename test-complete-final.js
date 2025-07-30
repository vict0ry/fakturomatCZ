#!/usr/bin/env node

/**
 * 🚀 FINÁLNÍ KOMPLETNÍ TEST VŠECH FUNKCÍ
 */

import { spawn } from 'child_process';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

async function runTest(testName, testFile) {
  console.log(`\n🧪 Spouštím: ${testName}`);
  console.log('─'.repeat(50));
  
  return new Promise((resolve) => {
    const child = spawn('node', [testFile], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      const success = code === 0;
      console.log(`${success ? '✅' : '❌'} ${testName}: ${success ? 'ÚSPĚCH' : 'SELHAL'}`);
      resolve({ name: testName, success, code });
    });
  });
}

async function runAllTests() {
  console.log('🚀 SPOUŠTÍM KOMPLETNÍ TESTOVÁNÍ VŠECH FUNKCÍ');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Modular API Structure', file: 'test-modular-structure.js' },
    { name: 'Email System', file: 'test-email-system.js' },
    { name: 'Email Final Test', file: 'test-final-email-system.cjs' },
    { name: 'Deployment Readiness', file: 'final-deployment-test.js' },
    { name: 'Admin Login', file: 'test-admin-login.js' }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test.name, test.file);
    results.push(result);
    await sleep(1000); // Krátká pauza mezi testy
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VÝSLEDKY VŠECH TESTŮ');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });
  
  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Úspěšné: ${passed}`);
  console.log(`❌ Neúspěšné: ${failed}`);
  console.log(`📈 Celková úspěšnost: ${Math.round((passed / results.length) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 VŠECHNY TESTY PROŠLY!');
    console.log('✅ Systém je připraven k nasazení');
    console.log('🚀 Deploy může pokračovat');
  } else if (passed >= results.length * 0.8) {
    console.log('\n⚠️ VĚTŠINA TESTŮ PROŠLA');
    console.log('✅ Systém je většinou připraven');
    console.log('🚀 Deploy možný s menšími riziky');
  } else {
    console.log('\n🚨 PŘÍLIŠ MNOHO TESTŮ SELHALO');
    console.log('❌ Systém vyžaduje další opravy');
  }

  return failed === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };