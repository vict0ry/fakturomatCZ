#!/usr/bin/env node

// Quick test of modular structure performance
import { performance } from 'perf_hooks';

const API_BASE = 'http://localhost:5000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'f4997d57-a07b-4211-ab8c-4c6c3be71740';

async function testEndpoint(endpoint, description) {
  const start = performance.now();
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const duration = Math.round(performance.now() - start);
    const status = response.ok ? '✅' : '❌';
    const data = response.ok ? await response.json() : await response.text();
    
    console.log(`${status} ${description} (${duration}ms)`);
    
    if (response.ok && Array.isArray(data)) {
      console.log(`   📊 Returned ${data.length} items`);
    } else if (!response.ok) {
      console.log(`   ❌ Error: ${data}`);
    }
    
    return { success: response.ok, duration };
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    console.log(`❌ ${description} (${duration}ms) - ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Modular API Structure\n');
  
  const tests = [
    ['/api/admin/users', 'Admin Users List (new modular)'],
    ['/api/auth/validate', 'Auth Validation'],
    ['/api/stats', 'Company Stats'],
    ['/api/invoices/recent', 'Recent Invoices'],
    ['/api/customers', 'Customers List']
  ];
  
  const results = [];
  
  for (const [endpoint, description] of tests) {
    const result = await testEndpoint(endpoint, description);
    results.push({ endpoint, description, ...result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📈 Performance Summary:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgDuration = Math.round(successful.reduce((sum, r) => sum + r.duration, 0) / successful.length);
    const maxDuration = Math.max(...successful.map(r => r.duration));
    const minDuration = Math.min(...successful.map(r => r.duration));
    
    console.log(`⏱️  Average Response: ${avgDuration}ms`);
    console.log(`🚀 Fastest: ${minDuration}ms`);
    console.log(`🐌 Slowest: ${maxDuration}ms`);
  }
  
  console.log('\n💡 Modular Structure Benefits:');
  console.log('- Independent service testing');
  console.log('- Faster debugging (specific modules)');
  console.log('- Parallel development capability');
  console.log('- Easier maintenance and updates');
  
  if (failed.length === 0) {
    console.log('\n🎉 All API endpoints working with modular structure!');
  } else {
    console.log('\n⚠️  Some endpoints need attention');
  }
}

runTests().catch(console.error);