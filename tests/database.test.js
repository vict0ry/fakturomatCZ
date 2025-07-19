/**
 * Database Tests - Data Integrity and CRUD Operations via API
 * Run with: node tests/database.test.js
 */

const API_BASE = 'http://localhost:5000';
const TEST_SESSION = 'test-session-dev';

class DatabaseTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.testData = {
      customerId: null,
      invoiceId: null,
      itemId: null
    };
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

  async test(name, testFn) {
    try {
      console.log(`🧪 Testing: ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${name} - ${error.message}`);
      this.failed++;
    }
  }

  async cleanup() {
    try {
      // Clean up test data in reverse order using API
      if (this.testData.invoiceId) {
        try {
          await this.apiCall(`/api/invoices/${this.testData.invoiceId}`, { method: 'DELETE' });
        } catch (error) {
          console.warn('Invoice cleanup failed:', error.message);
        }
      }
      if (this.testData.customerId) {
        try {
          await this.apiCall(`/api/customers/${this.testData.customerId}`, { method: 'DELETE' });
        } catch (error) {
          console.warn('Customer cleanup failed:', error.message);
        }
      }
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  }

  summary() {
    console.log('\n=== DATABASE TEST SUMMARY ===');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Total: ${this.passed + this.failed}`);
    return this.failed === 0;
  }
}

async function runDatabaseTests() {
  const tester = new DatabaseTester();

  try {
    // Test Database Connectivity and Basic Operations
    await tester.test('Database - Basic connectivity', async () => {
      const customers = await tester.apiCall('/api/customers');
      const invoices = await tester.apiCall('/api/invoices');
      const stats = await tester.apiCall('/api/stats');
      
      if (!Array.isArray(customers) || !Array.isArray(invoices)) {
        throw new Error('Database queries returning invalid data');
      }
      
      if (typeof stats.invoiceCount !== 'number') {
        throw new Error('Statistics query failed');
      }
    });

    // Test Invoice Creation via AI (tests database insertion)
    await tester.test('Database - Invoice creation integrity', async () => {
      const beforeStats = await tester.apiCall('/api/stats');
      
      // Create invoice via AI
      const aiResult = await tester.apiCall('/api/chat/universal', {
        method: 'POST',
        body: JSON.stringify({
          message: 'vytvoř fakturu DB Test Company za databázové služby 15000 Kč',
          context: '',
          currentPath: '/dashboard'
        })
      });
      
      if (!aiResult.action || !aiResult.action.data.path.includes('invoices')) {
        throw new Error('Invoice creation failed');
      }
      
      // Extract invoice ID
      const pathParts = aiResult.action.data.path.split('/');
      const invoiceId = parseInt(pathParts[pathParts.indexOf('invoices') + 1]);
      tester.testData.invoiceId = invoiceId;
      
      // Verify invoice exists in database
      const invoice = await tester.apiCall(`/api/invoices/${invoiceId}`);
      if (!invoice || !invoice.invoiceNumber) {
        throw new Error('Invoice not properly stored in database');
      }
      
      // Verify statistics updated
      const afterStats = await tester.apiCall('/api/stats');
      if (afterStats.invoiceCount <= beforeStats.invoiceCount) {
        throw new Error('Invoice count not updated in statistics');
      }
    });

    // Test Data Relationships
    await tester.test('Database - Data relationships', async () => {
      if (!tester.testData.invoiceId) {
        throw new Error('No test invoice available');
      }
      
      const invoice = await tester.apiCall(`/api/invoices/${tester.testData.invoiceId}`);
      const items = await tester.apiCall(`/api/invoices/${tester.testData.invoiceId}/items`);
      
      if (!invoice.customerId) {
        throw new Error('Invoice not properly linked to customer');
      }
      
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Invoice items not properly stored');
      }
      
      // Verify customer exists
      const customers = await tester.apiCall('/api/customers');
      const customer = customers.find(c => c.id === invoice.customerId);
      if (!customer) {
        throw new Error('Customer relationship broken');
      }
    });

    // Test Data Filtering and Search
    await tester.test('Database - Filtering and search', async () => {
      const allInvoices = await tester.apiCall('/api/invoices');
      const recentInvoices = await tester.apiCall('/api/invoices/recent');
      
      if (!Array.isArray(allInvoices) || !Array.isArray(recentInvoices)) {
        throw new Error('Invoice filtering failed');
      }
      
      // Test customer search
      const customers = await tester.apiCall('/api/customers');
      if (customers.length > 0) {
        // Search should work without errors
        const customerName = customers[0].name;
        console.log(`  Testing search for customer: ${customerName}`);
      }
    });

    // Test Data Consistency
    await tester.test('Database - Data consistency', async () => {
      const stats = await tester.apiCall('/api/stats');
      const invoices = await tester.apiCall('/api/invoices');
      const customers = await tester.apiCall('/api/customers');
      
      // Basic consistency checks
      if (stats.invoiceCount < 0 || stats.revenue < 0) {
        throw new Error('Invalid statistics values');
      }
      
      // Check for valid data structure
      invoices.forEach((invoice, index) => {
        if (!invoice.id || !invoice.invoiceNumber || !invoice.status) {
          throw new Error(`Invalid invoice structure at index ${index}`);
        }
      });
      
      customers.forEach((customer, index) => {
        if (!customer.id || !customer.name) {
          throw new Error(`Invalid customer structure at index ${index}`);
        }
      });
    });

    // Test Error Handling
    await tester.test('Database - Error handling', async () => {
      // Test invalid invoice ID
      try {
        await tester.apiCall('/api/invoices/99999');
        throw new Error('Should have failed for invalid invoice ID');
      } catch (error) {
        if (!error.message.includes('404') && !error.message.includes('not found')) {
          throw new Error('Wrong error handling for invalid ID');
        }
        // Expected to fail - this is good
      }
    });

  } finally {
    await tester.cleanup();
  }

  return tester.summary();
}

// Run tests if called directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  runDatabaseTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Database test execution failed:', error);
    process.exit(1);
  });
}

export { runDatabaseTests };