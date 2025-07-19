/**
 * Quick Test - Fast verification of core functions
 * Run with: node tests/quick-test.js
 */

const API_BASE = 'http://localhost:5000';
const TEST_SESSION = 'test-session-dev';

class QuickTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${name} - ${error.message}`);
      this.failed++;
    }
  }

  async apiCall(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_SESSION}`,
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
  }

  summary() {
    console.log(`\n📊 Výsledek: ${this.passed}✅ / ${this.failed}❌`);
    return this.failed === 0;
  }
}

async function runQuickTest() {
  const tester = new QuickTester();

  console.log('🚀 Rychlé ověření klíčových funkcí\n');

  // 1. Server komunikace
  await tester.test('Server responds', async () => {
    await tester.apiCall('/api/auth/validate');
  });

  // 2. AI funguje
  await tester.test('AI Chat works', async () => {
    const result = await tester.apiCall('/api/chat/universal', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Ahoj',
        context: '',
        currentPath: '/dashboard'
      })
    });
    if (!result.content) throw new Error('No AI response');
  });

  // 3. AI vytváří fakturu
  await tester.test('AI creates invoice', async () => {
    const result = await tester.apiCall('/api/chat/universal', {
      method: 'POST',
      body: JSON.stringify({
        message: 'vytvoř fakturu Quick Test za služby 1000 Kč',
        context: '',
        currentPath: '/dashboard'
      })
    });
    if (!result.action || !result.action.data.path.includes('invoices')) {
      throw new Error('AI did not create invoice');
    }
  });

  // 4. Databáze funguje
  await tester.test('Database works', async () => {
    const invoices = await tester.apiCall('/api/invoices');
    const customers = await tester.apiCall('/api/customers');
    if (!Array.isArray(invoices) || !Array.isArray(customers)) {
      throw new Error('Database queries failed');
    }
  });

  // 5. Statistiky se načítají
  await tester.test('Stats load', async () => {
    const stats = await tester.apiCall('/api/stats');
    if (typeof stats.revenue !== 'number') {
      throw new Error('Stats malformed');
    }
  });

  const success = tester.summary();
  
  if (success) {
    console.log('\n🎉 Všechny klíčové funkce fungují!');
    console.log('📋 Pro kompletní test spusťte: node tests/run-all.js');
  } else {
    console.log('\n⚠️ Některé funkce nefungují - zkontrolujte aplikaci.');
  }
  
  return success;
}

// Run if called directly
if (typeof window === 'undefined') {
  runQuickTest().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Quick test failed:', error);
    process.exit(1);
  });
}

export { runQuickTest };