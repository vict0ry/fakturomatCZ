#!/usr/bin/env node

/**
 * Frontend User Deletion Test
 * Tests the React components and UI functionality for user deletion
 */

import puppeteer from 'puppeteer';

const TEST_CONFIG = {
  baseUrl: 'http://localhost:5000',
  headless: false, // Set to true for CI environments
  slowMo: 100, // Slow down for better visibility
  adminCredentials: {
    // These would typically be set via environment or test setup
    sessionToken: 'test-session-dev'
  }
};

class FrontendUserDeletionTest {
  constructor(config) {
    this.config = config;
    this.browser = null;
    this.page = null;
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

  async setup() {
    this.log('Setting up browser and page...');
    
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.log(`Browser Console Error: ${msg.text()}`, 'error');
      }
    });

    // Set up error handling
    this.page.on('pageerror', error => {
      this.log(`Page Error: ${error.message}`, 'error');
    });

    await this.page.setViewport({ width: 1280, height: 720 });
  }

  async simulateLogin() {
    this.log('Simulating admin login...');
    
    // Navigate to the application
    await this.page.goto(this.config.baseUrl);
    
    // Set session token in localStorage to simulate login
    await this.page.evaluate((token) => {
      localStorage.setItem('sessionId', token);
    }, this.config.adminCredentials.sessionToken);
    
    // Reload to apply session
    await this.page.reload({ waitUntil: 'networkidle0' });
    
    this.log('✅ Admin session simulated', 'success');
  }

  async navigateToSettings() {
    this.log('Navigating to settings page...');
    
    try {
      // Look for settings link/button
      await this.page.waitForSelector('[data-testid*="settings"], a[href*="settings"], button:contains("Nastavení")', { timeout: 5000 });
      
      // Try multiple possible selectors for settings navigation
      const settingsSelectors = [
        '[data-testid="link-settings"]',
        '[data-testid="button-settings"]',
        'a[href="/settings"]',
        'a[href="#settings"]',
        'text=Nastavení'
      ];

      let navigationSuccess = false;
      for (const selector of settingsSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            await element.click();
            navigationSuccess = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!navigationSuccess) {
        // Try direct navigation
        await this.page.goto(`${this.config.baseUrl}/settings`);
      }

      await this.page.waitForSelector('text=Nastavení', { timeout: 5000 });
      this.log('✅ Settings page loaded', 'success');
      
    } catch (error) {
      this.log(`❌ Failed to navigate to settings: ${error.message}`, 'error');
      throw error;
    }
  }

  async navigateToUsersTab() {
    this.log('Navigating to users tab...');
    
    try {
      // Wait for and click users tab
      await this.page.waitForSelector('text=Uživatelé', { timeout: 5000 });
      await this.page.click('text=Uživatelé');
      
      // Wait for user list to load
      await this.page.waitForSelector('text=Seznam všech uživatelů', { timeout: 5000 });
      
      this.log('✅ Users tab loaded', 'success');
    } catch (error) {
      this.log(`❌ Failed to navigate to users tab: ${error.message}`, 'error');
      throw error;
    }
  }

  async testTrashIconPresence() {
    this.log('Testing trash icon presence...');
    
    try {
      // Look for trash icons
      const trashIcons = await this.page.$$('[data-testid*="trash"], .lucide-trash, svg[data-testid*="delete"]');
      
      if (trashIcons.length > 0) {
        this.log(`✅ Found ${trashIcons.length} trash icon(s)`, 'success');
        return true;
      } else {
        // Also check for Trash2 icons specifically
        const trash2Icons = await this.page.$$('.lucide-trash-2');
        if (trash2Icons.length > 0) {
          this.log(`✅ Found ${trash2Icons.length} Trash2 icon(s)`, 'success');
          return true;
        } else {
          this.log('❌ No trash icons found', 'error');
          return false;
        }
      }
    } catch (error) {
      this.log(`❌ Error checking trash icons: ${error.message}`, 'error');
      return false;
    }
  }

  async testDeleteButtonClick() {
    this.log('Testing delete button click functionality...');
    
    try {
      // Find delete buttons (excluding admin users)
      const deleteButtons = await this.page.$$('button:has(.lucide-trash-2):not([disabled])');
      
      if (deleteButtons.length === 0) {
        this.log('⚠️ No delete buttons available for testing', 'error');
        return false;
      }

      // Set up dialog handler before clicking
      let dialogAppeared = false;
      this.page.on('dialog', async dialog => {
        dialogAppeared = true;
        this.log(`✅ Confirmation dialog appeared: "${dialog.message()}"`, 'success');
        await dialog.dismiss(); // Dismiss to avoid actual deletion in test
      });

      // Click the first available delete button
      await deleteButtons[0].click();
      
      // Wait a moment for dialog to appear
      await this.page.waitForTimeout(1000);
      
      if (dialogAppeared) {
        this.log('✅ Delete button click triggered confirmation dialog', 'success');
        return true;
      } else {
        this.log('❌ Delete button click did not trigger confirmation dialog', 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`❌ Error testing delete button: ${error.message}`, 'error');
      return false;
    }
  }

  async testButtonStates() {
    this.log('Testing button states and styling...');
    
    try {
      const deleteButtons = await this.page.$$('button:has(.lucide-trash-2)');
      
      for (let i = 0; i < deleteButtons.length; i++) {
        const button = deleteButtons[i];
        
        // Check if button has proper hover states
        const classes = await button.evaluate(el => el.className);
        
        if (classes.includes('hover:bg-red-50') || classes.includes('hover:text-red-600')) {
          this.log('✅ Delete button has proper hover styling', 'success');
        } else {
          this.log('⚠️ Delete button may be missing hover styling', 'error');
        }
        
        // Check if admin buttons are properly disabled
        const isDisabled = await button.evaluate(el => el.disabled);
        const parentText = await button.evaluate(el => el.closest('div').textContent);
        
        if (parentText.includes('Administrátor') && !isDisabled) {
          this.log('⚠️ Admin user has delete button available (should be hidden)', 'error');
        }
      }
      
      return true;
    } catch (error) {
      this.log(`❌ Error testing button states: ${error.message}`, 'error');
      return false;
    }
  }

  async takeScreenshot(name) {
    try {
      await this.page.screenshot({ 
        path: `test-screenshots/user-deletion-${name}.png`,
        fullPage: true 
      });
      this.log(`📸 Screenshot saved: user-deletion-${name}.png`);
    } catch (error) {
      this.log(`Failed to take screenshot: ${error.message}`, 'error');
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.log('Browser closed');
    }
  }

  generateTestReport() {
    const successCount = this.testResults.filter(r => r.type === 'success').length;
    const errorCount = this.testResults.filter(r => r.type === 'error').length;
    const totalTests = successCount + errorCount;

    console.log('\n' + '='.repeat(60));
    console.log('FRONTEND USER DELETION TEST REPORT');
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

    return errorCount === 0;
  }

  async runAllTests() {
    console.log('🎭 Starting Frontend User Deletion Test Suite');
    console.log(`Target: ${this.config.baseUrl}`);
    console.log('-'.repeat(60));

    try {
      await this.setup();
      await this.simulateLogin();
      await this.navigateToSettings();
      await this.takeScreenshot('settings-page');
      await this.navigateToUsersTab();
      await this.takeScreenshot('users-tab');
      await this.testTrashIconPresence();
      await this.testDeleteButtonClick();
      await this.testButtonStates();
      await this.takeScreenshot('final-state');

    } catch (error) {
      this.log(`Critical test failure: ${error.message}`, 'error');
    } finally {
      await this.cleanup();
    }

    return this.generateTestReport();
  }
}

// Run the test
async function main() {
  // Create screenshots directory
  const { existsSync, mkdirSync } = await import('fs');
  if (!existsSync('test-screenshots')) {
    mkdirSync('test-screenshots');
  }

  const test = new FrontendUserDeletionTest(TEST_CONFIG);
  const success = await test.runAllTests();
  
  process.exit(success ? 0 : 1);
}

// Export the class
export default FrontendUserDeletionTest;

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Frontend test runner failed:', error);
    process.exit(1);
  });
}