/**
 * AI Tests - Natural Language Processing and Actions
 * Run with: node tests/ai.test.js
 */

const API_BASE = 'http://localhost:5000';
const TEST_SESSION = 'test-session-dev';

class AITester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Testing AI: ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${name} - ${error.message}`);
      this.failed++;
    }
  }

  async aiChat(message, currentPath = '/dashboard') {
    const response = await fetch(`${API_BASE}/api/chat/universal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_SESSION}`
      },
      body: JSON.stringify({
        message,
        context: '',
        currentPath
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  summary() {
    console.log('\n=== AI TEST SUMMARY ===');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Total: ${this.passed + this.failed}`);
    return this.failed === 0;
  }
}

async function runAITests() {
  const tester = new AITester();

  // Basic Communication Tests
  await tester.test('Basic greeting', async () => {
    const result = await tester.aiChat('Ahoj, jak se máš?');
    if (!result.content || result.content.length < 5) {
      throw new Error('AI should provide meaningful response');
    }
  });

  await tester.test('Help request', async () => {
    const result = await tester.aiChat('Co všechno umíš?');
    if (!result.content || result.content.length < 20) {
      throw new Error('AI should provide detailed capabilities response');
    }
    // Check for key capabilities mentioned
    const content = result.content.toLowerCase();
    if (!content.includes('asistent') && !content.includes('pomoct') && !content.includes('vytvoř')) {
      throw new Error('AI should mention its assistant capabilities');
    }
  });

  // Navigation Tests
  await tester.test('Navigate to customers', async () => {
    const result = await tester.aiChat('přejdi na zákazníky');
    if (!result.action || result.action.type !== 'navigate' || !result.action.data.path.includes('customers')) {
      throw new Error('AI should navigate to customers page');
    }
  });

  await tester.test('Navigate to invoices', async () => {
    const result = await tester.aiChat('zobraz faktury');
    if (!result.action || result.action.type !== 'navigate' || !result.action.data.path.includes('invoices')) {
      throw new Error('AI should navigate to invoices page');
    }
  });

  // Invoice Creation Tests
  await tester.test('Simple invoice creation', async () => {
    const result = await tester.aiChat('vytvoř fakturu TestCompany za služby 15000 Kč');
    if (!result.action || result.action.type !== 'navigate' || !result.action.data.path.includes('invoices')) {
      throw new Error('AI should create invoice and navigate to edit');
    }
    if (!result.content.includes('fakturu') || !result.content.includes('TestCompany')) {
      throw new Error('AI should confirm invoice creation with customer name');
    }
  });

  await tester.test('Multi-item invoice creation', async () => {
    const result = await tester.aiChat('vytvoř fakturu ABC: 5kg produktu A, 3ks produktu B, 10m produktu C za 50000 Kč');
    if (!result.action || result.action.type !== 'navigate') {
      throw new Error('AI should handle multi-item invoices');
    }
    // Check that multiple items are mentioned (more flexible check)
    const content = result.content.toLowerCase();
    const hasMultipleItems = (content.includes('5') && content.includes('3') && content.includes('10')) ||
                            content.includes('položky') || content.includes('items');
    if (!hasMultipleItems) {
      throw new Error('AI should indicate multiple items were processed');
    }
  });

  await tester.test('Invoice without amount', async () => {
    const result = await tester.aiChat('vytvoř fakturu XYZ Company za konzultace');
    if (!result.action || result.action.type !== 'navigate') {
      throw new Error('AI should create invoice even without amount');
    }
    if (!result.content.includes('doplnit') && !result.content.includes('částka')) {
      throw new Error('AI should mention that amount needs to be added');
    }
  });

  // Search and Status Tests
  await tester.test('Invoice search by customer', async () => {
    const result = await tester.aiChat('najdi faktury pro TestCompany');
    if (!result.action || result.action.type !== 'navigate' || !result.action.data.path.includes('invoices')) {
      throw new Error('AI should search invoices by customer');
    }
  });

  await tester.test('Unpaid invoices filter', async () => {
    const result = await tester.aiChat('zobraz neplacené faktury');
    if (!result.action || !result.action.data.path.includes('status=sent')) {
      throw new Error('AI should filter unpaid invoices');
    }
  });

  await tester.test('Paid invoices filter', async () => {
    const result = await tester.aiChat('najdi zaplacené faktury');
    if (!result.action || !result.action.data.path.includes('status=paid')) {
      throw new Error('AI should filter paid invoices');
    }
  });

  // Advanced Feature Tests
  await tester.test('Czech language processing', async () => {
    const result = await tester.aiChat('vytvořte fakturu pro společnost Škoda Auto za dodávku 25 kusů automobilových dílů v hodnotě 125 000 korun českých');
    if (!result.action || !result.content.includes('Škoda Auto')) {
      throw new Error('AI should handle complex Czech language with diacritics');
    }
  });

  await tester.test('Short amount format (k = thousands)', async () => {
    const result = await tester.aiChat('vytvoř fakturu TestCorp za práci 25k');
    if (!result.content.includes('25') || (!result.content.includes('000') && !result.content.includes('25 000'))) {
      throw new Error('AI should convert "25k" to "25000" or display as "25 000"');
    }
  });

  await tester.test('Error handling - incomplete request', async () => {
    const result = await tester.aiChat('vytvoř fakturu');
    if (!result.content || !result.content.toLowerCase().includes('potřeb')) {
      throw new Error('AI should ask for missing information');
    }
  });

  await tester.test('Context awareness', async () => {
    const result = await tester.aiChat('co je na této stránce?', '/invoices');
    if (!result.content || !result.content.toLowerCase().includes('faktur')) {
      throw new Error('AI should understand current page context');
    }
  });

  return tester.summary();
}

// Run tests if called directly
if (typeof window === 'undefined') {
  runAITests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('AI test execution failed:', error);
    process.exit(1);
  });
}

export { runAITests };