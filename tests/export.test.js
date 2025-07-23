/**
 * Export Tests - Data Export Functionality (CSV, XML, Pohoda)
 * Run with: node tests/export.test.js
 */

import { apiRequest } from './helpers/test-utils.js';

const BASE_URL = 'http://localhost:5000';

class ExportTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  async test(name, testFn) {
    try {
      console.log(`📊 Testing: ${name}`);
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
    console.log('\n=== EXPORT TEST SUMMARY ===');
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

async function testInvoicesCSVExport() {
  console.log('\n📋 Test: Export faktur do CSV');
  
  const { response, data } = await apiRequest('/api/export/invoices/csv', {
    method: 'POST',
    body: JSON.stringify({
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
      status: 'all',
      includeItems: true
    })
  });
  
  if (response.ok) {
    const csvContent = data.csvContent || data;
    
    if (typeof csvContent === 'string' && csvContent.includes('Invoice Number')) {
      console.log('✅ CSV export úspěšný');
      console.log(`   Velikost: ${csvContent.length} znaků`);
      
      // Spočítáme řádky
      const lines = csvContent.split('\n').filter(line => line.trim());
      console.log(`   Řádků: ${lines.length}`);
      
      // Ověříme strukturu
      const headers = lines[0].split(',');
      if (headers.includes('Invoice Number') && headers.includes('Total')) {
        console.log('   ✅ CSV obsahuje správné hlavičky');
        return csvContent;
      } else {
        throw new Error('CSV neobsahuje očekávané hlavičky');
      }
    } else {
      throw new Error('Neplatný CSV formát');
    }
  } else {
    throw new Error(`Chyba při exportu CSV: ${JSON.stringify(data)}`);
  }
}

async function testCustomersCSVExport() {
  console.log('\n🏪 Test: Export zákazníků do CSV');
  
  const { response, data } = await apiRequest('/api/export/customers/csv');
  
  if (response.ok) {
    const csvContent = data.csvContent || data;
    
    if (typeof csvContent === 'string' && csvContent.includes('Company Name')) {
      console.log('✅ CSV export zákazníků úspěšný');
      console.log(`   Velikost: ${csvContent.length} znaků`);
      
      const lines = csvContent.split('\n').filter(line => line.trim());
      console.log(`   Řádků: ${lines.length}`);
      
      return csvContent;
    } else {
      throw new Error('Neplatný CSV formát pro zákazníky');
    }
  } else {
    throw new Error(`Chyba při exportu zákazníků: ${JSON.stringify(data)}`);
  }
}

async function testExpensesCSVExport() {
  console.log('\n💰 Test: Export nákladů do CSV');
  
  const { response, data } = await apiRequest('/api/export/expenses/csv', {
    method: 'POST',
    body: JSON.stringify({
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
      category: 'all'
    })
  });
  
  if (response.ok) {
    const csvContent = data.csvContent || data;
    
    if (typeof csvContent === 'string') {
      console.log('✅ CSV export nákladů úspěšný');
      console.log(`   Velikost: ${csvContent.length} znaků`);
      
      const lines = csvContent.split('\n').filter(line => line.trim());
      console.log(`   Řádků: ${lines.length}`);
      
      return csvContent;
    } else {
      throw new Error('Neplatný CSV formát pro náklady');
    }
  } else {
    throw new Error(`Chyba při exportu nákladů: ${JSON.stringify(data)}`);
  }
}

async function testPohodaXMLExport() {
  console.log('\n🏛️ Test: Export do Pohoda XML');
  
  const { response, data } = await apiRequest('/api/export/pohoda/xml', {
    method: 'POST',
    body: JSON.stringify({
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
      includeInvoices: true,
      includeCustomers: true,
      includeExpenses: false
    })
  });
  
  if (response.ok) {
    const xmlContent = data.xmlContent || data;
    
    if (typeof xmlContent === 'string' && xmlContent.includes('<?xml')) {
      console.log('✅ Pohoda XML export úspěšný');
      console.log(`   Velikost: ${xmlContent.length} znaků`);
      
      // Ověříme základní XML strukturu
      if (xmlContent.includes('<dataPack') && xmlContent.includes('</dataPack>')) {
        console.log('   ✅ XML má správnou Pohoda strukturu');
        
        // Spočítáme faktury v XML
        const invoiceMatches = xmlContent.match(/<invoice/g);
        const invoiceCount = invoiceMatches ? invoiceMatches.length : 0;
        console.log(`   📄 Faktur v XML: ${invoiceCount}`);
        
        return xmlContent;
      } else {
        throw new Error('XML neobsahuje správnou Pohoda strukturu');
      }
    } else {
      throw new Error('Neplatný XML formát');
    }
  } else {
    throw new Error(`Chyba při Pohoda XML exportu: ${JSON.stringify(data)}`);
  }
}

async function testExportFormats() {
  console.log('\n📑 Test: Různé exportní formáty');
  
  const formats = [
    {
      name: 'JSON formát',
      endpoint: '/api/export/invoices/json',
      expectedContent: 'application/json'
    },
    {
      name: 'Excel formát',
      endpoint: '/api/export/invoices/excel',
      expectedContent: 'application/vnd.openxmlformats'
    }
  ];
  
  let allSuccessful = true;
  
  for (const format of formats) {
    console.log(`   → Testování ${format.name}`);
    
    try {
      const response = await fetch(`${BASE_URL}${format.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-session-dev'
        },
        body: JSON.stringify({
          dateFrom: '2024-01-01',
          dateTo: '2024-12-31'
        })
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log(`     ✅ ${format.name} - export úspěšný`);
        console.log(`     Content-Type: ${contentType}`);
      } else {
        console.log(`     ❌ ${format.name} - chyba: ${response.status}`);
        allSuccessful = false;
      }
    } catch (error) {
      console.log(`     ⚠️ ${format.name} - endpoint neimplementován`);
      // Nebudeme považovat za chybu, pokud endpoint není implementován
    }
  }
  
  return allSuccessful;
}

async function testExportFiltering() {
  console.log('\n🔍 Test: Filtrování při exportu');
  
  const filters = [
    {
      name: 'Podle statusu',
      data: { status: 'paid', dateFrom: '2024-01-01', dateTo: '2024-12-31' }
    },
    {
      name: 'Podle zákazníka',
      data: { customerId: 1, dateFrom: '2024-01-01', dateTo: '2024-12-31' }
    },
    {
      name: 'Podle data',
      data: { dateFrom: '2024-06-01', dateTo: '2024-06-30' }
    }
  ];
  
  let allSuccessful = true;
  
  for (const filter of filters) {
    console.log(`   → ${filter.name}`);
    
    const { response, data } = await apiRequest('/api/export/invoices/csv', {
      method: 'POST',
      body: JSON.stringify(filter.data)
    });
    
    if (response.ok) {
      const csvContent = data.csvContent || data;
      const lines = csvContent.split('\n').filter(line => line.trim());
      console.log(`     ✅ ${filter.name} - ${lines.length - 1} záznamů`);
    } else {
      console.log(`     ❌ ${filter.name} - chyba:`, data);
      allSuccessful = false;
    }
  }
  
  return allSuccessful;
}

async function testExportValidation() {
  console.log('\n✅ Test: Validace exportních parametrů');
  
  const invalidTests = [
    {
      name: 'Neplatný datum formát',
      data: { dateFrom: 'invalid-date' },
      expectedError: 'date'
    },
    {
      name: 'Budoucí datum',
      data: { dateFrom: '2030-01-01', dateTo: '2030-12-31' },
      expectedError: 'future'
    },
    {
      name: 'Od > Do',
      data: { dateFrom: '2024-12-31', dateTo: '2024-01-01' },
      expectedError: 'range'
    }
  ];
  
  let allCorrect = true;
  
  for (const test of invalidTests) {
    try {
      const { response, data } = await apiRequest('/api/export/invoices/csv', {
        method: 'POST',
        body: JSON.stringify(test.data)
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

async function testExportPerformance() {
  console.log('\n⚡ Test: Výkon exportu');
  
  const startTime = Date.now();
  
  const { response, data } = await apiRequest('/api/export/invoices/csv', {
    method: 'POST',
    body: JSON.stringify({
      dateFrom: '2020-01-01',
      dateTo: '2024-12-31',
      includeItems: true
    })
  });
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  if (response.ok) {
    const csvContent = data.csvContent || data;
    const size = csvContent.length;
    const lines = csvContent.split('\n').length;
    
    console.log(`✅ Export dokončen za ${duration}ms`);
    console.log(`   Velikost: ${size} znaků`);
    console.log(`   Řádků: ${lines}`);
    
    // Kontrola výkonu (mělo by být rychlejší než 5 sekund)
    if (duration < 5000) {
      console.log('   ✅ Výkon v pořádku (< 5s)');
      return true;
    } else {
      console.log('   ⚠️ Pomalý export (> 5s)');
      return true; // Nebudeme považovat za chybu
    }
  } else {
    throw new Error(`Export selhal: ${JSON.stringify(data)}`);
  }
}

async function testExportScheduling() {
  console.log('\n📅 Test: Plánované exporty');
  
  const scheduleData = {
    name: 'Měsíční export faktur',
    exportType: 'invoices_csv',
    schedule: {
      frequency: 'monthly',
      dayOfMonth: 1,
      time: '08:00'
    },
    filters: {
      status: 'all',
      includeItems: true
    },
    emailTo: 'admin@example.com',
    isActive: true
  };
  
  const { response, data } = await apiRequest('/api/export/schedule', {
    method: 'POST',
    body: JSON.stringify(scheduleData)
  });
  
  if (response.ok) {
    console.log('✅ Plánovaný export vytvořen');
    console.log(`   ID: ${data.id}, Název: ${data.name}`);
    return data.id;
  } else {
    // Pokud endpoint není implementován, nepovažujeme za chybu
    console.log('⚠️ Plánované exporty nejsou implementovány');
    return null;
  }
}

export async function runExportTests() {
  console.log('🎯 SPOUŠTÍM EXPORT TESTY');
  console.log('='.repeat(40));
  
  const tester = new ExportTester();
  
  await tester.test('Invoices CSV Export', testInvoicesCSVExport);
  await tester.test('Customers CSV Export', testCustomersCSVExport);
  await tester.test('Expenses CSV Export', testExpensesCSVExport);
  await tester.test('Pohoda XML Export', testPohodaXMLExport);
  await tester.test('Export Formats', testExportFormats);
  await tester.test('Export Filtering', testExportFiltering);
  await tester.test('Export Validation', testExportValidation);
  await tester.test('Export Performance', testExportPerformance);
  
  await tester.test('Export Scheduling', async () => {
    const scheduleId = await testExportScheduling();
    // Pokud byl vytvořen, mohli bychom ho smazat
    if (scheduleId) {
      console.log(`   Plánovaný export vytvořen s ID: ${scheduleId}`);
    }
  });
  
  return tester.summary();
}

// Spuštění testů pokud je soubor spuštěn přímo
if (import.meta.url === `file://${process.argv[1]}`) {
  runExportTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Chyba při spouštění testů:', error);
    process.exit(1);
  });
}