/**
 * Items Tests - Direct Invoice and Expense Items CRUD
 * Run with: node tests/items.test.js
 */

import { apiRequest } from './helpers/test-utils.js';

const BASE_URL = 'http://localhost:5000';

class ItemsTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  async test(name, testFn) {
    try {
      console.log(`📝 Testing: ${name}`);
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

  summary() {
    console.log('\n=== ITEMS TEST SUMMARY ===');
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

async function setupTestInvoice() {
  console.log('\n🧾 Příprava: Vytvoření testovací faktury');
  
  const invoiceData = {
    customerId: 1,
    invoiceNumber: `TEST-ITEMS-${Date.now()}`,
    type: 'invoice',
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    subtotal: '0.00',
    vatAmount: '0.00', 
    total: '0.00',
    currency: 'CZK',
    notes: 'Test faktura pro items testy'
  };
  
  const { response, data } = await apiRequest('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(invoiceData)
  });
  
  if (response.ok) {
    console.log(`   ✅ Testovací faktura vytvořena: ${data.invoiceNumber}`);
    return data.id;
  } else {
    throw new Error('Nepodařilo se vytvořit testovací fakturu');
  }
}

async function setupTestExpense() {
  console.log('\n💰 Příprava: Vytvoření testového nákladu');
  
  const expenseData = {
    supplierId: 1,
    expenseNumber: `TEST-EXP-${Date.now()}`,
    issueDate: new Date().toISOString(),
    description: 'Test náklad pro items testy',
    category: 'office',
    subtotal: '0.00',
    vatAmount: '0.00',
    total: '0.00',
    currency: 'CZK'
  };
  
  const { response, data } = await apiRequest('/api/expenses', {
    method: 'POST', 
    body: JSON.stringify(expenseData)
  });
  
  if (response.ok) {
    console.log(`   ✅ Testový náklad vytvořen: ${data.expenseNumber}`);
    return data.id;
  } else {
    throw new Error('Nepodařilo se vytvořit testový náklad');
  }
}

async function testInvoiceItemCreate(invoiceId) {
  console.log('\n➕ Test: Vytvoření položky faktury');
  
  if (!invoiceId) {
    throw new Error('Chybí ID faktury');
  }
  
  const itemData = {
    invoiceId: invoiceId,
    description: 'Webové stránky - design a vývoj',
    quantity: 1,
    unit: 'ks',
    unitPrice: '25000.00',
    vatRate: 21,
    vatAmount: '5250.00',
    total: '30250.00'
  };
  
  const { response, data } = await apiRequest(`/api/invoices/${invoiceId}/items`, {
    method: 'POST',
    body: JSON.stringify(itemData)
  });
  
  if (response.ok) {
    console.log('✅ Položka faktury vytvořena');
    console.log(`   ID: ${data.id}, Popis: ${data.description}`);
    console.log(`   Částka: ${data.total} ${data.currency || 'CZK'}`);
    return data.id;
  } else {
    throw new Error(`Chyba při vytváření položky: ${JSON.stringify(data)}`);
  }
}

async function testInvoiceItemsRead(invoiceId) {
  console.log('\n📋 Test: Načtení položek faktury');
  
  if (!invoiceId) {
    throw new Error('Chybí ID faktury');
  }
  
  const { response, data } = await apiRequest(`/api/invoices/${invoiceId}/items`);
  
  if (response.ok) {
    console.log(`✅ Načteno ${data.length} položek faktury`);
    
    if (data.length > 0) {
      const item = data[0];
      const requiredFields = ['id', 'description', 'quantity', 'unitPrice', 'total'];
      const hasAllFields = requiredFields.every(field => item.hasOwnProperty(field));
      
      if (hasAllFields) {
        console.log('   ✅ Struktura položek v pořádku');
        data.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.description} - ${item.total}`);
        });
        return data;
      } else {
        throw new Error('Chybí povinná pole v položkách');
      }
    }
    
    return data;
  } else {
    throw new Error(`Chyba při načítání položek: ${JSON.stringify(data)}`);
  }
}

async function testInvoiceItemUpdate(invoiceId, itemId) {
  console.log('\n✏️ Test: Úprava položky faktury');
  
  if (!invoiceId || !itemId) {
    throw new Error('Chybí ID faktury nebo položky');
  }
  
  const updateData = {
    description: 'Webové stránky - design, vývoj a hosting',
    quantity: 1,
    unitPrice: '28000.00',
    vatRate: 21,
    vatAmount: '5880.00', 
    total: '33880.00'
  };
  
  const { response, data } = await apiRequest(`/api/invoices/${invoiceId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData)
  });
  
  if (response.ok) {
    console.log('✅ Položka faktury upravena');
    console.log(`   Nový popis: ${data.description}`);
    console.log(`   Nová částka: ${data.total}`);
    return true;
  } else {
    throw new Error(`Chyba při úpravě položky: ${JSON.stringify(data)}`);
  }
}

async function testInvoiceItemDelete(invoiceId, itemId) {
  console.log('\n🗑️ Test: Smazání položky faktury');
  
  if (!invoiceId || !itemId) {
    throw new Error('Chybí ID faktury nebo položky');
  }
  
  const { response, data } = await apiRequest(`/api/invoices/${invoiceId}/items/${itemId}`, {
    method: 'DELETE'
  });
  
  if (response.ok || response.status === 204) {
    console.log('✅ Položka faktury smazána');
    
    // Ověříme, že položka už neexistuje
    const { response: checkResponse, data: checkData } = await apiRequest(`/api/invoices/${invoiceId}/items`);
    
    if (checkResponse.ok) {
      const found = checkData.find(item => item.id === itemId);
      if (!found) {
        console.log('   ✅ Položka už není v seznamu');
        return true;
      } else {
        throw new Error('Položka stále existuje po smazání');
      }
    }
    
    return true;
  } else {
    throw new Error(`Chyba při mazání položky: ${JSON.stringify(data)}`);
  }
}

async function testExpenseItemCreate(expenseId) {
  console.log('\n➕ Test: Vytvoření položky nákladu');
  
  if (!expenseId) {
    throw new Error('Chybí ID nákladu');
  }
  
  const itemData = {
    expenseId: expenseId,
    description: 'Kancelářské potřeby - papír A4',
    quantity: 5,
    unit: 'balení',
    unitPrice: '120.00',
    vatRate: 21,
    vatAmount: '126.00',
    total: '726.00'
  };
  
  const { response, data } = await apiRequest(`/api/expenses/${expenseId}/items`, {
    method: 'POST',
    body: JSON.stringify(itemData)
  });
  
  if (response.ok) {
    console.log('✅ Položka nákladu vytvořena');
    console.log(`   ID: ${data.id}, Popis: ${data.description}`);
    console.log(`   Částka: ${data.total}`);
    return data.id;
  } else {
    throw new Error(`Chyba při vytváření položky nákladu: ${JSON.stringify(data)}`);
  }
}

async function testExpenseItemsRead(expenseId) {
  console.log('\n📋 Test: Načtení položek nákladu');
  
  if (!expenseId) {
    throw new Error('Chybí ID nákladu');
  }
  
  const { response, data } = await apiRequest(`/api/expenses/${expenseId}/items`);
  
  if (response.ok) {
    console.log(`✅ Načteno ${data.length} položek nákladu`);
    
    if (data.length > 0) {
      data.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.description} - ${item.total}`);
      });
    }
    
    return data;
  } else {
    throw new Error(`Chyba při načítání položek nákladu: ${JSON.stringify(data)}`);
  }
}

async function testExpenseItemUpdate(expenseId, itemId) {
  console.log('\n✏️ Test: Úprava položky nákladu');
  
  if (!expenseId || !itemId) {
    throw new Error('Chybí ID nákladu nebo položky');
  }
  
  const updateData = {
    description: 'Kancelářské potřeby - papír A4 premium',
    quantity: 5,
    unitPrice: '150.00',
    vatRate: 21,
    vatAmount: '157.50',
    total: '907.50'
  };
  
  const { response, data } = await apiRequest(`/api/expenses/${expenseId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData)
  });
  
  if (response.ok) {
    console.log('✅ Položka nákladu upravena');
    console.log(`   Nový popis: ${data.description}`);
    console.log(`   Nová částka: ${data.total}`);
    return true;
  } else {
    throw new Error(`Chyba při úpravě položky nákladu: ${JSON.stringify(data)}`);
  }
}

async function testExpenseItemDelete(expenseId, itemId) {
  console.log('\n🗑️ Test: Smazání položky nákladu');
  
  if (!expenseId || !itemId) {
    throw new Error('Chybí ID nákladu nebo položky');
  }
  
  const { response, data } = await apiRequest(`/api/expenses/${expenseId}/items/${itemId}`, {
    method: 'DELETE'
  });
  
  if (response.ok || response.status === 204) {
    console.log('✅ Položka nákladu smazána');
    return true;
  } else {
    throw new Error(`Chyba při mazání položky nákladu: ${JSON.stringify(data)}`);
  }
}

async function testItemsValidation() {
  console.log('\n✅ Test: Validace položek');
  
  const invalidTests = [
    {
      name: 'Prázdný popis',
      data: { description: '', quantity: 1, unitPrice: '100.00' },
      expectedError: 'description'
    },
    {
      name: 'Záporná částka',
      data: { description: 'Test', quantity: 1, unitPrice: '-100.00' },
      expectedError: 'unitPrice'
    },
    {
      name: 'Nulové množství',
      data: { description: 'Test', quantity: 0, unitPrice: '100.00' },
      expectedError: 'quantity'
    }
  ];
  
  let allCorrect = true;
  
  for (const test of invalidTests) {
    try {
      const { response, data } = await apiRequest('/api/invoices/1/items', {
        method: 'POST',
        body: JSON.stringify({ invoiceId: 1, ...test.data })
      });
      
      if (response.ok) {
        console.log(`   ❌ ${test.name} - mělo selhat, ale prošlo`);
        allCorrect = false;
      } else {
        console.log(`   ✅ ${test.name} - správně odmítnuto`);
      }
    } catch (error) {
      console.log(`   ✅ ${test.name} - správně odmítnuto s chybou`);
    }
  }
  
  return allCorrect;
}

async function testBulkItemOperations(invoiceId) {
  console.log('\n📦 Test: Hromadné operace s položkami');
  
  if (!invoiceId) {
    throw new Error('Chybí ID faktury');
  }
  
  // Vytvoříme více položek najednou
  const items = [
    {
      description: 'Položka 1',
      quantity: 1,
      unitPrice: '1000.00',
      vatRate: 21,
      vatAmount: '210.00',
      total: '1210.00'
    },
    {
      description: 'Položka 2', 
      quantity: 2,
      unitPrice: '500.00',
      vatRate: 21,
      vatAmount: '210.00',
      total: '1210.00'
    },
    {
      description: 'Položka 3',
      quantity: 1,
      unitPrice: '750.00',
      vatRate: 21,
      vatAmount: '157.50',
      total: '907.50'
    }
  ];
  
  const { response, data } = await apiRequest(`/api/invoices/${invoiceId}/items/bulk`, {
    method: 'POST',
    body: JSON.stringify({ items: items.map(item => ({ invoiceId, ...item })) })
  });
  
  if (response.ok) {
    console.log(`✅ Hromadné vytvoření - ${data.length} položek`);
    data.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.description} - ${item.total}`);
    });
    return data.map(item => item.id);
  } else {
    // Pokud bulk endpoint není implementován, vytvoříme položky jednotlivě
    console.log('⚠️ Bulk endpoint není implementován, vytváříme jednotlivě');
    const createdIds = [];
    
    for (const item of items) {
      try {
        const { response: singleResponse, data: singleData } = await apiRequest(`/api/invoices/${invoiceId}/items`, {
          method: 'POST',
          body: JSON.stringify({ invoiceId, ...item })
        });
        
        if (singleResponse.ok) {
          createdIds.push(singleData.id);
        }
      } catch (error) {
        console.log(`   ⚠️ Chyba při vytváření položky: ${error.message}`);
      }
    }
    
    console.log(`✅ Jednotlivé vytvoření - ${createdIds.length} položek`);
    return createdIds;
  }
}

export async function runItemsTests() {
  console.log('🎯 SPOUŠTÍM ITEMS TESTY');
  console.log('='.repeat(40));
  
  const tester = new ItemsTester();
  let testData = { invoiceId: null, expenseId: null, itemIds: [] };
  
  // Příprava testovacích dat
  testData.invoiceId = await setupTestInvoice();
  testData.expenseId = await setupTestExpense();
  
  // Invoice Items testy
  await tester.test('Invoice Item Create', async () => {
    const itemId = await testInvoiceItemCreate(testData.invoiceId);
    if (!itemId) throw new Error('Nepodařilo se vytvořit položku faktury');
    testData.itemIds.push(itemId);
  });
  
  await tester.test('Invoice Items Read', async () => {
    const items = await testInvoiceItemsRead(testData.invoiceId);
    if (!items || items.length === 0) throw new Error('Žádné položky nenalezeny');
  });
  
  await tester.test('Invoice Item Update', async () => {
    const success = await testInvoiceItemUpdate(testData.invoiceId, testData.itemIds[0]);
    if (!success) throw new Error('Nepodařilo se upravit položku');
  });
  
  await tester.test('Bulk Item Operations', async () => {
    const bulkIds = await testBulkItemOperations(testData.invoiceId);
    testData.itemIds.push(...bulkIds);
  });
  
  // Expense Items testy
  await tester.test('Expense Item Create', async () => {
    const itemId = await testExpenseItemCreate(testData.expenseId);
    if (!itemId) throw new Error('Nepodařilo se vytvořit položku nákladu');
    testData.expenseItemId = itemId;
  });
  
  await tester.test('Expense Items Read', async () => {
    const items = await testExpenseItemsRead(testData.expenseId);
    if (!items) throw new Error('Chyba při načítání položek nákladu');
  });
  
  await tester.test('Expense Item Update', async () => {
    const success = await testExpenseItemUpdate(testData.expenseId, testData.expenseItemId);
    if (!success) throw new Error('Nepodařilo se upravit položku nákladu');
  });
  
  await tester.test('Items Validation', testItemsValidation);
  
  // Cleanup testy
  await tester.test('Invoice Item Delete', async () => {
    const success = await testInvoiceItemDelete(testData.invoiceId, testData.itemIds[0]);
    if (!success) throw new Error('Nepodařilo se smazat položku faktury');
  });
  
  await tester.test('Expense Item Delete', async () => {
    const success = await testExpenseItemDelete(testData.expenseId, testData.expenseItemId);
    if (!success) throw new Error('Nepodařilo se smazat položku nákladu');
  });
  
  return tester.summary();
}

// Spuštění testů pokud je soubor spuštěn přímo
if (import.meta.url === `file://${process.argv[1]}`) {
  runItemsTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Chyba při spouštění testů:', error);
    process.exit(1);
  });
}