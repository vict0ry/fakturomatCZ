#!/usr/bin/env node

/**
 * 🧪 Advanced Features Tests
 * Tests advanced AI and system functionality including:
 * - Smart invoice sharing with public links
 * - Advanced AI function calling
 * - Business insights and analytics
 * - Payment risk prediction
 * - Email campaign optimization
 */

import { testApiEndpoint, logTest, logResult, formatDuration } from './helpers/test-utils.js';

const BASE_URL = 'http://localhost:5000';

async function runAdvancedFeatureTests() {
  console.log('🧪 === ADVANCED FEATURES TESTS ===\n');
  
  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  // Test 1: AI Business Insights
  try {
    logTest('1. Testing AI business insights');
    const response = await testApiEndpoint('POST', '/api/chat', {
      message: 'Proveď analýzu našeho podnikání a dej mi business insights',
      sessionId: 'test-session-insights'
    });
    
    if (response.success && response.data && response.data.response) {
      const aiResponse = response.data.response.toLowerCase();
      if (aiResponse.includes('analýza') || aiResponse.includes('insight') || aiResponse.includes('doporučení')) {
        logResult(true, `✅ AI business insights working`);
        passed++;
      } else {
        logResult(false, '❌ AI business insights not working properly');
        failed++;
      }
    } else {
      logResult(false, '❌ AI business insights failed: ' + (response.error || 'No response'));
      failed++;
    }
  } catch (error) {
    logResult(false, '❌ Error testing business insights: ' + error.message);
    failed++;
  }

  // Test 2: Payment Risk Prediction
  try {
    logTest('2. Testing payment risk prediction');
    const response = await testApiEndpoint('POST', '/api/chat', {
      message: 'Vyhodnoť platební riziko zákazníka ABC Company',
      sessionId: 'test-session-risk'
    });
    
    if (response.success && response.data && response.data.response) {
      const aiResponse = response.data.response.toLowerCase();
      if (aiResponse.includes('riziko') || aiResponse.includes('platba') || aiResponse.includes('zákazník')) {
        logResult(true, `✅ Payment risk prediction working`);
        passed++;
      } else {
        logResult(false, '❌ Payment risk prediction not working properly');
        failed++;
      }
    } else {
      logResult(false, '❌ Payment risk prediction failed: ' + (response.error || 'No response'));
      failed++;
    }
  } catch (error) {
    logResult(false, '❌ Error testing payment risk prediction: ' + error.message);
    failed++;
  }

  // Test 3: Email Campaign Optimization
  try {
    logTest('3. Testing email campaign optimization');
    const response = await testApiEndpoint('POST', '/api/chat', {
      message: 'Optimalizuj naši email kampaň pro připomínky plateb',
      sessionId: 'test-session-email'
    });
    
    if (response.success && response.data && response.data.response) {
      const aiResponse = response.data.response.toLowerCase();
      if (aiResponse.includes('email') || aiResponse.includes('kampaň') || aiResponse.includes('optimalizace')) {
        logResult(true, `✅ Email campaign optimization working`);
        passed++;
      } else {
        logResult(false, '❌ Email campaign optimization not working properly');
        failed++;
      }
    } else {
      logResult(false, '❌ Email campaign optimization failed: ' + (response.error || 'No response'));
      failed++;
    }
  } catch (error) {
    logResult(false, '❌ Error testing email optimization: ' + error.message);
    failed++;
  }

  // Test 4: Smart Report Generation
  try {
    logTest('4. Testing smart report generation');
    const response = await testApiEndpoint('POST', '/api/chat', {
      message: 'Vygeneruj mi chytrý report s predikcemi a analýzami',
      sessionId: 'test-session-reports'
    });
    
    if (response.success && response.data && response.data.response) {
      const aiResponse = response.data.response.toLowerCase();
      if (aiResponse.includes('report') || aiResponse.includes('analýza') || aiResponse.includes('predikce')) {
        logResult(true, `✅ Smart report generation working`);
        passed++;
      } else {
        logResult(false, '❌ Smart report generation not working properly');
        failed++;
      }
    } else {
      logResult(false, '❌ Smart report generation failed: ' + (response.error || 'No response'));
      failed++;
    }
  } catch (error) {
    logResult(false, '❌ Error testing smart reports: ' + error.message);
    failed++;
  }

  // Test 5: Smart Expense Categorization
  try {
    logTest('5. Testing smart expense categorization');
    const response = await testApiEndpoint('POST', '/api/chat', {
      message: 'Proveď chytrou kategorizaci nákladů a detekuj duplicity',
      sessionId: 'test-session-categorization'
    });
    
    if (response.success && response.data && response.data.response) {
      const aiResponse = response.data.response.toLowerCase();
      if (aiResponse.includes('kategorizace') || aiResponse.includes('náklad') || aiResponse.includes('duplicita')) {
        logResult(true, `✅ Smart expense categorization working`);
        passed++;
      } else {
        logResult(false, '❌ Smart expense categorization not working properly');
        failed++;
      }
    } else {
      logResult(false, '❌ Smart expense categorization failed: ' + (response.error || 'No response'));
      failed++;
    }
  } catch (error) {
    logResult(false, '❌ Error testing expense categorization: ' + error.message);
    failed++;
  }

  // Test 6: Invoice Sharing System
  try {
    logTest('6. Testing invoice sharing system');
    // First try to get invoices
    const invoicesResponse = await testApiEndpoint('GET', '/api/invoices');
    
    if (invoicesResponse.success && Array.isArray(invoicesResponse.data) && invoicesResponse.data.length > 0) {
      const testInvoiceId = invoicesResponse.data[0].id;
      
      // Test creating share token
      const shareResponse = await testApiEndpoint('POST', `/api/invoices/${testInvoiceId}/share`, {
        expiresInDays: 7,
        requirePassword: false
      });
      
      if (shareResponse.success && shareResponse.data && shareResponse.data.shareToken) {
        logResult(true, `✅ Invoice sharing token created: ${shareResponse.data.shareToken.substring(0, 8)}...`);
        passed++;
        
        // Test accessing shared invoice
        try {
          const publicResponse = await testApiEndpoint('GET', `/api/public/invoice/${shareResponse.data.shareToken}`);
          if (publicResponse.success) {
            logResult(true, `✅ Public invoice access working`);
            passed++;
          } else {
            logResult(false, '❌ Public invoice access failed');
            failed++;
          }
        } catch (error) {
          logResult(false, '❌ Error accessing public invoice: ' + error.message);
          failed++;
        }
      } else {
        logResult(false, '❌ Failed to create share token: ' + (shareResponse.error || 'Unknown error'));
        failed += 2; // Count both sharing and public access as failed
      }
    } else {
      logResult(false, '❌ No invoices available for sharing test');
      failed += 2; // Count both sharing and public access as failed
    }
  } catch (error) {
    logResult(false, '❌ Error testing invoice sharing: ' + error.message);
    failed += 2;
  }

  // Test 7: Advanced AI Function Calling
  try {
    logTest('7. Testing advanced AI function calling');
    const response = await testApiEndpoint('POST', '/api/chat', {
      message: 'Aktualizuj cenu faktury 1 na 15000 Kč a přidej poznámku "Test funkce"',
      sessionId: 'test-session-functions'
    });
    
    if (response.success && response.data && response.data.response) {
      const aiResponse = response.data.response.toLowerCase();
      if (aiResponse.includes('aktualizov') || aiResponse.includes('změn') || aiResponse.includes('pozn')) {
        logResult(true, `✅ Advanced AI function calling working`);
        passed++;
      } else {
        logResult(false, '❌ Advanced AI function calling not working properly');
        failed++;
      }
    } else {
      logResult(false, '❌ Advanced AI function calling failed: ' + (response.error || 'No response'));
      failed++;
    }
  } catch (error) {
    logResult(false, '❌ Error testing advanced function calling: ' + error.message);
    failed++;
  }

  // Test 8: File Upload AI Integration
  try {
    logTest('8. Testing file upload AI integration');
    const response = await testApiEndpoint('POST', '/api/chat', {
      message: 'Analyzuj nahraný dokument a vytvoř z něj náklad',
      attachments: [{
        type: 'application/pdf',
        content: 'JVBERi0xLjMKJbfrj...', // Mock base64 PDF
        filename: 'test-receipt.pdf'
      }],
      sessionId: 'test-session-upload'
    });
    
    if (response.success && response.data && response.data.response) {
      const aiResponse = response.data.response.toLowerCase();
      if (aiResponse.includes('analýza') || aiResponse.includes('dokument') || aiResponse.includes('náklad')) {
        logResult(true, `✅ File upload AI integration working`);
        passed++;
      } else {
        logResult(false, '❌ File upload AI integration not working properly');
        failed++;
      }
    } else {
      logResult(false, '❌ File upload AI integration failed: ' + (response.error || 'No response'));
      failed++;
    }
  } catch (error) {
    logResult(false, '❌ Error testing file upload integration: ' + error.message);
    failed++;
  }

  // Test 9: ARES Integration
  try {
    logTest('9. Testing ARES integration');
    const response = await testApiEndpoint('POST', '/api/chat', {
      message: 'Vyhledej informace o firmě s IČO 25596641 přes ARES',
      sessionId: 'test-session-ares'
    });
    
    if (response.success && response.data && response.data.response) {
      const aiResponse = response.data.response.toLowerCase();
      if (aiResponse.includes('ares') || aiResponse.includes('firmy') || aiResponse.includes('ičo')) {
        logResult(true, `✅ ARES integration working`);
        passed++;
      } else {
        logResult(false, '❌ ARES integration not working properly');
        failed++;
      }
    } else {
      logResult(false, '❌ ARES integration failed: ' + (response.error || 'No response'));
      failed++;
    }
  } catch (error) {
    logResult(false, '❌ Error testing ARES integration: ' + error.message);
    failed++;
  }

  // Test 10: Complex Multi-step Operations
  try {
    logTest('10. Testing complex multi-step operations');
    const response = await testApiEndpoint('POST', '/api/chat', {
      message: 'Vytvoř fakturu pro ABC Company, označ ji jako odeslanou a vygeneruj PDF',
      sessionId: 'test-session-complex'
    });
    
    if (response.success && response.data && response.data.response) {
      const aiResponse = response.data.response.toLowerCase();
      if (aiResponse.includes('fakturu') && (aiResponse.includes('odeslan') || aiResponse.includes('pdf'))) {
        logResult(true, `✅ Complex multi-step operations working`);
        passed++;
      } else {
        logResult(false, '❌ Complex multi-step operations not working properly');
        failed++;
      }
    } else {
      logResult(false, '❌ Complex multi-step operations failed: ' + (response.error || 'No response'));
      failed++;
    }
  } catch (error) {
    logResult(false, '❌ Error testing complex operations: ' + error.message);
    failed++;
  }

  // Results
  console.log('\n' + '='.repeat(50));
  console.log(`📊 ADVANCED FEATURES RESULT: ${passed}✅ / ${failed}❌`);
  console.log(`⏱️ Duration: ${formatDuration(Date.now() - startTime)}`);
  
  if (failed === 0) {
    console.log('🎉 All advanced features working!');
  } else {
    console.log('⚠️ Some advanced features need attention');
  }
  
  console.log('='.repeat(50) + '\n');
  
  return { passed, failed, total: passed + failed };
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAdvancedFeatureTests().catch(console.error);
}

export { runAdvancedFeatureTests };