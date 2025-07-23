/**
 * Health Check Test - Quick System Status Verification
 * Run with: node tests/health-check.test.js
 */

import { apiRequest } from './helpers/test-utils.js';

const BASE_URL = 'http://localhost:5000';

class HealthChecker {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
    this.results = [];
  }

  async check(name, checkFn, isWarning = false) {
    try {
      console.log(`🩺 Checking: ${name}`);
      await checkFn();
      console.log(`✅ ${name} - OK`);
      this.passed++;
      this.results.push({ name, status: 'OK' });
    } catch (error) {
      if (isWarning) {
        console.log(`⚠️ ${name} - WARNING: ${error.message}`);
        this.warnings++;
        this.results.push({ name, status: 'WARNING', error: error.message });
      } else {
        console.log(`❌ ${name} - FAILED: ${error.message}`);
        this.failed++;
        this.results.push({ name, status: 'FAILED', error: error.message });
      }
    }
  }

  summary() {
    console.log('\n=== HEALTH CHECK SUMMARY ===');
    console.log(`✅ Healthy: ${this.passed}`);
    console.log(`⚠️ Warnings: ${this.warnings}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Total: ${this.passed + this.warnings + this.failed}`);
    
    const healthScore = ((this.passed / (this.passed + this.warnings + this.failed)) * 100).toFixed(1);
    console.log(`🏥 Health Score: ${healthScore}%`);
    
    if (this.failed === 0 && this.warnings === 0) {
      console.log('\n🎉 SYSTEM FULLY HEALTHY');
    } else if (this.failed === 0) {
      console.log('\n👍 SYSTEM HEALTHY WITH WARNINGS');
    } else {
      console.log('\n🚨 SYSTEM HAS CRITICAL ISSUES');
    }
    
    return this.failed === 0;
  }
}

async function checkServerStatus() {
  const response = await fetch(`${BASE_URL}/api/health`);
  if (!response.ok) {
    // Pokud health endpoint neexistuje, zkusíme auth/validate
    const authResponse = await fetch(`${BASE_URL}/api/auth/validate`, {
      headers: { 'Authorization': 'Bearer test-session-dev' }
    });
    if (!authResponse.ok) {
      throw new Error(`Server nedostupný: ${authResponse.status}`);
    }
  }
}

async function checkDatabaseConnection() {
  const { response, data } = await apiRequest('/api/stats');
  if (!response.ok) {
    throw new Error('Databáze nedostupná');
  }
  if (typeof data.revenue === 'undefined') {
    throw new Error('Neplatná struktura databázových dat');
  }
}

async function checkAIServices() {
  const { response, data } = await apiRequest('/api/chat/universal', {
    method: 'POST',
    body: JSON.stringify({
      message: 'test zdravotní kontroly',
      context: {},
      currentPath: '/health',
      chatHistory: [],
      attachments: []
    })
  });
  
  if (!response.ok) {
    throw new Error('AI služby nedostupné');
  }
  if (!data.content) {
    throw new Error('AI nevrací platné odpovědi');
  }
}

async function checkPDFGeneration() {
  // Zkusíme vygenerovat jednoduché PDF
  const response = await fetch(`${BASE_URL}/api/invoices/1/pdf`, {
    headers: { 'Authorization': 'Bearer test-session-dev' }
  });
  
  if (!response.ok) {
    throw new Error('PDF generace nedostupná');
  }
  
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('pdf')) {
    throw new Error('PDF má nesprávný content-type');
  }
}

async function checkAPIEndpoints() {
  const endpoints = [
    '/api/invoices',
    '/api/customers', 
    '/api/expenses',
    '/api/stats'
  ];
  
  for (const endpoint of endpoints) {
    const { response } = await apiRequest(endpoint);
    if (!response.ok) {
      throw new Error(`Endpoint ${endpoint} nedostupný: ${response.status}`);
    }
  }
}

async function checkEmailConfiguration() {
  try {
    const { response } = await apiRequest('/api/email/settings');
    if (!response.ok && response.status !== 404) {
      throw new Error('Email konfigurace má problémy');
    }
  } catch (error) {
    // Email konfigurace není kritická
    throw new Error('Email služby nejsou nakonfigurovány');
  }
}

async function checkMemoryUsage() {
  const memUsage = process.memoryUsage();
  const totalMB = Math.round(memUsage.rss / 1024 / 1024);
  
  if (totalMB > 500) {
    throw new Error(`Vysoká spotřeba paměti: ${totalMB}MB`);
  }
  
  console.log(`   💾 Paměť: ${totalMB}MB`);
}

async function checkDiskSpace() {
  try {
    const fs = await import('fs/promises');
    const stats = await fs.stat('.');
    // Jednoduchá kontrola - pokud můžeme číst aktuální adresář
    console.log('   💽 Disk dostupný');
  } catch (error) {
    throw new Error('Problém s přístupem k disku');
  }
}

async function checkEnvironmentVariables() {
  const requiredEnvVars = ['DATABASE_URL', 'OPENAI_API_KEY'];
  const missing = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    throw new Error(`Chybí env proměnné: ${missing.join(', ')}`);
  }
}

export async function runHealthCheck() {
  console.log('🏥 SPOUŠTÍM RYCHLOU ZDRAVOTNÍ KONTROLU SYSTÉMU');
  console.log('='.repeat(50));
  
  const checker = new HealthChecker();
  
  // Kritické kontroly
  await checker.check('Server Status', checkServerStatus);
  await checker.check('Database Connection', checkDatabaseConnection);
  await checker.check('API Endpoints', checkAPIEndpoints);
  await checker.check('Environment Variables', checkEnvironmentVariables);
  
  // Funkční kontroly
  await checker.check('AI Services', checkAIServices);
  await checker.check('PDF Generation', checkPDFGeneration, true); // warning only
  
  // Systémové kontroly
  await checker.check('Memory Usage', checkMemoryUsage, true);
  await checker.check('Disk Access', checkDiskSpace, true);
  
  // Volitelné kontroly (warnings)
  await checker.check('Email Configuration', checkEmailConfiguration, true);
  
  return checker.summary();
}

// Spuštění testů pokud je soubor spuštěn přímo
if (import.meta.url === `file://${process.argv[1]}`) {
  runHealthCheck().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Chyba při spouštění health check:', error);
    process.exit(1);
  });
}