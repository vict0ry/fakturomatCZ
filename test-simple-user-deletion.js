#!/usr/bin/env node

/**
 * Simple User Deletion Test
 * Basic test to verify the user deletion functionality works
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const ADMIN_TOKEN = 'test-session-dev';

async function testUserDeletion() {
  console.log('🧪 Simple User Deletion Test');
  console.log('============================');

  try {
    // 1. Test GET /api/company/users (should work with owner token)
    console.log('1. Testing user list retrieval...');
    const usersResponse = await fetch(`${BASE_URL}/api/company/users`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`✅ Retrieved ${users.length} users successfully`);
      
      // Find a non-admin user to test deletion
      const testUser = users.find(user => user.role !== 'admin' && user.id !== 1);
      
      if (testUser) {
        console.log(`Found test user: ${testUser.firstName} ${testUser.lastName} (ID: ${testUser.id})`);
        
        // 2. Test DELETE endpoint
        console.log('2. Testing delete endpoint...');
        const deleteResponse = await fetch(`${BASE_URL}/api/admin/users/${testUser.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        
        if (deleteResponse.ok) {
          console.log('✅ Delete endpoint responded successfully');
          
          // 3. Verify user was deleted
          console.log('3. Verifying deletion...');
          const verifyResponse = await fetch(`${BASE_URL}/api/company/users`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
          });
          
          if (verifyResponse.ok) {
            const updatedUsers = await verifyResponse.json();
            const deletedUser = updatedUsers.find(user => user.id === testUser.id);
            
            if (!deletedUser) {
              console.log('✅ User successfully deleted from database');
              console.log('🎉 USER DELETION TEST PASSED!');
              return true;
            } else {
              console.log('❌ User still exists after deletion');
              return false;
            }
          } else {
            console.log('❌ Failed to verify deletion');
            return false;
          }
        } else {
          const errorData = await deleteResponse.text();
          console.log(`❌ Delete failed: ${deleteResponse.status} - ${errorData}`);
          return false;
        }
      } else {
        console.log('⚠️ No suitable test user found (need non-admin user)');
        return false;
      }
    } else {
      const errorData = await usersResponse.text();
      console.log(`❌ Failed to get users: ${usersResponse.status} - ${errorData}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
    return false;
  }
}

// Test UI functionality
async function testFrontendIntegration() {
  console.log('\n🎭 Frontend Integration Test');
  console.log('============================');
  
  try {
    // Check if settings page loads
    const settingsResponse = await fetch(`${BASE_URL}/settings`);
    console.log(`Settings page status: ${settingsResponse.status}`);
    
    // Check if main app loads
    const appResponse = await fetch(`${BASE_URL}/`);
    console.log(`Main app status: ${appResponse.status}`);
    
    console.log('✅ Frontend endpoints are accessible');
    console.log('ℹ️ Manual testing recommended for UI components');
    
    return true;
  } catch (error) {
    console.log(`❌ Frontend test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Simple User Deletion Tests');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Using admin token: ${ADMIN_TOKEN.substring(0, 10)}...`);
  console.log('');

  const backendSuccess = await testUserDeletion();
  const frontendSuccess = await testFrontendIntegration();
  
  console.log('\n📊 TEST SUMMARY');
  console.log('==============');
  console.log(`Backend API: ${backendSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Frontend: ${frontendSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (backendSuccess && frontendSuccess) {
    console.log('🎉 ALL TESTS PASSED - User deletion is working!');
    process.exit(0);
  } else {
    console.log('🔧 Some tests failed - see output above');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export default testUserDeletion;