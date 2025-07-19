/**
 * Integration Tests - End-to-End User Workflows
 * Run with: node tests/integration.test.js
 */

const API_BASE = 'http://localhost:5000';
const TEST_SESSION = 'test-session-dev';

class IntegrationTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.cleanup = [];
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Integration Test: ${name}`);
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  async aiChat(message, currentPath = '/dashboard') {
    return this.apiCall('/api/chat/universal', {
      method: 'POST',
      body: JSON.stringify({
        message,
        context: '',
        currentPath
      })
    });
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...');
    for (const cleanupFn of this.cleanup.reverse()) {
      try {
        await cleanupFn();
      } catch (error) {
        console.warn('Cleanup warning:', error.message);
      }
    }
  }

  summary() {
    console.log('\n=== INTEGRATION TEST SUMMARY ===');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Total: ${this.passed + this.failed}`);
    return this.failed === 0;
  }
}

async function runIntegrationTests() {
  const tester = new IntegrationTester();

  try {
    // Test 1: Complete Invoice Creation Workflow
    let testInvoiceId = null;
    let testCustomerId = null;

    await tester.test('Workflow - Complete invoice creation via AI', async () => {
      // Step 1: Create invoice via AI
      const aiResult = await tester.aiChat('vytvoř fakturu Integration Test Company za testovací služby 15000 Kč');
      
      if (!aiResult.action || !aiResult.action.data || !aiResult.action.data.path) {
        throw new Error('AI did not return navigation action');
      }
      
      // Extract invoice ID
      const pathParts = aiResult.action.data.path.split('/');
      testInvoiceId = parseInt(pathParts[pathParts.indexOf('invoices') + 1]);
      
      if (!testInvoiceId) {
        throw new Error('Failed to extract invoice ID from AI response');
      }
      
      // Step 2: Verify invoice was created
      const invoice = await tester.apiCall(`/api/invoices/${testInvoiceId}`);
      if (!invoice || invoice.invoiceNumber === '') {
        throw new Error('Invoice was not properly created');
      }
      
      testCustomerId = invoice.customerId;
      
      // Step 3: Verify invoice items exist
      const items = await tester.apiCall(`/api/invoices/${testInvoiceId}/items`);
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Invoice items were not created');
      }
      
      console.log(`  Created invoice ${invoice.invoiceNumber} for customer ${testCustomerId}`);
      
      // Schedule cleanup
      tester.cleanup.push(async () => {
        await tester.apiCall(`/api/invoices/${testInvoiceId}`, { method: 'DELETE' });
      });
    });

    // Test 2: Invoice Status Management
    await tester.test('Workflow - Invoice status changes', async () => {
      if (!testInvoiceId) {
        throw new Error('No test invoice available');
      }
      
      // Change status to sent
      await tester.apiCall(`/api/invoices/${testInvoiceId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'sent' })
      });
      
      // Verify status change
      const invoice = await tester.apiCall(`/api/invoices/${testInvoiceId}`);
      if (invoice.status !== 'sent') {
        throw new Error('Invoice status was not updated to sent');
      }
      
      // Change status to paid via AI
      const aiResult = await tester.aiChat(`označ fakturu ${invoice.invoiceNumber} jako zaplacenou`);
      if (!aiResult.content || !aiResult.content.includes('zaplacen')) {
        throw new Error('AI did not confirm payment status change');
      }
    });

    // Test 3: PDF Generation Workflow
    await tester.test('Workflow - PDF generation and download', async () => {
      if (!testInvoiceId) {
        throw new Error('No test invoice available');
      }
      
      // Generate PDF
      const response = await fetch(`${API_BASE}/api/invoices/${testInvoiceId}/pdf`, {
        headers: { 'Authorization': `Bearer ${TEST_SESSION}` }
      });
      
      if (!response.ok) {
        throw new Error('PDF generation failed');
      }
      
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength < 1000) {
        throw new Error('Generated PDF is too small');
      }
      
      console.log(`  Generated PDF: ${Math.round(buffer.byteLength/1024)}KB`);
    });

    // Test 4: Customer Search and Invoice Filtering
    await tester.test('Workflow - Customer search and filtering', async () => {
      // Search for invoices by customer via AI
      const searchResult = await tester.aiChat('najdi faktury pro Integration Test Company');
      
      if (!searchResult.action || !searchResult.action.data.path.includes('customer=')) {
        throw new Error('AI did not create customer filter');
      }
      
      // Test status filtering
      const statusResult = await tester.aiChat('zobraz neplacené faktury');
      if (!statusResult.action || !statusResult.action.data.path.includes('status=')) {
        throw new Error('AI did not create status filter');
      }
    });

    // Test 5: Multi-item Invoice Creation
    await tester.test('Workflow - Multi-item invoice with ARES integration', async () => {
      const aiResult = await tester.aiChat('vytvoř fakturu Microsoft: 5ks software licencí, 3hodiny konzultací, 1ks instalace za 75000 Kč');
      
      if (!aiResult.action || !aiResult.action.data || !aiResult.action.data.path) {
        throw new Error('Multi-item invoice creation failed');
      }
      
      // Verify multi-item content
      if (!aiResult.content.includes('5ks') || !aiResult.content.includes('3hodiny') || !aiResult.content.includes('1ks')) {
        throw new Error('Multi-item details not preserved');
      }
      
      // Extract and verify invoice
      const pathParts = aiResult.action.data.path.split('/');
      const invoiceId = parseInt(pathParts[pathParts.indexOf('invoices') + 1]);
      
      const items = await tester.apiCall(`/api/invoices/${invoiceId}/items`);
      if (items.length < 3) {
        throw new Error('Not all items were created');
      }
      
      console.log(`  Created multi-item invoice with ${items.length} items`);
      
      // Schedule cleanup
      tester.cleanup.push(async () => {
        await tester.apiCall(`/api/invoices/${invoiceId}`, { method: 'DELETE' });
      });
    });

    // Test 6: Error Recovery Workflow
    await tester.test('Workflow - Error handling and recovery', async () => {
      // Test incomplete request
      const incompleteResult = await tester.aiChat('vytvoř fakturu');
      if (!incompleteResult.content.includes('potřeb') && !incompleteResult.content.includes('chyb')) {
        throw new Error('AI should ask for missing information');
      }
      
      // Test invalid customer search
      const invalidResult = await tester.aiChat('najdi faktury pro NonExistentCustomer12345');
      if (!invalidResult.content) {
        throw new Error('AI should handle invalid customer gracefully');
      }
    });

    // Test 7: Dashboard Statistics Update
    await tester.test('Workflow - Statistics consistency', async () => {
      const stats = await tester.apiCall('/api/stats');
      const invoices = await tester.apiCall('/api/invoices');
      
      // Verify count consistency
      const draftCount = invoices.filter(inv => inv.status === 'draft').length;
      const sentCount = invoices.filter(inv => inv.status === 'sent').length;
      const paidCount = invoices.filter(inv => inv.status === 'paid').length;
      
      const totalCalculated = draftCount + sentCount + paidCount;
      
      if (Math.abs(stats.invoiceCount - totalCalculated) > 2) {
        throw new Error(`Statistics inconsistency: reported ${stats.invoiceCount}, calculated ${totalCalculated}`);
      }
      
      console.log(`  Stats check: ${stats.invoiceCount} invoices, ${stats.revenue} revenue`);
    });

    // Test 8: Theme and UI Persistence
    await tester.test('Workflow - UI state persistence', async () => {
      // This would typically test localStorage, but we'll test API consistency
      const customersBefore = await tester.apiCall('/api/customers');
      const invoicesBefore = await tester.apiCall('/api/invoices');
      
      // Simulate some operations
      await tester.aiChat('přejdi na zákazníky');
      await tester.aiChat('přejdi na faktury');
      await tester.aiChat('zobraz dashboard');
      
      // Verify data consistency
      const customersAfter = await tester.apiCall('/api/customers');
      const invoicesAfter = await tester.apiCall('/api/invoices');
      
      if (customersBefore.length !== customersAfter.length) {
        throw new Error('Customer data inconsistency after navigation');
      }
      
      if (invoicesBefore.length !== invoicesAfter.length) {
        throw new Error('Invoice data inconsistency after navigation');
      }
      
      console.log(`  Data consistency maintained through ${customersBefore.length} customers, ${invoicesBefore.length} invoices`);
    });

  } finally {
    await tester.cleanupTestData();
  }

  return tester.summary();
}

// Run tests if called directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Integration test execution failed:', error);
    process.exit(1);
  });
}

export { runIntegrationTests };