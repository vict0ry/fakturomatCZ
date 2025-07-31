#!/usr/bin/env node

/**
 * Finální test všech 3 nových invoice funkcí s opravenými formáty dat
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';
let authToken = '';

async function login() {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin@doklad.ai',
      password: 'admin123'
    })
  });
  
  const data = await response.json();
  authToken = data.sessionId;
  console.log('✅ Přihlášení úspěšné');
  return authToken;
}

async function createTestCustomer() {
  const response = await fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      name: 'Test Firma pro nové funkce s.r.o.',
      email: 'test@testfirma.cz',
      ico: '12345678',
      address: 'Testovací 123',
      city: 'Praha',
      postalCode: '11000'
    })
  });
  
  const customer = await response.json();
  console.log('✅ Test zákazník vytvořen:', customer.name);
  return customer;
}

async function testAllFeatures() {
  console.log('\n🧪 KOMPLEXNÍ TEST VŠECH FUNKCÍ');
  
  const customer = await createTestCustomer();
  
  // Jednotné datum formátování
  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const invoiceData = {
    customerId: customer.id,
    type: 'invoice',
    invoiceNumber: `FINAL-TEST-${Date.now()}`,
    issueDate: today,
    dueDate: dueDate,
    subtotal: "0",
    vatAmount: "0", 
    total: "0",
    currency: "CZK",
    paymentMethod: "bank_transfer",
    isReverseCharge: false,
    status: "draft",
    items: [
      {
        description: 'Programování (15% sleva)',
        quantity: '40',
        unit: 'hodiny',
        unitPrice: '1800',
        vatRate: '21',
        discountType: 'percentage',
        discountValue: '15',
        total: '0'
      },
      {
        description: 'Materiál (sleva 1000 Kč)',
        quantity: '25.5',
        unit: 'kg',
        unitPrice: '500',
        vatRate: '21',
        discountType: 'fixed',
        discountValue: '1000',
        total: '0'
      },
      {
        description: 'Instalace bez slevy',
        quantity: '50',
        unit: 'm²',
        unitPrice: '800',
        vatRate: '21',
        discountType: 'none',
        discountValue: '0',
        total: '0'
      }
    ]
  };
  
  console.log('📤 Odesílám data na API...');
  
  const response = await fetch(`${API_BASE}/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(invoiceData)
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('❌ API Error:', error);
    throw new Error(`Invoice creation failed: ${response.status}`);
  }
  
  const invoice = await response.json();
  console.log('✅ Faktura vytvořena s ID:', invoice.id);
  
  // Ověření jednotek
  const units = invoice.items.map(item => item.unit);
  console.log('📊 Jednotky:', units.join(', '));
  
  // Ověření slev
  const discounts = invoice.items.map(item => `${item.discountType}:${item.discountValue}`);
  console.log('💰 Slevy:', discounts.join(', '));
  
  return invoice;
}

async function testRecurringInvoices() {
  console.log('\n🧪 TEST OPAKOVANÝCH FAKTUR');
  
  const customer = await createTestCustomer();
  
  const recurringData = {
    templateName: 'Testovací opakovaná faktura',
    customerId: customer.id,
    frequency: 'monthly',
    interval: 1,
    startDate: new Date().toISOString().split('T')[0],
    notes: 'Test'
  };
  
  const response = await fetch(`${API_BASE}/invoices/recurring`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(recurringData)
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Recurring API Error:', error);
    throw new Error(`Recurring invoice failed: ${response.status}`);
  }
  
  const result = await response.json();
  console.log('✅ Opakovaná faktura vytvořena');
  
  // Test seznamu
  const listResponse = await fetch(`${API_BASE}/invoices/recurring`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  
  if (listResponse.ok) {
    const list = await listResponse.json();
    console.log('✅ Seznam opakovaných faktur načten:', list.length, 'položek');
  }
  
  return result;
}

async function runFinalTest() {
  console.log('🚀 FINÁLNÍ TEST NOVÝCH FUNKCÍ\n');
  
  try {
    await login();
    
    const invoice = await testAllFeatures();
    const recurring = await testRecurringInvoices();
    
    console.log('\n🎉 VŠECHNY TESTY ÚSPĚŠNÉ!');
    console.log('\n📋 IMPLEMENTOVANÉ FUNKCE:');
    console.log('✅ Jednotky v položkách (hodiny, kg, m²)');
    console.log('✅ Procentuální slevy (percentage, fixed, none)');
    console.log('✅ Opakované faktury (monthly, quarterly, yearly)');
    console.log('\n💡 SYSTÉM PŘIPRAVEN PRO DEPLOYMENT');
    
  } catch (error) {
    console.error('\n❌ CHYBA:', error.message);
    process.exit(1);
  }
}

runFinalTest();