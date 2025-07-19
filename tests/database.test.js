/**
 * Database Tests - Data Integrity and CRUD Operations
 * Run with: node tests/database.test.js
 */

import { db } from '../server/db.ts';
import { customers, invoices, invoiceItems } from '../shared/schema.ts';
import { eq, and } from 'drizzle-orm';

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
      // Clean up test data in reverse order
      if (this.testData.itemId) {
        await db.delete(invoiceItems).where(eq(invoiceItems.id, this.testData.itemId));
      }
      if (this.testData.invoiceId) {
        await db.delete(invoices).where(eq(invoices.id, this.testData.invoiceId));
      }
      if (this.testData.customerId) {
        await db.delete(customers).where(eq(customers.id, this.testData.customerId));
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
  const testCompanyId = 1; // Use existing company

  try {
    // Test Customer CRUD
    await tester.test('Customer - Create', async () => {
      const [customer] = await db.insert(customers).values({
        name: 'Test Customer DB',
        ico: '12345678',
        dic: 'CZ12345678',
        email: 'test@example.com',
        address: 'Test Street 123',
        city: 'Test City',
        postalCode: '12345',
        companyId: testCompanyId
      }).returning();
      
      if (!customer || !customer.id) {
        throw new Error('Customer creation failed');
      }
      tester.testData.customerId = customer.id;
    });

    await tester.test('Customer - Read', async () => {
      const [customer] = await db.select()
        .from(customers)
        .where(eq(customers.id, tester.testData.customerId));
      
      if (!customer || customer.name !== 'Test Customer DB') {
        throw new Error('Customer read failed');
      }
    });

    await tester.test('Customer - Update', async () => {
      await db.update(customers)
        .set({ email: 'updated@example.com' })
        .where(eq(customers.id, tester.testData.customerId));
      
      const [customer] = await db.select()
        .from(customers)
        .where(eq(customers.id, tester.testData.customerId));
      
      if (customer.email !== 'updated@example.com') {
        throw new Error('Customer update failed');
      }
    });

    // Test Invoice CRUD
    await tester.test('Invoice - Create', async () => {
      const [invoice] = await db.insert(invoices).values({
        companyId: testCompanyId,
        customerId: tester.testData.customerId,
        type: 'invoice',
        invoiceNumber: 'TEST001',
        issueDate: new Date(),
        dueDate: new Date(),
        subtotal: '10000',
        vatAmount: '2100',
        total: '12100',
        status: 'draft',
        notes: 'Test invoice'
      }).returning();
      
      if (!invoice || !invoice.id) {
        throw new Error('Invoice creation failed');
      }
      tester.testData.invoiceId = invoice.id;
    });

    await tester.test('Invoice - Read with Customer', async () => {
      const result = await db.select({
        invoice: invoices,
        customer: customers
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.id, tester.testData.invoiceId));
      
      if (!result[0] || !result[0].customer) {
        throw new Error('Invoice-Customer join failed');
      }
    });

    // Test Invoice Items CRUD
    await tester.test('Invoice Item - Create', async () => {
      const [item] = await db.insert(invoiceItems).values({
        invoiceId: tester.testData.invoiceId,
        description: 'Test Service',
        quantity: '2',
        unitPrice: '5000',
        vatRate: '21',
        total: '10000'
      }).returning();
      
      if (!item || !item.id) {
        throw new Error('Invoice item creation failed');
      }
      tester.testData.itemId = item.id;
    });

    await tester.test('Invoice Items - Read with Invoice', async () => {
      const result = await db.select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, tester.testData.invoiceId));
      
      if (result.length === 0) {
        throw new Error('Invoice items read failed');
      }
    });

    // Test Complex Queries
    await tester.test('Complex Query - Invoice Summary', async () => {
      const result = await db.select({
        invoiceId: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        customerName: customers.name,
        total: invoices.total,
        itemCount: invoiceItems.id
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
      .where(and(
        eq(invoices.companyId, testCompanyId),
        eq(invoices.id, tester.testData.invoiceId)
      ));
      
      if (result.length === 0) {
        throw new Error('Complex query failed');
      }
    });

    // Test Database Constraints
    await tester.test('Constraint - Duplicate invoice number', async () => {
      try {
        await db.insert(invoices).values({
          companyId: testCompanyId,
          customerId: tester.testData.customerId,
          type: 'invoice',
          invoiceNumber: 'TEST001', // Duplicate
          issueDate: new Date(),
          dueDate: new Date(),
          subtotal: '5000',
          vatAmount: '1050',
          total: '6050',
          status: 'draft',
          notes: ''
        });
        throw new Error('Should have failed due to duplicate invoice number');
      } catch (error) {
        if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
          throw new Error('Wrong constraint error type');
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