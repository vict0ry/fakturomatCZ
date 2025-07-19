/**
 * API Tests - Core Backend Functionality
 * Run with: node tests/api.test.js
 */

const API_BASE = 'http://localhost:5000';
const TEST_SESSION = 'test-session-dev';

class APITester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Testing: ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      this.passed++;
      this.results.push({ name, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ FAILED: ${name} - ${error.message}`);
      this.failed++;
      this.results.push({ name, status: 'FAILED', error: error.message });
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  summary() {
    console.log('\n=== TEST SUMMARY ===');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Total: ${this.passed + this.failed}`);
    
    if (this.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => r.status === 'FAILED').forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    }
    
    return this.failed === 0;
  }
}

async function runAPITests() {
  const tester = new APITester();

  // Authentication Tests
  await tester.test('Auth - User validation', async () => {
    const result = await tester.apiCall('/api/auth/validate');
    if (!result.user || !result.user.id) {
      throw new Error('User validation failed');
    }
  });

  // Statistics Tests
  await tester.test('Stats - Dashboard data', async () => {
    const result = await tester.apiCall('/api/stats');
    if (typeof result.revenue !== 'number' || typeof result.invoiceCount !== 'number') {
      throw new Error('Invalid stats data structure');
    }
  });

  // Invoice Tests
  await tester.test('Invoices - List retrieval', async () => {
    const result = await tester.apiCall('/api/invoices');
    if (!Array.isArray(result)) {
      throw new Error('Invoices should return array');
    }
  });

  await tester.test('Invoices - Recent invoices', async () => {
    const result = await tester.apiCall('/api/invoices/recent');
    if (!Array.isArray(result)) {
      throw new Error('Recent invoices should return array');
    }
  });

  // Customer Tests
  await tester.test('Customers - List retrieval', async () => {
    const result = await tester.apiCall('/api/customers');
    if (!Array.isArray(result)) {
      throw new Error('Customers should return array');
    }
  });

  // AI Chat Tests
  await tester.test('AI Chat - Basic response', async () => {
    const result = await tester.apiCall('/api/chat/universal', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Ahoj, jak se máš?',
        context: '',
        currentPath: '/dashboard'
      })
    });
    
    if (!result.content || typeof result.content !== 'string') {
      throw new Error('AI should return content string');
    }
  });

  await tester.test('AI Chat - Invoice creation', async () => {
    const result = await tester.apiCall('/api/chat/universal', {
      method: 'POST',
      body: JSON.stringify({
        message: 'vytvoř fakturu TestCompany za konzultace 5000 Kč',
        context: '',
        currentPath: '/dashboard'
      })
    });
    
    if (!result.content || !result.action || result.action.type !== 'navigate') {
      throw new Error('AI invoice creation should return navigation action');
    }
  });

  // ARES Integration Tests (skip if not available)
  await tester.test('ARES - Company search', async () => {
    try {
      const result = await tester.apiCall('/api/ares/search?query=Microsoft');
      if (!Array.isArray(result)) {
        throw new Error('ARES search should return array');
      }
    } catch (error) {
      if (error.message.includes('<!DOCTYPE') || error.message.includes('HTML')) {
        console.log('  ⚠️  ARES endpoint returned HTML - skipping test');
        return; // Skip this test
      }
      throw error;
    }
  });

  return tester.summary();
}

// Run tests if called directly
if (typeof window === 'undefined') {
  runAPITests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { runAPITests };