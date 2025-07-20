/**
 * Test utility functions for the invoice management system
 */

const BASE_URL = 'http://localhost:5000';

/**
 * Test API endpoint with proper error handling
 */
async function testApiEndpoint(method, endpoint, data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    };

    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseData = await response.json().catch(() => null);

    return {
      success: response.ok,
      status: response.status,
      data: responseData,
      error: responseData?.error || (!response.ok ? `HTTP ${response.status}` : null)
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

/**
 * Log test description
 */
function logTest(description) {
  console.log(`🧪 ${description}`);
}

/**
 * Log test result with proper formatting
 */
function logResult(success, message) {
  const prefix = success ? '  ✅' : '  ❌';
  console.log(`${prefix} ${message}`);
}

/**
 * Format duration in human readable format
 */
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Wait for specified amount of time
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if server is running
 */
async function checkServerHealth() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/validate`, {
      credentials: 'include'
    });
    return response.ok || response.status === 401; // 401 is ok, means server is running but not authenticated
  } catch (error) {
    return false;
  }
}

/**
 * Authenticate test user for API calls
 */
async function authenticateTestUser() {
  try {
    // First try to login with test user
    let response = await testApiEndpoint('POST', '/api/auth/login', {
      username: 'test',
      password: 'test'
    });
    
    if (response.success) {
      return true;
    }
    
    // If test user doesn't exist, try to register
    response = await testApiEndpoint('POST', '/api/auth/register', {
      username: 'test',
      password: 'test',
      companyName: 'Test Company'
    });
    
    if (response.success) {
      // Now login with the newly created user
      response = await testApiEndpoint('POST', '/api/auth/login', {
        username: 'test',
        password: 'test'
      });
      return response.success;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

export {
  testApiEndpoint,
  logTest,
  logResult,
  formatDuration,
  sleep,
  checkServerHealth,
  authenticateTestUser,
  BASE_URL
};