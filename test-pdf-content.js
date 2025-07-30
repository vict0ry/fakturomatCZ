#!/usr/bin/env node

/**
 * 🔍 TEST PDF OBSAHU A KVALITY
 */

import fs from 'fs';

const BASE_URL = 'http://localhost:5000';

async function testPDFContent() {
  console.log('🔍 TESTOVÁNÍ PDF OBSAHU A KVALITY');
  console.log('==================================\n');

  try {
    // Stáhnout PDF
    console.log('📄 Stahování PDF faktury...');
    const pdfResponse = await fetch(`${BASE_URL}/api/invoices/33/pdf`, {
      headers: { 'Authorization': 'Bearer test-session-dev' }
    });
    
    if (!pdfResponse.ok) {
      console.log('❌ PDF stahování selhalo:', pdfResponse.status);
      return false;
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);
    
    console.log(`📊 PDF velikost: ${(pdfBytes.length / 1024).toFixed(1)} KB`);
    console.log(`📊 PDF velikost: ${pdfBytes.length} bytes`);

    // Uložit pro analýzu
    fs.writeFileSync('test-invoice.pdf', pdfBytes);
    console.log('💾 PDF uloženo jako test-invoice.pdf');

    // Základní PDF validace
    const pdfHeader = String.fromCharCode(...pdfBytes.slice(0, 8));
    console.log(`🔍 PDF hlavička: "${pdfHeader}"`);
    
    const isValidPDF = pdfHeader.startsWith('%PDF-');
    console.log(`✅ Validní PDF hlavička: ${isValidPDF ? 'ANO' : 'NE'}`);

    // Hledat PDF objekty a obsah
    const pdfContent = String.fromCharCode(...pdfBytes);
    const hasObjects = pdfContent.includes(' obj') && pdfContent.includes('endobj');
    const hasStream = pdfContent.includes('stream') && pdfContent.includes('endstream');
    const hasText = pdfContent.includes('/Text') || pdfContent.includes('BT') || pdfContent.includes('ET');
    const hasTrailer = pdfContent.includes('trailer') && pdfContent.includes('startxref');

    console.log('\n🔍 PDF STRUKTURA ANALÝZA:');
    console.log(`   PDF objekty: ${hasObjects ? '✅ Přítomny' : '❌ Chybí'}`);
    console.log(`   Stream data: ${hasStream ? '✅ Přítomny' : '❌ Chybí'}`);
    console.log(`   Text obsah: ${hasText ? '✅ Přítomny' : '❌ Chybí'}`);
    console.log(`   PDF trailer: ${hasTrailer ? '✅ Přítomny' : '❌ Chybí'}`);

    // Hledat specifický obsah faktury
    const hasInvoiceContent = pdfContent.includes('Faktura') || 
                             pdfContent.includes('Invoice') ||
                             pdfContent.includes('20257471');
    
    const hasCompanyInfo = pdfContent.includes('s.r.o') || 
                          pdfContent.includes('IČO') ||
                          pdfContent.includes('DIČ');

    console.log('\n📋 OBSAH FAKTURY:');
    console.log(`   Faktura text: ${hasInvoiceContent ? '✅ Nalezen' : '❌ Chybí'}`);
    console.log(`   Firemní údaje: ${hasCompanyInfo ? '✅ Nalezeny' : '❌ Chybí'}`);

    // Kontrola na HTML fallback
    const isHTMLFallback = pdfContent.includes('<html>') || 
                          pdfContent.includes('<!DOCTYPE') ||
                          pdfContent.includes('<body>');
    
    if (isHTMLFallback) {
      console.log('\n⚠️  ZJIŠTĚN HTML FALLBACK');
      console.log('   PDF bylo vygenerováno jako HTML fallback');
      console.log('   Puppeteer pravděpodobně selhal');
    }

    // Finální hodnocení
    console.log('\n==================================');
    console.log('📊 VÝSLEDEK PDF TESTU');
    console.log('==================================');
    
    if (pdfBytes.length < 5000) {
      console.log('⚠️  PDF JE PŘÍLIŠ MALÉ');
      console.log('   Pravděpodobně neobsahuje kompletní obsah');
    }
    
    if (isValidPDF && hasObjects && hasStream && !isHTMLFallback) {
      console.log('✅ PDF JE VALIDNÍ A KOMPLETNÍ');
      console.log('   Mělo by se správně otevřít v PDF prohlížeči');
    } else if (isHTMLFallback) {
      console.log('⚠️  PDF JE HTML FALLBACK');
      console.log('   Funkční, ale ne optimální kvalita');
      console.log('   Doporučuji opravit Puppeteer');
    } else {
      console.log('❌ PDF MÁ PROBLÉMY');
      console.log('   Může být poškozené nebo neúplné');
    }

    return isValidPDF && (hasObjects || isHTMLFallback);

  } catch (error) {
    console.log('❌ Chyba při testování PDF:', error.message);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testPDFContent().catch(console.error);
}

export { testPDFContent };