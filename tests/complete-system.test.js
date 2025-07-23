/**
 * Complete System Test - Master Test Runner for All Components
 * Run with: node tests/complete-system.test.js
 */

import { runAPITests } from './api.test.js';
import { runDatabaseTests } from './database.test.js';
import { runAITests } from './ai.test.js';
import { runPDFTests } from './pdf.test.js';
import { runIntegrationTests } from './integration.test.js';
import { runExpenseTests } from './expense.test.js';
import { runAdvancedFeatureTests } from './advanced-features.test.js';
import { runEmailTests } from './email.test.js';
import { runQRTests } from './qr-codes.test.js';
import { runRecurringTests } from './recurring.test.js';
import { runExportTests } from './export.test.js';
import { runItemsTests } from './items.test.js';

class CompleteSystemTester {
  constructor() {
    this.results = {};
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.startTime = Date.now();
  }

  async runTestSuite(name, testFunction) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 SPOUŠTÍM: ${name.toUpperCase()}`);
    console.log(`${'='.repeat(60)}`);
    
    const suiteStartTime = Date.now();
    
    try {
      const success = await testFunction();
      const duration = Date.now() - suiteStartTime;
      
      this.results[name] = {
        status: success ? 'PASSED' : 'FAILED',
        duration: duration,
        timestamp: new Date().toISOString()
      };
      
      if (success) {
        this.passedTests++;
        console.log(`\n✅ ${name} - ÚSPĚCH (${duration}ms)`);
      } else {
        this.failedTests++;
        console.log(`\n❌ ${name} - NEÚSPĚCH (${duration}ms)`);
      }
      
      this.totalTests++;
      
    } catch (error) {
      const duration = Date.now() - suiteStartTime;
      
      this.results[name] = {
        status: 'ERROR',
        duration: duration,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      this.failedTests++;
      this.totalTests++;
      
      console.log(`\n💥 ${name} - CHYBA: ${error.message} (${duration}ms)`);
    }
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const successRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 KOMPLETNÍ SYSTÉMOVÝ REPORT`);
    console.log(`${'='.repeat(80)}`);
    console.log(``);
    console.log(`🕐 Celkový čas: ${totalDuration}ms (${(totalDuration/1000).toFixed(1)}s)`);
    console.log(`📈 Úspěšnost: ${successRate}% (${this.passedTests}/${this.totalTests})`);
    console.log(`✅ Úspěšné: ${this.passedTests}`);
    console.log(`❌ Neúspěšné: ${this.failedTests}`);
    console.log(``);
    
    console.log(`📋 DETAILNÍ VÝSLEDKY:`);
    console.log(`${'─'.repeat(80)}`);
    
    Object.entries(this.results).forEach(([name, result]) => {
      const statusIcon = result.status === 'PASSED' ? '✅' : 
                        result.status === 'FAILED' ? '❌' : '💥';
      const durationStr = `${result.duration}ms`.padStart(8);
      
      console.log(`${statusIcon} ${name.padEnd(20)} ${durationStr} ${result.status}`);
      
      if (result.error) {
        console.log(`   ⚠️ Chyba: ${result.error}`);
      }
    });
    
    console.log(``);
    
    // Seskupení podle kategorií
    console.log(`📊 KATEGORIE TESTŮ:`);
    console.log(`${'─'.repeat(50)}`);
    
    const categories = {
      'Základní funkce': ['API Tests', 'Database Tests', 'Items Tests'],
      'AI & Intelligence': ['AI Tests', 'Advanced Feature Tests'],
      'Dokumenty & PDF': ['PDF Tests', 'QR Codes Tests'],
      'Komunikace': ['Email Tests'],
      'Automatizace': ['Recurring Tests'],
      'Export & Integrace': ['Export Tests', 'Integration Tests'],
      'Náklady': ['Expense Tests']
    };
    
    Object.entries(categories).forEach(([category, tests]) => {
      const categoryResults = tests.map(test => this.results[test]).filter(Boolean);
      const passed = categoryResults.filter(r => r.status === 'PASSED').length;
      const total = categoryResults.length;
      const percentage = total > 0 ? ((passed / total) * 100).toFixed(0) : '0';
      
      console.log(`  ${category.padEnd(20)} ${passed}/${total} (${percentage}%)`);
    });
    
    console.log(``);
    
    // Doporučení na základě výsledků
    if (this.failedTests === 0) {
      console.log(`🏆 VÝBORNĚ! Všechny testy prošly úspěšně.`);
      console.log(`   Systém je připraven k nasazení.`);
    } else if (successRate >= 80) {
      console.log(`👍 DOBŘE! Většina testů prošla úspěšně.`);
      console.log(`   Systém je stabilní s drobnými problémy.`);
    } else if (successRate >= 60) {
      console.log(`⚠️ STŘEDNÍ! Některé testy selhaly.`);
      console.log(`   Doporučujeme opravit kritické chyby.`);
    } else {
      console.log(`🚨 KRITICKÉ! Mnoho testů selhalo.`);
      console.log(`   Systém potřebuje významné opravy.`);
    }
    
    console.log(``);
    console.log(`📝 DALŠÍ KROKY:`);
    
    const failedSuites = Object.entries(this.results)
      .filter(([name, result]) => result.status !== 'PASSED')
      .map(([name]) => name);
    
    if (failedSuites.length > 0) {
      console.log(`   1. Opravit selhané testy: ${failedSuites.join(', ')}`);
      console.log(`   2. Spustit pouze selhané testy pro ověření`);
      console.log(`   3. Po opravě spustit kompletní test znovu`);
    } else {
      console.log(`   1. Systém je připraven k nasazení`);
      console.log(`   2. Můžete nastavit pravidelné spouštění testů`);
      console.log(`   3. Monitorovat výkon v produkci`);
    }
    
    console.log(`${'='.repeat(80)}`);
    
    return this.failedTests === 0;
  }

  async saveReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        total: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests,
        successRate: ((this.passedTests / this.totalTests) * 100).toFixed(1)
      },
      results: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    
    try {
      const fs = await import('fs/promises');
      const reportPath = `test-reports/system-test-${new Date().toISOString().split('T')[0]}.json`;
      
      // Vytvoříme adresář pokud neexistuje
      try {
        await fs.mkdir('test-reports', { recursive: true });
      } catch (error) {
        // Adresář už existuje
      }
      
      await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
      console.log(`📄 Report uložen: ${reportPath}`);
      
    } catch (error) {
      console.log(`⚠️ Nepodařilo se uložit report: ${error.message}`);
    }
  }
}

