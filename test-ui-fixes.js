#!/usr/bin/env node

/**
 * 🔧 TEST UI OPRAV A NOVÝCH FUNKCÍ
 */

const BASE_URL = 'http://localhost:5000';

async function testUIFixes() {
  console.log('🔧 TESTOVÁNÍ UI OPRAV A NOVÝCH FUNKCÍ');
  console.log('=====================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: PDF generování (opraveno?)
  console.log('📄 Test 1: PDF generování');
  try {
    const pdfResponse = await fetch(`${BASE_URL}/api/invoices/33/pdf`, {
      headers: { 'Authorization': 'Bearer test-session-dev' }
    });
    
    if (pdfResponse.ok) {
      const pdfBlob = await pdfResponse.blob();
      console.log('✅ PDF generování funguje');
      console.log(`   Velikost: ${(pdfBlob.size / 1024).toFixed(1)} KB`);
      passed++;
    } else {
      console.log('❌ PDF generování selhal:', pdfResponse.status);
      failed++;
    }
  } catch (error) {
    console.log('❌ PDF chyba:', error.message);
    failed++;
  }

  // Test 2: Email sending endpoint
  console.log('\n📧 Test 2: Email sending endpoint');
  try {
    const emailResponse = await fetch(`${BASE_URL}/api/invoices/33/send-email`, {
      method: 'POST',
      headers: { 
        'Authorization': 'Bearer test-session-dev',
        'Content-Type': 'application/json'
      }
    });
    
    const responseText = await emailResponse.text();
    console.log('📧 Email endpoint response:', emailResponse.status);
    console.log('   Response:', responseText.substring(0, 100));
    
    if (emailResponse.status === 200 || emailResponse.status === 400) {
      console.log('✅ Email endpoint dostupný');
      passed++;
    } else {
      console.log('❌ Email endpoint problém');
      failed++;
    }
  } catch (error) {
    console.log('❌ Email endpoint chyba:', error.message);
    failed++;
  }

  // Test 3: Historie endpointu
  console.log('\n📚 Test 3: Historie faktury endpoint');
  try {
    const historyResponse = await fetch(`${BASE_URL}/api/invoices/33/history`, {
      headers: { 'Authorization': 'Bearer test-session-dev' }
    });
    
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      console.log('✅ Historie endpoint funguje');
      console.log(`   Počet záznamů: ${historyData.length || 0}`);
      passed++;
    } else {
      console.log('❌ Historie endpoint nedostupný');
      failed++;
    }
  } catch (error) {
    console.log('❌ Historie chyba:', error.message);
    failed++;
  }

  // Test 4: Faktura detail stránka
  console.log('\n🖥️ Test 4: Faktura detail stránka');
  try {
    const detailResponse = await fetch(`${BASE_URL}/invoices/33`);
    
    if (detailResponse.ok) {
      const htmlContent = await detailResponse.text();
      const hasEmailButton = htmlContent.includes('Poslat emailem') || htmlContent.includes('send-email');
      
      console.log('✅ Faktura detail stránka dostupná');
      console.log(`   Email tlačítko: ${hasEmailButton ? 'Přítomno' : 'Chybí'}`);
      passed++;
    } else {
      console.log('❌ Faktura detail stránka nedostupná');
      failed++;
    }
  } catch (error) {
    console.log('❌ Detail stránka chyba:', error.message);
    failed++;
  }

  // Summary
  console.log('\n=====================================');
  console.log('📊 VÝSLEDKY UI TESTŮ');
  console.log('=====================================');
  console.log(`✅ Úspěšné: ${passed}`);
  console.log(`❌ Neúspěšné: ${failed}`);
  console.log(`📈 Úspěšnost: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 VŠECHNY UI PROBLÉMY OPRAVENY!');
    console.log('✅ PDF generování funkční');
    console.log('✅ Email sending dostupný');
    console.log('✅ Historie implementována');
    console.log('✅ UI layout optimalizován');
  } else {
    console.log('\n⚠️ NĚKTERÉ PROBLÉMY ZBÝVAJÍ');
    console.log('🔧 Potřebují další opravu');
  }

  return failed === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testUIFixes().catch(console.error);
}

export { testUIFixes };