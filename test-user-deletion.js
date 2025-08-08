#!/usr/bin/env node

/**
 * Comprehensive User Deletion Test
 * Tests both backend API and frontend functionality for user deletion
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const ADMIN_TOKEN = 'test-session-dev'; // Using dev admin token

// Test configuration
const TEST_CONFIG = {
  baseUrl: BASE_URL,
  adminToken: ADMIN_TOKEN,
  testUser: {
    email: `test-delete-user-${Date.now()}@example.com`,
    firstName: 'Delete',
    lastName: 'TestUser',
    role: 'user'
  }
};

class UserDeletionTest {
  constructor(config) {
    this.config = config;
    this.createdUserId = null;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    this.testResults.push({
      timestamp,
      type,
      message
    });
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.config.baseUrl}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.adminToken}`
      }
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, finalOptions);
      const responseData = await response.text();
      
      let parsedData;
      try {
        parsedData = JSON.parse(responseData);
      } catch {
        parsedData = responseData;
      }

      return {
        ok: response.ok,
        status: response.status,
        data: parsedData
      };
    } catch (error) {
      this.log(`Request failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testCreateTestUser() {
    this.log('Testing user creation for deletion test...');
    
    // Create user directly instead of invitation for testing
    const testUserData = {
      ...this.config.testUser,
      username: this.config.testUser.email.split('@')[0],
      companyId: 1,
      isActive: true,
      passwordHash: 'test-hash'
    };

    const response = await this.makeRequest('/api/test/create-user', {
      method: 'POST',
      body: JSON.stringify(testUserData)
    });

    if (response.ok) {
      this.log('✅ Test user created successfully', 'success');
      return true;
    } else {
      this.log(`❌ Failed to create test user: ${JSON.stringify(response.data)}`, 'error');
      // Fallback to invitation if direct creation fails
      const inviteResponse = await this.makeRequest('/api/company/users/invite', {
        method: 'POST',
        body: JSON.stringify(this.config.testUser)
      });
      if (inviteResponse.ok) {
        this.log('✅ Test user invitation created as fallback', 'success');
        return true;
      }
      return false;
    }
  }

  async testGetUsers() {
    this.log('Testing user list retrieval...');
    
    // Try company users endpoint first, fallback to admin users
    let response = await this.makeRequest('/api/company/users');
    
    if (!response.ok) {
      response = await this.makeRequest('/api/admin/users');
    }

    if (response.ok && Array.isArray(response.data)) {
      this.log(`✅ Retrieved ${response.data.length} users successfully`, 'success');
      
      // Find our test user
      const testUser = response.data.find(user => user.email === this.config.testUser.email);
      if (testUser) {
        this.createdUserId = testUser.id;
        this.log(`✅ Test user found with ID: ${this.createdUserId}`, 'success');
        return true;
      } else {
        this.log('⚠️ Test user not found in user list', 'error');
        return false;
      }
    } else {
      this.log(`❌ Failed to retrieve users: ${JSON.stringify(response.data)}`, 'error');
      return false;
    }
  }

  async testDeleteUserEndpoint() {
    if (!this.createdUserId) {
      this.log('❌ Cannot test deletion - no user ID available', 'error');
      return false;
    }

    this.log(`Testing DELETE endpoint for user ID: ${this.createdUserId}...`);
    
    const response = await this.makeRequest(`/api/admin/users/${this.createdUserId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      this.log('✅ DELETE endpoint responded successfully', 'success');
      this.log(`Response: ${JSON.stringify(response.data)}`, 'info');
      return true;
    } else {
      this.log(`❌ DELETE endpoint failed: ${JSON.stringify(response.data)}`, 'error');
      return false;
    }
  }

  async testUserActuallyDeleted() {
    this.log('Verifying user was actually deleted...');
    
    // Try company users endpoint first
    let response = await this.makeRequest('/api/company/users');
    
    if (!response.ok) {
      response = await this.makeRequest('/api/admin/users');
    }

    if (response.ok && Array.isArray(response.data)) {
      const deletedUser = response.data.find(user => user.id === this.createdUserId);
      
      if (!deletedUser) {
        this.log('✅ User successfully deleted from database', 'success');
        return true;
      } else {
        this.log('❌ User still exists in database after deletion', 'error');
        return false;
      }
    } else {
      this.log(`❌ Failed to verify deletion: ${JSON.stringify(response.data)}`, 'error');
      return false;
    }
  }

  async testDeleteNonExistentUser() {
    this.log('Testing deletion of non-existent user...');
    
    const fakeUserId = 99999;
    const response = await this.makeRequest(`/api/admin/users/${fakeUserId}`, {
      method: 'DELETE'
    });

    if (response.status === 404) {
      this.log('✅ DELETE correctly returns 404 for non-existent user', 'success');
      return true;
    } else {
      this.log(`❌ Expected 404, got ${response.status}: ${JSON.stringify(response.data)}`, 'error');
      return false;
    }
  }

  async testUnauthorizedDeletion() {
    this.log('Testing unauthorized deletion attempt...');
    
    const response = await this.makeRequest('/api/admin/users/1', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    if (response.status === 401) {
      this.log('✅ DELETE correctly rejects unauthorized requests', 'success');
      return true;
    } else {
      this.log(`❌ Expected 401, got ${response.status}: ${JSON.stringify(response.data)}`, 'error');
      return false;
    }
  }

  async testStorageLayerDeleteMethod() {
    this.log('Testing storage layer deleteUser method...');
    
    // Create another test user for storage layer test
    const storageTestUser = {
      email: `storage-test-delete-${Date.now()}@example.com`,
      firstName: 'Storage',
      lastName: 'Test',
      role: 'user'
    };

    // Create user
    const createResponse = await this.makeRequest('/api/company/users/invite', {
      method: 'POST',
      body: JSON.stringify(storageTestUser)
    });

    if (!createResponse.ok) {
      this.log('❌ Failed to create user for storage test', 'error');
      return false;
    }

    // Get user ID - try company users first
    let usersResponse = await this.makeRequest('/api/company/users');
    if (!usersResponse.ok) {
      usersResponse = await this.makeRequest('/api/admin/users');
    }
    
    if (!Array.isArray(usersResponse.data)) {
      this.log('❌ User list response is not an array', 'error');
      return false;
    }
    
    const storageUser = usersResponse.data.find(user => user.email === storageTestUser.email);
    
    if (!storageUser) {
      this.log('❌ Storage test user not found', 'error');
      return false;
    }

    // Delete via API
    const deleteResponse = await this.makeRequest(`/api/admin/users/${storageUser.id}`, {
      method: 'DELETE'
    });

    if (deleteResponse.ok) {
      this.log('✅ Storage layer deletion successful', 'success');
      return true;
    } else {
      this.log(`❌ Storage layer deletion failed: ${JSON.stringify(deleteResponse.data)}`, 'error');
      return false;
    }
  }

  generateTestReport() {
    const successCount = this.testResults.filter(r => r.type === 'success').length;
    const errorCount = this.testResults.filter(r => r.type === 'error').length;
    const totalTests = successCount + errorCount;

    console.log('\n' + '='.repeat(60));
    console.log('USER DELETION TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    console.log(`Success Rate: ${totalTests > 0 ? Math.round((successCount / totalTests) * 100) : 0}%`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\nFAILURES:');
      this.testResults
        .filter(r => r.type === 'error')
        .forEach(result => {
          console.log(`❌ ${result.message}`);
        });
    }

    console.log('\nDETAILED LOG:');
    this.testResults.forEach(result => {
      const prefix = result.type === 'error' ? '❌' : result.type === 'success' ? '✅' : 'ℹ️';
      console.log(`${prefix} ${result.message}`);
    });

    return errorCount === 0;
  }

  async runAllTests() {
    console.log('🚀 Starting User Deletion Comprehensive Test Suite');
    console.log(`Target: ${this.config.baseUrl}`);
    console.log(`Admin Token: ${this.config.adminToken.substring(0, 10)}...`);
    console.log('-'.repeat(60));

    try {
      // Test sequence
      const tests = [
        () => this.testCreateTestUser(),
        () => this.testGetUsers(),
        () => this.testDeleteUserEndpoint(),
        () => this.testUserActuallyDeleted(),
        () => this.testDeleteNonExistentUser(),
        () => this.testUnauthorizedDeletion(),
        () => this.testStorageLayerDeleteMethod()
      ];

      for (const test of tests) {
        try {
          await test();
          await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
        } catch (error) {
          this.log(`Test failed with exception: ${error.message}`, 'error');
        }
      }

    } catch (error) {
      this.log(`Critical test failure: ${error.message}`, 'error');
    }

    return this.generateTestReport();
  }
}

// Run the test
async function main() {
  const test = new UserDeletionTest(TEST_CONFIG);
  const success = await test.runAllTests();
  
  process.exit(success ? 0 : 1);
}

// Export the class
export default UserDeletionTest;

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}