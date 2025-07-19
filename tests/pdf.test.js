/**
 * PDF Generation Tests - Document Creation and Quality
 * Run with: node tests/pdf.test.js
 */

import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000';
const TEST_SESSION = 'test-session-dev';

class PDFTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.testDir = 'tests/pdf-outputs';
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Testing PDF: ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${name} - ${error.message}`);
      this.failed++;
    }
  }

  async setup() {
    // Create test output directory
    if (!fs.existsSync(this.testDir)) {
      fs.mkdirSync(this.testDir, { recursive: true });
    }
  }

  async apiCall(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${TEST_SESSION}`,
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  }

  async downloadPDF(invoiceId, filename) {
    const response = await this.apiCall(`/api/invoices/${invoiceId}/pdf`);
    const buffer = await response.arrayBuffer();
    const filePath = path.join(this.testDir, filename);
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return filePath;
  }

  validatePDFFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error('PDF file was not created');
    }
    
    const stats = fs.statSync(filePath);
    if (stats.size < 1000) {
      throw new Error('PDF file is too small (likely corrupted)');
    }
    
    // Check PDF header
    const buffer = fs.readFileSync(filePath);
    const header = buffer.subarray(0, 4).toString();
    if (header !== '%PDF') {
      throw new Error('File is not a valid PDF (missing PDF header)');
    }
    
    return stats.size;
  }

  summary() {
    console.log('\n=== PDF TEST SUMMARY ===');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Total: ${this.passed + this.failed}`);
    console.log(`📁 Test files saved in: ${this.testDir}`);
    return this.failed === 0;
  }
}

async function runPDFTests() {
  const tester = new PDFTester();
  await tester.setup();

  // First, get list of invoices to test with
  let testInvoices = [];
  
  await tester.test('Setup - Get test invoices', async () => {
    const response = await tester.apiCall('/api/invoices', {
      headers: { 'Content-Type': 'application/json' }
    });
    const invoices = await response.json();
    
    if (!Array.isArray(invoices) || invoices.length === 0) {
      throw new Error('No invoices available for PDF testing');
    }
    
    testInvoices = invoices.slice(0, 3); // Test with first 3 invoices
    console.log(`Found ${invoices.length} invoices, will test with ${testInvoices.length}`);
  });

  // Test PDF generation for different invoice types
  for (let i = 0; i < testInvoices.length; i++) {
    const invoice = testInvoices[i];
    
    await tester.test(`PDF Generation - Invoice ${invoice.invoiceNumber}`, async () => {
      const filename = `test-invoice-${invoice.invoiceNumber}.pdf`;
      const filePath = await tester.downloadPDF(invoice.id, filename);
      const fileSize = tester.validatePDFFile(filePath);
      
      console.log(`  Generated: ${filename} (${Math.round(fileSize/1024)}KB)`);
    });
  }

  // Test PDF generation speed
  if (testInvoices.length > 0) {
    await tester.test('PDF Generation - Performance', async () => {
      const invoice = testInvoices[0];
      const startTime = Date.now();
      
      await tester.downloadPDF(invoice.id, 'performance-test.pdf');
      
      const duration = Date.now() - startTime;
      console.log(`  PDF generated in ${duration}ms`);
      
      if (duration > 10000) { // 10 seconds
        throw new Error(`PDF generation too slow: ${duration}ms`);
      }
    });
  }

  // Test PDF content validation
  if (testInvoices.length > 0) {
    await tester.test('PDF Content - Headers present', async () => {
      const response = await tester.apiCall(`/api/invoices/${testInvoices[0].id}/pdf`);
      const headers = response.headers;
      
      if (headers.get('content-type') !== 'application/pdf') {
        throw new Error('Wrong content type for PDF');
      }
      
      const disposition = headers.get('content-disposition');
      if (!disposition || !disposition.includes('filename')) {
        throw new Error('Missing filename in content disposition');
      }
    });
  }

  // Test error handling
  await tester.test('PDF Error Handling - Invalid invoice ID', async () => {
    try {
      await tester.apiCall('/api/invoices/99999/pdf');
      throw new Error('Should have failed for invalid invoice ID');
    } catch (error) {
      if (!error.message.includes('404') && !error.message.includes('Not Found')) {
        throw new Error('Wrong error type for invalid invoice');
      }
      // Expected to fail - this is good
    }
  });

  // Test PDF with Czech characters
  await tester.test('PDF Content - Czech character encoding', async () => {
    // Create test invoice with Czech characters via AI
    const aiResponse = await fetch(`${API_BASE}/api/chat/universal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_SESSION}`
      },
      body: JSON.stringify({
        message: 'vytvoř fakturu Český zákazník s.r.o. za služby s diakritikou 5000 Kč',
        context: '',
        currentPath: '/dashboard'
      })
    });
    
    const aiResult = await aiResponse.json();
    if (!aiResult.action || !aiResult.action.data || !aiResult.action.data.path) {
      throw new Error('Failed to create test invoice with Czech characters');
    }
    
    // Extract invoice ID from path
    const invoiceId = aiResult.action.data.path.split('/').pop().replace('/edit', '');
    
    // Generate PDF and check it's valid
    const filename = 'czech-characters-test.pdf';
    const filePath = await tester.downloadPDF(invoiceId, filename);
    tester.validatePDFFile(filePath);
    
    console.log(`  Czech characters PDF: ${filename}`);
  });

  return tester.summary();
}

// Run tests if called directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  runPDFTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('PDF test execution failed:', error);
    process.exit(1);
  });
}

export { runPDFTests };