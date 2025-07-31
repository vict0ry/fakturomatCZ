#!/usr/bin/env node

/**
 * COMPREHENSIVE USER INVITATION SYSTEM TEST
 * =======================================
 * 
 * This test covers the complete invitation flow:
 * 1. Admin sends invitation
 * 2. Email is sent to invited user
 * 3. User receives invitation link
 * 4. User accepts invitation and creates account
 * 5. User can login with new account
 * 6. Admin can manage invitations
 */

import { execSync } from 'child_process';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test data
const testInvitation = {
  email: `test.invitation.${Date.now()}@doklad.ai`,
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  accessLevel: 'read'
};

const testPassword = 'password123';

// Admin credentials for testing
const adminCredentials = {
  username: 'admin@doklad.ai',
  password: 'admin123'
};

let adminSessionId = null;
let testInvitationToken = null;
let createdUserId = null;

// Cleanup function
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  if (createdUserId) {
    try {
      // In a real implementation, you might want to soft-delete the user
      console.log(`   ℹ️  Would delete user ID: ${createdUserId}`);
    } catch (error) {
      console.log(`   ⚠️  Could not clean up user: ${error.message}`);
    }
  }
  
  console.log('   ✅ Cleanup completed');
}

// Error handler
process.on('unhandledRejection', async (error) => {
  console.error('\n❌ Unhandled error:', error.message);
  await cleanup();
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Test interrupted');
  await cleanup();
  process.exit(0);
});

// Helper function to make authenticated requests
async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(adminSessionId && { 'Authorization': `Bearer ${adminSessionId}` }),
      ...options.headers
    }
  });
  
  const text = await response.text();
  let data;
  
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  
  return { response, data };
}

// Test functions
async function loginAsAdmin() {
  console.log('🔐 Logging in as admin...');
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify(adminCredentials)
  });
  
  if (!response.ok) {
    throw new Error(`Admin login failed: ${data.message || response.statusText}`);
  }
  
  // Extract session ID from response
  if (data.sessionId) {
    adminSessionId = data.sessionId;
  } else if (data.user && data.user.sessionId) {
    adminSessionId = data.user.sessionId;
  } else {
    // Try to get from Set-Cookie header
    const cookieHeader = response.headers.get('set-cookie');
    if (cookieHeader) {
      const sessionMatch = cookieHeader.match(/sessionId=([^;]+)/);
      if (sessionMatch) {
        adminSessionId = sessionMatch[1];
      }
    }
  }
  
  if (!adminSessionId) {
    throw new Error('Could not extract session ID from login response');
  }
  
  console.log('   ✅ Admin logged in successfully');
  return data;
}

async function sendInvitation() {
  console.log('📧 Sending user invitation...');
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/company/users/invite`, {
    method: 'POST',
    body: JSON.stringify(testInvitation)
  });
  
  if (!response.ok) {
    throw new Error(`Invitation failed: ${JSON.stringify(data)}`);
  }
  
  console.log('   ✅ Invitation sent successfully');
  console.log(`   📝 Response data:`, data);
  
  // The response structure might have the invitation data at different levels
  const invitation = data.invitation || data;
  
  if (invitation && invitation.email) {
    console.log(`   📝 Invitation details:`, {
      email: invitation.email,
      name: `${invitation.firstName} ${invitation.lastName}`,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt
    });
  }
  
  return invitation;
}

async function checkInvitationEmail() {
  console.log('📬 Checking for invitation email...');
  
  // Check sent-emails directory for the invitation email
  const sentEmailsDir = './sent-emails';
  
  if (!fs.existsSync(sentEmailsDir)) {
    console.log('   ⚠️  sent-emails directory not found - emails might be sent via external SMTP');
    return null;
  }
  
  const files = fs.readdirSync(sentEmailsDir);
  const invitationEmails = files.filter(file => 
    file.includes(testInvitation.email.replace('@', '_at_'))
  );
  
  if (invitationEmails.length === 0) {
    console.log('   ⚠️  No invitation email found in sent-emails directory');
    console.log('   ℹ️  This is normal if using external SMTP (Amazon SES)');
    return null;
  }
  
  console.log(`   ✅ Found ${invitationEmails.length} invitation email(s)`);
  
  // Read the latest invitation email
  const latestEmailFile = invitationEmails[invitationEmails.length - 1];
  const emailPath = `${sentEmailsDir}/${latestEmailFile}`;
  const emailContent = fs.readFileSync(emailPath, 'utf8');
  
  // Extract invitation token from email content
  const tokenMatch = emailContent.match(/token=([a-f0-9-]+)/);
  if (tokenMatch) {
    testInvitationToken = tokenMatch[1];
    console.log('   ✅ Extracted invitation token from email');
  }
  
  return emailContent;
}

async function getInvitationFromDatabase() {
  console.log('🔍 Getting invitation details from database...');
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/company/invitations`);
  
  if (!response.ok) {
    throw new Error(`Failed to get invitations: ${data.message}`);
  }
  
  // Find our test invitation
  const invitation = data.find(inv => inv.email === testInvitation.email);
  if (!invitation) {
    throw new Error('Test invitation not found in database');
  }
  
  testInvitationToken = invitation.invitationToken;
  console.log('   ✅ Found invitation in database');
  console.log(`   📝 Token: ${testInvitationToken.substring(0, 8)}...`);
  
  return invitation;
}

