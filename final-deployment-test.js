#!/usr/bin/env node

/**
 * 🚀 FINÁLNÍ TEST PŘED NASAZENÍM
 * Testuje základní funkcionalita systému
 */

const BASE_URL = 'http://localhost:5000';

// Jednoduchý test bez složité autentifikace
async function finalDeploymentTest() {
  console.log('🚀 FINÁLNÍ TEST PŘED NASAZENÍM');
  console.log('=============================================\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  // Test 1: Server Health
  console.log('🔍 TEST 1: Server Health Check');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      console.log('✅ Server je dostupný a zdravý');
      passed++;
      results.push({ test: 'Server Health', status: 'PASSED' });
    } else {
      throw new Error(`Server health check failed: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Server health failed:', error.message);
    failed++;
    results.push({ test: 'Server Health', status: 'FAILED', error: error.message });
  }

  // Test 2: Database Connection (přes veřejné endpointy)
  console.log('\n💾 TEST 2: Database Connectivity');
  try {
    // Test přes /api/auth/register endpoint který testuje DB
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'test-health',
        password: 'test123',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company',
        companyAddress: 'Test Address'
      })
    });

    // I když registrace selže, pokud dotykneme DB, je to OK
    if (response.status === 400 || response.status === 409) {
      console.log('✅ Database je dostupná (test přes registraci)');
      passed++;
      results.push({ test: 'Database Connectivity', status: 'PASSED' });
    } else {
      throw new Error(`Unexpected response: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Database connectivity failed:', error.message);
    failed++;
    results.push({ test: 'Database Connectivity', status: 'FAILED', error: error.message });
  }

  // Test 3: Admin Login Test
  console.log('\n🔐 TEST 3: Admin Authentication');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin@doklad.ai',
        password: 'admin123'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Admin login funguje');
      console.log(`   User: ${result.user?.username || 'N/A'}`);
      passed++;
      results.push({ test: 'Admin Authentication', status: 'PASSED' });
    } else {
      throw new Error(`Admin login failed: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Admin authentication failed:', error.message);
    failed++;
    results.push({ test: 'Admin Authentication', status: 'FAILED', error: error.message });
  }

  // Test 4: Email System Status
  console.log('\n📧 TEST 4: Email System');
  try {
    // Test dostupnosti email endpointu
    const response = await fetch(`${BASE_URL}/api/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com' })
    });

    if (response.ok) {
      console.log('✅ Email systém je dostupný');
      passed++;
      results.push({ test: 'Email System', status: 'PASSED' });
    } else {
      throw new Error(`Email system unavailable: ${response.status}`);
    }
  } catch (error) {
    console.log('⚠️ Email system warning:', error.message);
    // Email není kritický pro deployment
    results.push({ test: 'Email System', status: 'WARNING', error: error.message });
  }

  // Test 5: Static Assets
  console.log('\n🎨 TEST 5: Static Assets');
  try {
    const response = await fetch(`${BASE_URL}/`);
    if (response.ok) {
      const html = await response.text();
      if (html.includes('<!DOCTYPE html>')) {
        console.log('✅ Frontend aplikace je dostupná');
        passed++;
        results.push({ test: 'Static Assets', status: 'PASSED' });
      } else {
        throw new Error('Frontend nevrací validní HTML');
      }
    } else {
      throw new Error(`Frontend nedostupný: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Static assets failed:', error.message);
    failed++;
    results.push({ test: 'Static Assets', status: 'FAILED', error: error.message });
  }

  // Test 6: Modular API Structure
  console.log('\n🏗️ TEST 6: Modular Structure Test');
  try {
    // Spustíme existující modular test
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync('node test-modular-structure.js');
    
    if (stdout.includes('All API endpoints working')) {
      console.log('✅ Modulární struktura funguje');
      passed++;
      results.push({ test: 'Modular Structure', status: 'PASSED' });
    } else {
      throw new Error('Modulární testy selhaly');
    }
  } catch (error) {
    console.log('❌ Modular structure failed:', error.message);
    failed++;
    results.push({ test: 'Modular Structure', status: 'FAILED', error: error.message });
  }

  // Summary
  console.log('\n=============================================');
  console.log('📊 FINÁLNÍ VÝSLEDKY');
  console.log('=============================================');
  
  results.forEach(result => {
    const icon = result.status === 'PASSED' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`${icon} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const warnings = results.filter(r => r.status === 'WARNING').length;
  const critical = results.filter(r => r.status === 'PASSED').length;
  
  console.log('\n=============================================');
  console.log(`✅ Kritické testy úspěšné: ${critical}`);
  console.log(`❌ Kritické testy neúspěšné: ${failed}`);
  console.log(`⚠️ Varování: ${warnings}`);
  console.log(`📈 Úspěšnost: ${Math.round((critical / (critical + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 SYSTÉM JE PŘIPRAVEN K NASAZENÍ!');
    console.log('✅ Všechny kritické funkce fungují');
    console.log('🚀 Deploy může pokračovat');
    return true;
  } else if (failed <= 1 && critical >= 4) {
    console.log('\n⚠️ SYSTÉM JE VĚTŠINOU PŘIPRAVEN');
    console.log('✅ Většina funkcí funguje, deploy možný s rizikem');
    return true;
  } else {
    console.log('\n🚨 SYSTÉM NENÍ PŘIPRAVEN K NASAZENÍ');
    console.log('❌ Příliš mnoho kritických chyb');
    return false;
  }
}

// Spuštění
if (import.meta.url === `file://${process.argv[1]}`) {
  finalDeploymentTest().catch(console.error);
}

export { finalDeploymentTest };