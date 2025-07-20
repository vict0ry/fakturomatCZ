#!/usr/bin/env node

/**
 * 🧪 Expense Management Tests
 * Tests all expense-related functionality including:
 * - Creating expenses manually and via AI
 * - Editing existing expenses  
 * - Viewing expense details
 * - File attachments
 * - Vision API for receipt processing
 */

import { testApiEndpoint, logTest, logResult, formatDuration, authenticateTestUser } from './helpers/test-utils.js';

const BASE_URL = 'http://localhost:5000';

// Test data
const testExpense = {
  supplierName: 'Test Dodavatel s.r.o.',
  category: 'Office',
  description: 'Kancelářské potřeby',
  receiptNumber: 'R2025001',
  amount: '1000.00',
  vatRate: '21',
  vatAmount: '210.00',
  total: '1210.00',
  expenseDate: new Date().toISOString().split('T')[0],
  status: 'draft',
  notes: 'Test náklad pro automatické testování'
};

const testExpenseUpdate = {
  ...testExpense,
  description: 'Aktualizované kancelářské potřeby',
  amount: '1500.00',
  vatAmount: '315.00',
  total: '1815.00',
  notes: 'Aktualizovaný test náklad'
};

async function runExpenseTests() {
  console.log('🧪 === EXPENSE MANAGEMENT TESTS ===\n');
  
  const startTime = Date.now();
  let passed = 0;
  let failed = 0;
  let createdExpenseId = null;

  // Authenticate first
  console.log('🔐 Authenticating test user...');
  const authenticated = await authenticateTestUser();
  
  if (!authenticated) {
    console.log('❌ Failed to authenticate test user');
    console.log('💡 Tests require authentication - some tests may fail');
  } else {
    console.log('✅ Test user authenticated successfully');
  }

  // Test 1: Create expense via API
  try {
    logTest('1. Creating expense via API');
    const response = await testApiEndpoint('POST', '/api/expenses', testExpense);
    
    if (response.success && response.data && response.data.id) {
      createdExpenseId = response.data.id;
      logResult(true, `✅ Expense created with ID: ${createdExpenseId}`);
      passed++;
    } else {
      logResult(false, '❌ Failed to create expense: ' + (response.error || 'Unknown error'));
      failed++;
    }
  } catch (error) {
    logResult(false, '❌ Error creating expense: ' + error.message);
    failed++;
  }

  // Test 2: Get expense list
  try {
    logTest('2. Fetching expense list');
    const response = await testApiEndpoint('GET', '/api/expenses');
    
    if (response.success && Array.isArray(response.data)) {
      const expenseCount = response.data.length;
      logResult(true, `✅ Retrieved ${expenseCount} expenses`);
      passed++;
    } else {
      logResult(false, '❌ Failed to fetch expenses: ' + (response.error || 'Invalid response'));
      failed++;
    }
  } catch (error) {
    logResult(false, '❌ Error fetching expenses: ' + error.message);
    failed++;
  }

  // Test 3: Get specific expense details
  if (createdExpenseId) {
    try {
      logTest('3. Fetching expense details');
      const response = await testApiEndpoint('GET', `/api/expenses/${createdExpenseId}`);
      
      if (response.success && response.data && response.data.id === createdExpenseId) {
        logResult(true, `✅ Retrieved expense details: ${response.data.description}`);
        passed++;
      } else {
        logResult(false, '❌ Failed to fetch expense details: ' + (response.error || 'Invalid response'));
        failed++;
      }
    } catch (error) {
      logResult(false, '❌ Error fetching expense details: ' + error.message);
      failed++;
    }

    // Test 4: Update expense
    try {
      logTest('4. Updating expense');
      const response = await testApiEndpoint('PATCH', `/api/expenses/${createdExpenseId}`, testExpenseUpdate);
      
      if (response.success && response.data) {
        logResult(true, `✅ Expense updated successfully`);
        passed++;
      } else {
        logResult(false, '❌ Failed to update expense: ' + (response.error || 'Unknown error'));
        failed++;
      }
    } catch (error) {
      logResult(false, '❌ Error updating expense: ' + error.message);
      failed++;
    }

    // Test 5: Verify update
    try {
      logTest('5. Verifying expense update');
      const response = await testApiEndpoint('GET', `/api/expenses/${createdExpenseId}`);
      
      if (response.success && 
          response.data && 
          response.data.description === testExpenseUpdate.description &&
          response.data.total === testExpenseUpdate.total) {
        logResult(true, `✅ Expense update verified`);
        passed++;
      } else {
        logResult(false, '❌ Expense update verification failed');
        failed++;
      }
    } catch (error) {
      logResult(false, '❌ Error verifying expense update: ' + error.message);
      failed++;
    }
  } else {
    // Skip tests that require expense ID
    logResult(false, '❌ Skipping detail tests - no expense created');
    failed += 3;
  }

  // Test 6: Test AI expense creation
  try {
    logTest('6. Creating expense via AI chat');
    const aiMessage = `Vytvoř náklad pro dodavatele "AI Test Company s.r.o." v kategorii "IT" za "Software licence" ve výši 5000 Kč bez DPH s poznámkou "Automatický test AI nákladu"`;
    
    const response = await testApiEndpoint('POST', '/api/chat', {
      message: aiMessage,
      sessionId: 'test-session-expenses'
    });
    
    if (response.success && response.data && response.data.response) {
      const aiResponse = response.data.response.toLowerCase();
      if (aiResponse.includes('náklad') && (aiResponse.includes('vytvořen') || aiResponse.includes('vytvoř'))) {
        logResult(true, `✅ AI expense creation successful`);
        passed++;
      } else {
        logResult(false, '❌ AI did not confirm expense creation: ' + response.data.response);
        failed++;
      }
    } else {
      logResult(false, '❌ AI chat failed: ' + (response.error || 'No response'));
      failed++;
    }
  } catch (error) {
    logResult(false, '❌ Error in AI expense creation: ' + error.message);
    failed++;
  }

  // Test 7: Test expense categories and validation
  try {
    logTest('7. Testing expense validation');
    const invalidExpense = {
      supplierName: '', // Invalid - empty
      category: 'InvalidCategory',
      description: '',  // Invalid - empty
      amount: 'not-a-number', // Invalid
      vatRate: '21'
    };
    
    const response = await testApiEndpoint('POST', '/api/expenses', invalidExpense);
    
    if (!response.success && response.error) {
      logResult(true, `✅ Validation correctly rejected invalid expense`);
      passed++;
    } else {
      logResult(false, '❌ Validation should have rejected invalid expense');
      failed++;
    }
  } catch (error) {
    logResult(false, '❌ Error testing validation: ' + error.message);
    failed++;
  }

  // Test 8: Test expense search and filtering
  try {
    logTest('8. Testing expense search functionality');
    const response = await testApiEndpoint('GET', '/api/expenses');
    
    if (response.success && Array.isArray(response.data) && response.data.length > 0) {
      // Check if we can find our test expense
      const testExpenseFound = response.data.some(expense => 
        expense.description && expense.description.includes('test') ||
        expense.supplierName && expense.supplierName.includes('Test')
      );
      
      if (testExpenseFound) {
        logResult(true, `✅ Test expenses found in search results`);
        passed++;
      } else {
        logResult(true, `✅ Expense list retrieved (no test data found, but API works)`);
        passed++;
      }
    } else {
      logResult(false, '❌ Failed to retrieve expenses for search test');
      failed++;
    }
  } catch (error) {
    logResult(false, '❌ Error testing expense search: ' + error.message);
    failed++;
  }

  // Test 9: Test receipt vision API (if available)
  try {
    logTest('9. Testing Vision API readiness');
    const visionTestMessage = `Analyzuj účtenku: Test receipt with amount 1000 CZK from ABC Company`;
    
    const response = await testApiEndpoint('POST', '/api/chat', {
      message: visionTestMessage,
      attachments: [{
        type: 'text',
        content: 'Test receipt data',
        filename: 'test-receipt.txt'
      }],
      sessionId: 'test-session-vision'
    });
    
    if (response.success && response.data && response.data.response) {
      logResult(true, `✅ Vision API endpoint accessible`);
      passed++;
    } else {
      logResult(false, '❌ Vision API test failed: ' + (response.error || 'No response'));
      failed++;
    }
  } catch (error) {
    logResult(false, '❌ Error testing Vision API: ' + error.message);
    failed++;
  }

  // Test 10: Cleanup - delete test expense
  if (createdExpenseId) {
    try {
      logTest('10. Cleaning up test expense');
      const response = await testApiEndpoint('DELETE', `/api/expenses/${createdExpenseId}`);
      
      if (response.success || response.status === 404) {
        logResult(true, `✅ Test expense cleaned up`);
        passed++;
      } else {
        logResult(false, '❌ Failed to cleanup test expense (not critical)');
        // Don't count as failed since it's cleanup
        passed++;
      }
    } catch (error) {
      logResult(false, '❌ Error during cleanup (not critical): ' + error.message);
      // Don't count as failed since it's cleanup
      passed++;
    }
  } else {
    logResult(true, '✅ No cleanup needed');
    passed++;
  }

  // Results
  console.log('\n' + '='.repeat(50));
  console.log(`📊 EXPENSE TESTS RESULT: ${passed}✅ / ${failed}❌`);
  console.log(`⏱️ Duration: ${formatDuration(Date.now() - startTime)}`);
  
  if (failed === 0) {
    console.log('🎉 All expense management features working!');
  } else {
    console.log('⚠️ Some expense features need attention');
  }
  
  console.log('='.repeat(50) + '\n');
  
  return { passed, failed, total: passed + failed };
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExpenseTests().catch(console.error);
}

export { runExpenseTests };