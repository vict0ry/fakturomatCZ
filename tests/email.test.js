/**
 * Email Tests - Email Sending Functionality
 * Run with: node tests/email.test.js
 */

import { apiRequest } from './helpers/test-utils.js';

const BASE_URL = 'http://localhost:5000';

class EmailTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  async test(name, testFn) {
    try {
      console.log(`📧 Testing: ${name}`);
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
    console.log('\n=== EMAIL TEST SUMMARY ===');
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

async function testEmailConfiguration() {
  console.log('\n🔧 Test: Email konfigurační endpoint');
  
  // Test pouze že endpoint existuje, neukládáme skutečnou konfiguraci
  const { response, data } = await apiRequest('/api/email/settings', {
    method: 'GET'
  });
  
  if (response.ok || response.status === 200) {
    console.log('✅ Email endpoint je dostupný');
    return true;
  } else {
    console.log('❌ Email endpoint není dostupný:', data);
    return false;
  }
}

async function testEmailSending() {
  console.log('\n📨 Test: Odesílání test emailu');
  
  const { response, data } = await apiRequest('/api/email/test', {
    method: 'POST',
    body: JSON.stringify({
      to: 'test@example.com',
      subject: 'Test email z fakturačního systému',
      text: 'Toto je testovací email.'
    })
  });
  
  if (response.ok) {
    console.log('✅ Test email odeslán');
    return true;
  } else {
    console.log('❌ Chyba při odesílání test emailu:', data);
    return false;
  }
}

async function testInvoiceEmailSending() {
  console.log('\n📄 Test: Odesílání faktury emailem');
  
  // Nejprve vytvoříme testovací fakturu
  const invoiceData = {
    customerId: 1,
    invoiceNumber: `TEST-EMAIL-${Date.now()}`,
    type: 'invoice',
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    subtotal: '1000.00',
    vatAmount: '210.00',
    total: '1210.00',
    currency: 'CZK',
    notes: 'Test faktura pro email test'
  };
  
  const { response: createResponse, data: invoice } = await apiRequest('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(invoiceData)
  });
  
  if (!createResponse.ok) {
    throw new Error('Nepodařilo se vytvořit testovací fakturu');
  }
  
  console.log(`   ✅ Testovací faktura vytvořena: ${invoice.invoiceNumber}`);
  
  // Nyní zkusíme odeslat email
  const { response, data } = await apiRequest(`/api/invoices/${invoice.id}/email`, {
    method: 'POST',
    body: JSON.stringify({
      to: 'customer@example.com',
      subject: `Faktura ${invoice.invoiceNumber}`,
      includeAttachment: true
    })
  });
  
  if (response.ok) {
    console.log('✅ Faktura odeslána emailem s PDF přílohou');
    return invoice.id;
  } else {
    console.log('❌ Chyba při odesílání faktury emailem:', data);
    return null;
  }
}

async function testReminderEmailSending(invoiceId) {
  console.log('\n⏰ Test: Odesílání upomínky emailem');
  
  if (!invoiceId) {
    console.log('⚠️ Přeskakujem test - chybí ID faktury');
    return false;
  }
  
  const { response, data } = await apiRequest(`/api/invoices/${invoiceId}/reminder`, {
    method: 'POST',
    body: JSON.stringify({
      reminderType: 'first',
      customMessage: 'Prosíme o uhrazení faktury v nejkratším termínu.'
    })
  });
  
  if (response.ok) {
    console.log('✅ Upomínka odeslána emailem');
    return true;
  } else {
    console.log('❌ Chyba při odesílání upomínky:', data);
    return false;
  }
}

async function testEmailTemplates() {
  console.log('\n📝 Test: Email šablony');
  
  const templates = [
    {
      name: 'Invoice Email Template',
      type: 'invoice',
      subject: 'Faktura {invoiceNumber} od {companyName}',
      body: 'Vážený zákazníku, zasíláme fakturu č. {invoiceNumber}.'
    },
    {
      name: 'Reminder Email Template', 
      type: 'reminder',
      subject: 'Upomínka - faktura {invoiceNumber}',
      body: 'Upozorňujeme na nezaplacenou fakturu {invoiceNumber}.'
    }
  ];
  
  let allSuccessful = true;
  
  for (const template of templates) {
    const { response, data } = await apiRequest('/api/email/templates', {
      method: 'POST',
      body: JSON.stringify(template)
    });
    
    if (response.ok) {
      console.log(`   ✅ ${template.name} - uloženo`);
    } else {
      console.log(`   ❌ ${template.name} - chyba:`, data);
      allSuccessful = false;
    }
  }
  
  return allSuccessful;
}

async function testEmailHistory() {
  console.log('\n📋 Test: Historie odeslaných emailů');
  
  const { response, data } = await apiRequest('/api/emails/history');
  
  if (response.ok) {
    console.log(`✅ Historie načtena - ${data.length} emailů`);
    
    // Zkontrolujeme struktura dat
    if (data.length > 0) {
      const email = data[0];
      const requiredFields = ['id', 'to', 'subject', 'sentAt', 'status'];
      const hasAllFields = requiredFields.every(field => email.hasOwnProperty(field));
      
      if (hasAllFields) {
        console.log('   ✅ Struktura dat v pořádku');
        return true;
      } else {
        console.log('   ❌ Chybí povinná pole v datech');
        return false;
      }
    }
    
    return true;
  } else {
    console.log('❌ Chyba při načítání historie:', data);
    return false;
  }
}

export async function runEmailTests() {
  console.log('🎯 SPOUŠTÍM EMAIL TESTY');
  console.log('='.repeat(40));
  
  const tester = new EmailTester();
  let invoiceId = null;
  
  await tester.test('Email Configuration', testEmailConfiguration);
  await tester.test('Email Sending', testEmailSending);
  
  await tester.test('Invoice Email Sending', async () => {
    invoiceId = await testInvoiceEmailSending();
    if (!invoiceId) throw new Error('Nepodařilo se odeslat fakturu');
  });
  
  await tester.test('Reminder Email Sending', async () => {
    const success = await testReminderEmailSending(invoiceId);
    if (!success) throw new Error('Nepodařilo se odeslat upomínku');
  });
  
  await tester.test('Email Templates', testEmailTemplates);
  await tester.test('Email History', testEmailHistory);
  
  return tester.summary();
}

// Spuštění testů pokud je soubor spuštěn přímo
if (import.meta.url === `file://${process.argv[1]}`) {
  runEmailTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Chyba při spouštění testů:', error);
    process.exit(1);
  });
}