async function runCompleteSystemTest() {
  const tester = new CompleteSystemTester();
  
  console.log(`🚀 SPOUŠTÍM KOMPLETNÍ SYSTÉMOVÝ TEST`);
  console.log(`⏰ Začátek: ${new Date().toLocaleString('cs-CZ')}`);
  console.log(`📋 Počet test suitů: 12`);
  console.log(``);
  
  // Základní funkční testy
  await tester.runTestSuite('API Tests', runAPITests);
  await tester.runTestSuite('Database Tests', runDatabaseTests);
  await tester.runTestSuite('Items Tests', runItemsTests);
  
  // AI a pokročilé funkce
  await tester.runTestSuite('AI Tests', runAITests);
  await tester.runTestSuite('Advanced Feature Tests', runAdvancedFeatureTests);
  
  // Dokumenty a generování
  await tester.runTestSuite('PDF Tests', runPDFTests);
  await tester.runTestSuite('QR Codes Tests', runQRTests);
  
  // Komunikace a automatizace
  await tester.runTestSuite('Email Tests', runEmailTests);
  await tester.runTestSuite('Recurring Tests', runRecurringTests);
  
  // Export a integrace
  await tester.runTestSuite('Export Tests', runExportTests);
  await tester.runTestSuite('Integration Tests', runIntegrationTests);
  
  // Náklady
  await tester.runTestSuite('Expense Tests', runExpenseTests);
  
  // Generujeme a ukládáme report
  const success = tester.generateReport();
  await tester.saveReport();
  
  return success;
}

// Spuštění testů pokud je soubor spuštěn přímo
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteSystemTest().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Kritická chyba při spouštění testů:', error);
    process.exit(1);
  });
}

export { runCompleteSystemTest };