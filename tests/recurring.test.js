/**
 * Recurring Invoices Tests - Automated Invoice Generation
 * Run with: node tests/recurring.test.js
 */

import { apiRequest } from './helpers/test-utils.js';

const BASE_URL = 'http://localhost:5000';

class RecurringTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  async test(name, testFn) {
    try {
      console.log(`🔄 Testing: ${name}`);
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
    console.log('\n=== RECURRING INVOICES TEST SUMMARY ===');
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

async function testCreateRecurringInvoice() {
  console.log('\n📅 Test: Vytvoření opakující se faktury');
  
  // Nejprve vytvoříme šablonu faktury
  const templateData = {
    customerId: 1,
    type: 'invoice',
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    subtotal: '5000.00',
    vatAmount: '1050.00',
    total: '6050.00',
    currency: 'CZK',
    notes: 'Šablona pro opakující se fakturu - měsíční hosting'
  };
  
  const { response: templateResponse, data: template } = await apiRequest('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(templateData)
  });
  
  if (!templateResponse.ok) {
    throw new Error('Nepodařilo se vytvořit šablonu faktury');
  }
  
  console.log(`   ✅ Šablona faktury vytvořena: ${template.invoiceNumber}`);
  
  // Nyní vytvoříme recurring schedule
  const recurringData = {
    templateInvoiceId: template.id,
    customerId: 1,
    pattern: {
      frequency: 'monthly',
      interval: 1,
      maxOccurrences: 12
    },
    isActive: true,
    nextGenerationDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
  
  const { response, data } = await apiRequest('/api/invoices/recurring', {
    method: 'POST',
    body: JSON.stringify(recurringData)
  });
  
  if (response.ok) {
    console.log('✅ Opakující se faktura nastavena');
    console.log(`   ID: ${data.id}, Pattern: ${data.pattern.frequency}`);
    return { recurringId: data.id, templateId: template.id };
  } else {
    throw new Error(`Chyba při vytváření recurring faktury: ${JSON.stringify(data)}`);
  }
}

async function testRecurringPatterns() {
  console.log('\n⏱️ Test: Různé vzory opakování');
  
  const patterns = [
    {
      name: 'Týdenní',
      frequency: 'weekly',
      interval: 1,
      maxOccurrences: 4
    },
    {
      name: 'Měsíční',
      frequency: 'monthly', 
      interval: 1,
      maxOccurrences: 12
    },
    {
      name: 'Čtvrtletní',
      frequency: 'quarterly',
      interval: 1,
      maxOccurrences: 4
    },
    {
      name: 'Roční',
      frequency: 'yearly',
      interval: 1,
      maxOccurrences: 3
    }
  ];
  
  let allSuccessful = true;
  
  for (const pattern of patterns) {
    console.log(`   → Testování ${pattern.name} vzoru`);
    
    const recurringData = {
      templateInvoiceId: 1, // Předpokládáme existující šablonu
      customerId: 1,
      pattern: pattern,
      isActive: true,
      nextGenerationDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    const { response, data } = await apiRequest('/api/invoices/recurring', {
      method: 'POST',
      body: JSON.stringify(recurringData)
    });
    
    if (response.ok) {
      console.log(`     ✅ ${pattern.name} vzor vytvořen`);
    } else {
      console.log(`     ❌ ${pattern.name} vzor selhal:`, data);
      allSuccessful = false;
    }
  }
  
  return allSuccessful;
}

async function testRecurringInvoiceGeneration() {
  console.log('\n🎯 Test: Generování faktur z recurring');
  
  // Spustíme manuální generování due faktur
  const { response, data } = await apiRequest('/api/invoices/recurring/generate', {
    method: 'POST'
  });
  
  if (response.ok) {
    console.log(`✅ Generování dokončeno - ${data.generated} faktur`);
    
    if (data.invoices && data.invoices.length > 0) {
      console.log('   📋 Vygenerované faktury:');
      data.invoices.forEach(invoice => {
        console.log(`     - ${invoice.invoiceNumber} (${invoice.total} ${invoice.currency})`);
      });
    }
    
    return data.invoices || [];
  } else {
    throw new Error(`Chyba při generování recurring faktur: ${JSON.stringify(data)}`);
  }
}

async function testRecurringScheduleUpdates(recurringId) {
  console.log('\n✏️ Test: Úprava recurring schedule');
  
  if (!recurringId) {
    console.log('⚠️ Přeskakujem test - chybí ID recurring');
    return false;
  }
  
  const updates = [
    {
      name: 'Změna intervalu',
      data: { 
        pattern: {
          frequency: 'monthly',
          interval: 2, // Každé 2 měsíce
          maxOccurrences: 6
        }
      }
    },
    {
      name: 'Deaktivace',
      data: { isActive: false }
    },
    {
      name: 'Aktivace',
      data: { isActive: true }
    }
  ];
  
  let allSuccessful = true;
  
  for (const update of updates) {
    console.log(`   → ${update.name}`);
    
    const { response, data } = await apiRequest(`/api/invoices/recurring/${recurringId}`, {
      method: 'PATCH',
      body: JSON.stringify(update.data)
    });
    
    if (response.ok) {
      console.log(`     ✅ ${update.name} - úspěch`);
    } else {
      console.log(`     ❌ ${update.name} - chyba:`, data);
      allSuccessful = false;
    }
  }
  
  return allSuccessful;
}

async function testRecurringInvoicesList() {
  console.log('\n📋 Test: Seznam recurring faktur');
  
  const { response, data } = await apiRequest('/api/invoices/recurring');
  
  if (response.ok) {
    console.log(`✅ Seznam načten - ${data.length} recurring faktur`);
    
    if (data.length > 0) {
      const recurring = data[0];
      const requiredFields = ['id', 'templateInvoiceId', 'pattern', 'isActive', 'nextGenerationDate'];
      const hasAllFields = requiredFields.every(field => recurring.hasOwnProperty(field));
      
      if (hasAllFields) {
        console.log('   ✅ Struktura dat v pořádku');
        
        // Ověříme pattern parsing
        try {
          const pattern = typeof recurring.pattern === 'string' 
            ? JSON.parse(recurring.pattern) 
            : recurring.pattern;
          
          if (pattern.frequency && pattern.interval) {
            console.log(`   ✅ Pattern je správně parsován (${pattern.frequency}/${pattern.interval})`);
            return true;
          } else {
            throw new Error('Pattern nemá požadované pole');
          }
        } catch (error) {
          console.log('   ❌ Chyba při parsování pattern:', error.message);
          return false;
        }
      } else {
        console.log('   ❌ Chybí povinná pole v datech');
        return false;
      }
    }
    
    return true;
  } else {
    throw new Error(`Chyba při načítání recurring faktur: ${JSON.stringify(data)}`);
  }
}

async function testRecurringDeletionAndCleanup(recurringId) {
  console.log('\n🗑️ Test: Smazání recurring faktury');
  
  if (!recurringId) {
    console.log('⚠️ Přeskakujem test - chybí ID recurring');
    return false;
  }
  
  const { response, data } = await apiRequest(`/api/invoices/recurring/${recurringId}`, {
    method: 'DELETE'
  });
  
  if (response.ok) {
    console.log('✅ Recurring faktura smazána');
    
    // Ověříme, že už není v seznamu
    const { response: listResponse, data: listData } = await apiRequest('/api/invoices/recurring');
    
    if (listResponse.ok) {
      const found = listData.find(r => r.id === recurringId);
      if (!found) {
        console.log('   ✅ Recurring faktura už není v seznamu');
        return true;
      } else {
        console.log('   ❌ Recurring faktura stále existuje v seznamu');
        return false;
      }
    }
    
    return true;
  } else {
    throw new Error(`Chyba při mazání recurring faktury: ${JSON.stringify(data)}`);
  }
}

async function testRecurringValidation() {
  console.log('\n✅ Test: Validace recurring parametrů');
  
  const invalidTests = [
    {
      name: 'Neplatná frekvence',
      data: { frequency: 'invalid', interval: 1 },
      expectedError: 'frequency'
    },
    {
      name: 'Nulový interval',
      data: { frequency: 'monthly', interval: 0 },
      expectedError: 'interval'
    },
    {
      name: 'Záporný maxOccurrences',
      data: { frequency: 'monthly', interval: 1, maxOccurrences: -1 },
      expectedError: 'maxOccurrences'
    }
  ];
  
  let allCorrect = true;
  
  for (const test of invalidTests) {
    try {
      const { response, data } = await apiRequest('/api/invoices/recurring', {
        method: 'POST',
        body: JSON.stringify({
          templateInvoiceId: 1,
          customerId: 1,
          pattern: test.data,
          isActive: true,
          nextGenerationDate: new Date().toISOString()
        })
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

export async function runRecurringTests() {
  console.log('🎯 SPOUŠTÍM RECURRING FAKTURY TESTY');
  console.log('='.repeat(40));
  
  const tester = new RecurringTester();
  let testData = { recurringId: null, templateId: null };
  
  await tester.test('Create Recurring Invoice', async () => {
    testData = await testCreateRecurringInvoice();
    if (!testData.recurringId) throw new Error('Nepodařilo se vytvořit recurring fakturu');
  });
  
  await tester.test('Recurring Patterns', testRecurringPatterns);
  await tester.test('Invoice Generation', testRecurringInvoiceGeneration);
  
  await tester.test('Schedule Updates', async () => {
    const success = await testRecurringScheduleUpdates(testData.recurringId);
    if (!success) throw new Error('Nepodařily se všechny úpravy');
  });
  
  await tester.test('Recurring List', testRecurringInvoicesList);
  await tester.test('Validation', testRecurringValidation);
  
  await tester.test('Cleanup', async () => {
    const success = await testRecurringDeletionAndCleanup(testData.recurringId);
    if (!success) throw new Error('Nepodařilo se smazat recurring fakturu');
  });
  
  return tester.summary();
}

// Spuštění testů pokud je soubor spuštěn přímo
if (import.meta.url === `file://${process.argv[1]}`) {
  runRecurringTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Chyba při spouštění testů:', error);
    process.exit(1);
  });
}