#!/usr/bin/env node

// Test script to verify actual functionality
const { exec } = require('child_process');

console.log('🧪 TESTING REAL FUNCTIONALITY');
console.log('==============================');

// Test 1: Email sending
console.log('\n1. Testing email sending...');
exec(`curl -s "http://localhost:5000/api/test/send-monthly-report" -X POST -H "Content-Type: application/json" -d '{"user": {"firstName": "Test", "lastName": "User", "email": "test@example.com"}, "company": {"name": "Test Company"}, "reportData": {"totalInvoices": 5, "totalAmount": "50000"}}'`, (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Email test failed:', error.message);
    return;
  }
  console.log('📧 Email test result:', stdout);
});

// Test 2: Database connection
console.log('\n2. Testing database connection...');
exec(`curl -s "http://localhost:5000/api/test-db-connection"`, (error, stdout, stderr) => {
  if (error) {
    console.log('❌ DB test failed:', error.message);
    return;
  }
  console.log('🗄️ Database test result:', stdout.substring(0, 100) + '...');
});

// Test 3: Check recent changes in code
console.log('\n3. Checking recent changes...');
exec('grep -n "item_updated_via_form\\|items_updated" server/routes/invoices.ts', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Code check failed:', error.message);
    return;
  }
  console.log('🔧 Recent changes found:', stdout);
});

setTimeout(() => {
  console.log('\n✅ Test completed. Check results above.');
}, 2000);