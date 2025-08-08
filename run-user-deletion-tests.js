#!/usr/bin/env node

/**
 * Master Test Runner for User Deletion Functionality
 * Runs both backend API tests and frontend UI tests
 */

import UserDeletionTest from './test-user-deletion.js';
import FrontendUserDeletionTest from './test-frontend-user-deletion.js';
import fetch from 'node-fetch';

class MasterTestRunner {
  constructor() {
    this.results = {
      backend: null,
      frontend: null,
      overall: false
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runBackendTests() {
    console.log('\n🔧 BACKEND API TESTS');
    console.log('='.repeat(60));
    
    try {
      const backendTest = new UserDeletionTest({
        baseUrl: 'http://localhost:5000',
        adminToken: 'test-session-dev',
        testUser: {
          email: 'comprehensive-test-user@example.com',
          firstName: 'Comprehensive',
          lastName: 'TestUser',
          role: 'user'
        }
      });

      this.results.backend = await backendTest.runAllTests();
      return this.results.backend;

    } catch (error) {
      this.log(`Backend tests failed: ${error.message}`, 'error');
      this.results.backend = false;
      return false;
    }
  }

  async runFrontendTests() {
    console.log('\n🎭 FRONTEND UI TESTS');
    console.log('='.repeat(60));
    
    try {
      const frontendTest = new FrontendUserDeletionTest({
        baseUrl: 'http://localhost:5000',
        headless: true, // Run headless for automated testing
        slowMo: 0,
        adminCredentials: {
          sessionToken: 'test-session-dev'
        }
      });

      this.results.frontend = await frontendTest.runAllTests();
      return this.results.frontend;

    } catch (error) {
      this.log(`Frontend tests failed: ${error.message}`, 'error');
      this.results.frontend = false;
      return false;
    }
  }

  async checkPrerequisites() {
    this.log('Checking test prerequisites...');
    
    // Check if server is running
    try {
      const response = await fetch('http://localhost:5000/api/health', { 
        timeout: 5000 
      });
      
      if (response.ok) {
        this.log('✅ Server is running and accessible', 'success');
        return true;
      } else {
        this.log('❌ Server responded with error status', 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ Server is not accessible: ${error.message}`, 'error');
      this.log('Please ensure the development server is running on port 5000', 'error');
      return false;
    }
  }

  generateFinalReport() {
    console.log('\n' + '='.repeat(80));
    console.log('COMPREHENSIVE USER DELETION TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log('Backend API Tests:', this.results.backend ? '✅ PASSED' : '❌ FAILED');
    console.log('Frontend UI Tests:', this.results.frontend ? '✅ PASSED' : '❌ FAILED');
    
    this.results.overall = this.results.backend && this.results.frontend;
    console.log('Overall Result:', this.results.overall ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    
    console.log('\n📋 TEST SUMMARY:');
    if (this.results.backend) {
      console.log('✅ DELETE API endpoint working correctly');
      console.log('✅ User deletion from database confirmed');
      console.log('✅ Error handling for invalid requests verified');
      console.log('✅ Authorization checks functioning properly');
    } else {
      console.log('❌ Backend API tests failed - check server implementation');
    }
    
    if (this.results.frontend) {
      console.log('✅ UI components rendering properly');
      console.log('✅ Delete buttons have proper click handlers');
      console.log('✅ Confirmation dialogs working correctly');
      console.log('✅ Button states and styling correct');
    } else {
      console.log('❌ Frontend UI tests failed - check React components');
    }
    
    console.log('='.repeat(80));
    
    if (this.results.overall) {
      console.log('🎉 USER DELETION FUNCTIONALITY IS FULLY OPERATIONAL! 🎉');
    } else {
      console.log('🔧 SOME ISSUES DETECTED - REVIEW TEST OUTPUT ABOVE 🔧');
    }
    
    return this.results.overall;
  }

  async runAllTests() {
    console.log('🚀 MASTER USER DELETION TEST SUITE');
    console.log('Testing both backend API and frontend UI functionality');
    console.log('Started at:', new Date().toISOString());
    console.log('='.repeat(80));

    // Check prerequisites
    const prerequisitesPassed = await this.checkPrerequisites();
    if (!prerequisitesPassed) {
      console.log('❌ Prerequisites failed - aborting tests');
      return false;
    }

    // Run backend tests
    await this.runBackendTests();
    
    // Add delay between test suites
    console.log('\n⏳ Waiting 2 seconds before frontend tests...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run frontend tests
    await this.runFrontendTests();
    
    // Generate final report
    return this.generateFinalReport();
  }
}

// Health check endpoint test
async function createHealthEndpoint() {
  try {
    const { readFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const routesPath = join(__dirname, 'server', 'routes.ts');
    
    const routesContent = readFileSync(routesPath, 'utf8');
    
    if (!routesContent.includes('/api/health')) {
      console.log('⚠️ Health endpoint not found - this is normal for testing');
    }
  } catch (error) {
    console.log('⚠️ Could not check for health endpoint');
  }
}

// Run the master test suite
async function main() {
  await createHealthEndpoint();
  
  const masterRunner = new MasterTestRunner();
  const success = await masterRunner.runAllTests();
  
  process.exit(success ? 0 : 1);
}

// Export the class
export default MasterTestRunner;

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Master test runner failed:', error);
    process.exit(1);
  });
}