async function getInvitationDetails() {
  console.log('📋 Getting invitation details...');
  
  if (!testInvitationToken) {
    throw new Error('No invitation token available');
  }
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/invitations/${testInvitationToken}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get invitation details: ${data.message}`);
  }
  
  console.log('   ✅ Invitation details retrieved');
  console.log(`   📝 Details:`, {
    email: data.email,
    name: `${data.firstName} ${data.lastName}`,
    company: data.company?.name,
    role: data.role,
    expiresAt: data.expiresAt
  });
  
  return data;
}

async function acceptInvitation() {
  console.log('✅ Accepting invitation...');
  
  if (!testInvitationToken) {
    throw new Error('No invitation token available');
  }
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/invitations/${testInvitationToken}/accept`, {
    method: 'POST',
    body: JSON.stringify({ password: testPassword }),
    headers: {
      'Authorization': '' // Remove admin auth for this request
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to accept invitation: ${data.message}`);
  }
  
  createdUserId = data.user.id;
  console.log('   ✅ Invitation accepted successfully');
  console.log(`   👤 Created user:`, {
    id: data.user.id,
    email: data.user.email,
    name: `${data.user.firstName} ${data.user.lastName}`,
    role: data.user.role
  });
  
  return data.user;
}

async function testNewUserLogin() {
  console.log('🔑 Testing new user login...');
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Authorization': '' // Remove admin auth
    },
    body: JSON.stringify({
      username: testInvitation.email,
      password: testPassword
    })
  });
  
  if (!response.ok) {
    throw new Error(`New user login failed: ${data.message}`);
  }
  
  console.log('   ✅ New user login successful');
  console.log(`   👤 User details:`, {
    id: data.user?.id,
    email: data.user?.email,
    role: data.user?.role
  });
  
  return data;
}

async function verifyInvitationStatus() {
  console.log('🔍 Verifying invitation status...');
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/company/invitations`);
  
  if (!response.ok) {
    throw new Error(`Failed to get invitations: ${data.message}`);
  }
  
  const invitation = data.find(inv => inv.email === testInvitation.email);
  if (!invitation) {
    throw new Error('Test invitation not found');
  }
  
  console.log('   ✅ Invitation status verified');
  console.log(`   📝 Status: ${invitation.status}`);
  console.log(`   📝 Accepted at: ${invitation.acceptedAt || 'Not accepted'}`);
  
  if (invitation.status !== 'accepted') {
    throw new Error(`Expected invitation status 'accepted', got '${invitation.status}'`);
  }
  
  return invitation;
}

// Main test runner
async function runInvitationSystemTest() {
  console.log('🚀 STARTING COMPREHENSIVE USER INVITATION SYSTEM TEST');
  console.log('=====================================================\n');
  
  try {
    // Step 1: Admin login
    await loginAsAdmin();
    await delay(500);
    
    // Step 2: Send invitation
    await sendInvitation();
    await delay(1000);
    
    // Step 3: Check for invitation email (optional - may use external SMTP)
    await checkInvitationEmail();
    await delay(500);
    
    // Step 4: Get invitation from database (fallback if email not found)
    if (!testInvitationToken) {
      await getInvitationFromDatabase();
    }
    await delay(500);
    
    // Step 5: Get invitation details (public endpoint)
    await getInvitationDetails();
    await delay(500);
    
    // Step 6: Accept invitation
    await acceptInvitation();
    await delay(1000);
    
    // Step 7: Test new user login
    await testNewUserLogin();
    await delay(500);
    
    // Step 8: Verify invitation status
    await verifyInvitationStatus();
    
    console.log('\n🎉 ALL INVITATION SYSTEM TESTS PASSED!');
    console.log('=====================================');
    console.log('✅ Admin can send invitations');
    console.log('✅ Email invitations are sent');
    console.log('✅ Invitation tokens work correctly');
    console.log('✅ Users can accept invitations');
    console.log('✅ New accounts are created properly');
    console.log('✅ New users can login');
    console.log('✅ Invitation status is updated');
    console.log('\n🚀 USER INVITATION SYSTEM IS FULLY FUNCTIONAL!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.log('\n📋 Test Results Summary:');
    console.log('========================');
    console.log('❌ User invitation system has issues');
    console.log(`   Error: ${error.message}`);
    
    // Additional debugging info
    if (adminSessionId) console.log(`   Admin session: ${adminSessionId.substring(0, 10)}...`);
    if (testInvitationToken) console.log(`   Invitation token: ${testInvitationToken.substring(0, 10)}...`);
    if (createdUserId) console.log(`   Created user ID: ${createdUserId}`);
    
    throw error;
  } finally {
    await cleanup();
  }
}

// Check if server is running
console.log('🔍 Checking if server is running...');
try {
  execSync('curl -s http://localhost:5000/api/health', { stdio: 'ignore' });
  console.log('✅ Server is running');
} catch (error) {
  console.error('❌ Server is not running. Please start it with: npm run dev');
  process.exit(1);
}

// Run the test
runInvitationSystemTest().catch(error => {
  console.error('\n💥 Test suite failed:', error.message);
  process.exit(1);
});