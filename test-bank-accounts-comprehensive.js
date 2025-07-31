#!/usr/bin/env node

/**
 * Comprehensive Bank Accounts API Testing Suite
 * Tests all CRUD operations and validates the complete functionality
 */

const BASE_URL = 'http://localhost:5000';

// Test utilities
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.text();
  let jsonData;
  try {
    jsonData = JSON.parse(data);
  } catch {
    jsonData = { raw: data };
  }

  return {
    status: response.status,
    ok: response.ok,
    data: jsonData,
    headers: response.headers
  };
}

async function login() {
  console.log('🔑 Logging in to get session token...');
  const response = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: 'testuser123',
      password: 'password123'
    })
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${JSON.stringify(response.data)}`);
  }
  
  console.log('✅ Login successful');
  return response.data.sessionId;
}

// Test data - Matching the exact schema fields
const testBankAccount = {
  "name": "Test CZK Account",
  "accountNumber": "123456789/0100",
  "iban": "CZ6501000000000123456789",
  "swift": "KOMBCZPP",
  "currency": "CZK",
  "bankName": "Komerční banka",
  "bankCode": "0100",
  "enablePaymentMatching": true,
  "enableOutgoingPaymentMatching": false,
  "enableBulkMatching": false,
  "displayInOverview": true
};

async function runTests() {
  let sessionToken;
  let createdAccountId;
  
  try {
    // 1. Authentication
    sessionToken = await login();
    
    // 2. Test CREATE bank account
    console.log('\n📤 Testing CREATE bank account...');
    console.log('Session token:', sessionToken);
    console.log('Test data:', JSON.stringify(testBankAccount, null, 2));
    
    const createResponse = await makeRequest('/api/bank-accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify(testBankAccount)
    });
    
    console.log(`Status: ${createResponse.status}`);
    console.log(`Response:`, JSON.stringify(createResponse.data, null, 2));
    
    if (createResponse.ok) {
      createdAccountId = createResponse.data.id;
      console.log('✅ Bank account created successfully');
      
      // Verify payment email was generated
      if (testBankAccount.enablePaymentMatching && createResponse.data.paymentEmail) {
        console.log(`✅ Payment email generated: ${createResponse.data.paymentEmail}`);
      }
    } else {
      console.log('❌ Bank account creation failed');
    }
    
    // 3. Test GET all bank accounts
    console.log('\n📥 Testing GET all bank accounts...');
    const getAllResponse = await makeRequest('/api/bank-accounts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
    
    console.log(`Status: ${getAllResponse.status}`);
    console.log(`Response:`, JSON.stringify(getAllResponse.data, null, 2));
    
    if (getAllResponse.ok) {
      console.log(`✅ Retrieved ${getAllResponse.data.length} bank accounts`);
    } else {
      console.log('❌ Failed to get bank accounts');
    }
    
    // 4. Test GET single bank account (if created)
    if (createdAccountId) {
      console.log(`\n📥 Testing GET single bank account (ID: ${createdAccountId})...`);
      const getOneResponse = await makeRequest(`/api/bank-accounts/${createdAccountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      console.log(`Status: ${getOneResponse.status}`);
      console.log(`Response:`, JSON.stringify(getOneResponse.data, null, 2));
      
      if (getOneResponse.ok) {
        console.log('✅ Retrieved single bank account successfully');
      } else {
        console.log('❌ Failed to get single bank account');
      }
    }
    
    // 5. Test UPDATE bank account (if created)
    if (createdAccountId) {
      console.log(`\n📝 Testing UPDATE bank account (ID: ${createdAccountId})...`);
      const updateData = {
        name: "Updated Test Account",
        displayInOverview: false,
        enablePaymentMatching: false
      };
      
      const updateResponse = await makeRequest(`/api/bank-accounts/${createdAccountId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(updateData)
      });
      
      console.log(`Status: ${updateResponse.status}`);
      console.log(`Response:`, JSON.stringify(updateResponse.data, null, 2));
      
      if (updateResponse.ok) {
        console.log('✅ Bank account updated successfully');
      } else {
        console.log('❌ Failed to update bank account');
      }
    }
    
    // 6. Test validation errors
    console.log('\n❗ Testing validation errors...');
    const invalidData = {
      name: "", // Empty name should fail
      currency: "INVALID", // Invalid currency
      enablePaymentMatching: "not_boolean" // Invalid boolean
    };
    
    const validationResponse = await makeRequest('/api/bank-accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify(invalidData)
    });
    
    console.log(`Status: ${validationResponse.status}`);
    console.log(`Response:`, JSON.stringify(validationResponse.data, null, 2));
    
    if (validationResponse.status === 400) {
      console.log('✅ Validation errors properly caught');
    } else {
      console.log('❌ Validation should have failed');
    }
    
    // 7. Test authentication required
    console.log('\n🔒 Testing authentication requirement...');
    const unauthResponse = await makeRequest('/api/bank-accounts', {
      method: 'GET'
      // No Authorization header
    });
    
    console.log(`Status: ${unauthResponse.status}`);
    console.log(`Response:`, JSON.stringify(unauthResponse.data, null, 2));
    
    if (unauthResponse.status === 401) {
      console.log('✅ Authentication properly required');
    } else {
      console.log('❌ Should require authentication');
    }
    
    // 8. Test DELETE bank account (soft delete)
    if (createdAccountId) {
      console.log(`\n🗑️ Testing DELETE bank account (ID: ${createdAccountId})...`);
      const deleteResponse = await makeRequest(`/api/bank-accounts/${createdAccountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      console.log(`Status: ${deleteResponse.status}`);
      console.log(`Response:`, JSON.stringify(deleteResponse.data, null, 2));
      
      if (deleteResponse.ok) {
        console.log('✅ Bank account deleted (soft delete) successfully');
      } else {
        console.log('❌ Failed to delete bank account');
      }
    }
    
    console.log('\n🎉 Bank Accounts API testing completed!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the tests
console.log('🚀 Starting Bank Accounts API Comprehensive Tests...');
console.log('=' .repeat(60));

runTests().then(() => {
  console.log('\n✨ All tests completed!');
}).catch((error) => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});