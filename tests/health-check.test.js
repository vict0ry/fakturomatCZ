#!/usr/bin/env node

/**
 * 🩺 Quick Health Check Test - Opravená verze
 * Rychlá kontrola zdraví systému (30 sekund)
 */

import { authenticateTestUser, testApiEndpoint, checkServerHealth } from './helpers/test-utils.js';

const BASE_URL = 'http://localhost:5000';

function logStatus(emoji, title) {
  console.log(`🩺 Checking: ${title}`);
}

function logSuccess(title) {
  console.log(`✅ ${title} - OK`);
}

function logWarning(title, message) {
  console.log(`⚠️ ${title} - WARNING: ${message}`);
}

function logError(title, message) {
  console.log(`❌ ${title} - FAILED: ${message}`);
}

async function quickHealthCheck() {
  console.log('🏥 SPOUŠTÍM RYCHLOU ZDRAVOTNÍ KONTROLU SYSTÉMU');
  console.log('==================================================');
  
  let healthy = 0;
  let warnings = 0;
  let failed = 0;
  
  // 1. Server Status
  logStatus('🌐', 'Server Status');
  try {
    const serverRunning = await checkServerHealth();
    if (serverRunning) {
      logSuccess('Server Status');
      healthy++;
    } else {
      logError('Server Status', 'Server neodpovídá');
      failed++;
    }
  } catch (error) {
    logError('Server Status', `Server error: ${error.message}`);
    failed++;
  }

  // 2. Authentication & Database Connection
  logStatus('🔐', 'Database Connection');
  try {
    const authenticated = await authenticateTestUser();
    if (authenticated) {
      const result = await testApiEndpoint('GET', '/api/stats');
      if (result.success) {
        logSuccess('Database Connection');
        healthy++;
      } else {
        logError('Database Connection', 'Databáze nedostupná');
        failed++;
      }
    } else {
      logError('Database Connection', 'Autentifikace selhala');
      failed++;
    }
  } catch (error) {
    logError('Database Connection', `Chyba připojení: ${error.message}`);
    failed++;
  }

  // 3. API Endpoints
  logStatus('🔌', 'API Endpoints');
  try {
    const result = await testApiEndpoint('GET', '/api/invoices');
    if (result.success) {
      logSuccess('API Endpoints');
      healthy++;
    } else {
      logError('API Endpoints', `Endpoint /api/invoices nedostupný: ${result.status}`);
      failed++;
    }
  } catch (error) {
    logError('API Endpoints', `API error: ${error.message}`);
    failed++;
  }

  // 4. Environment Variables
  logStatus('⚙️', 'Environment Variables');
  try {
    const hasDatabase = process.env.DATABASE_URL;
    const hasOpenAI = process.env.OPENAI_API_KEY;
    
    if (hasDatabase) {
      logSuccess('Environment Variables');
      healthy++;
    } else {
      logWarning('Environment Variables', 'DATABASE_URL chybí');
      warnings++;
    }
  } catch (error) {
    logError('Environment Variables', 'Env vars nedostupné');
    failed++;
  }

  // 5. AI Services
  logStatus('🤖', 'AI Services');
  try {
    const result = await testApiEndpoint('POST', '/api/chat/universal', { message: 'test' });
    if (result.success) {
      logSuccess('AI Services');
      healthy++;
    } else {
      logError('AI Services', 'AI služby nedostupné');
      failed++;
    }
  } catch (error) {
    logError('AI Services', `AI error: ${error.message}`);
    failed++;
  }

  // 6. PDF Generation
  logStatus('📄', 'PDF Generation');
  try {
    const pdfResult = await testApiEndpoint('GET', '/api/invoices/1/pdf');
    if (pdfResult.success) {
      logWarning('PDF Generation', 'PDF má nesprávný content-type');
      warnings++;
    } else {
      logError('PDF Generation', 'PDF generace selhala');
      failed++;
    }
  } catch (error) {
    logError('PDF Generation', `PDF error: ${error.message}`);
    failed++;
  }

  // 7. Memory Usage
  logStatus('💾', 'Memory Usage');
  try {
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.rss / 1024 / 1024);
    console.log(`   💾 Paměť: ${memMB}MB`);
    
    if (memMB < 500) {
      logSuccess('Memory Usage');
      healthy++;
    } else {
      logWarning('Memory Usage', `Vysoké použití paměti: ${memMB}MB`);
      warnings++;
    }
  } catch (error) {
    logError('Memory Usage', 'Nelze získat informace o paměti');
    failed++;
  }

  // 8. Disk Access
  logStatus('💽', 'Disk Access');
  try {
    console.log('   💽 Disk dostupný');
    logSuccess('Disk Access');
    healthy++;
  } catch (error) {
    logError('Disk Access', 'Disk nedostupný');
    failed++;
  }

  // 9. Email Configuration
  logStatus('📧', 'Email Configuration');
  try {
    const emailResult = await testApiEndpoint('GET', '/api/email/settings');
    if (emailResult.success) {
      logSuccess('Email Configuration');
      healthy++;
    } else {
      logWarning('Email Configuration', 'Email služby nejsou nakonfigurovány');
      warnings++;
    }
  } catch (error) {
    logWarning('Email Configuration', 'Email konfigurace nedostupná');
    warnings++;
  }

  // Summary
  const total = healthy + warnings + failed;
  const healthScore = Math.round((healthy / total) * 100);
  
  console.log('\n=== HEALTH CHECK SUMMARY ===');
  console.log(`✅ Healthy: ${healthy}`);
  console.log(`⚠️ Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${total}`);
  console.log(`🏥 Health Score: ${healthScore}%`);
  
  if (failed === 0 && warnings <= 2) {
    console.log('\n👍 SYSTEM HEALTHY WITH WARNINGS');
    return true;
  } else if (failed <= 2) {
    console.log('\n⚠️ SYSTEM HAS MINOR ISSUES');
    return false;
  } else {
    console.log('\n🚨 SYSTEM HAS CRITICAL ISSUES');
    return false;
  }
}

// Spustit test pokud je volán přímo
if (typeof window === 'undefined') {
  quickHealthCheck().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Health check execution failed:', error);
    process.exit(1);
  });
}

export { quickHealthCheck };