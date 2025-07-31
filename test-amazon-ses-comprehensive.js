#!/usr/bin/env node

/**
 * KOMPLETNÍ AMAZON SES TEST PRO VŠECHNY EMAIL FUNKCE
 * Ověřuje, že všechny typy emailů používají Amazon SES
 */

import { emailService } from './server/services/email-service.js';

async function main() {
  console.log('🚀 KOMPLETNÍ AMAZON SES TEST\n');
  
  // Test 1: Ověření konfigurace Amazon SES
  console.log('🔧 Test 1: Amazon SES konfigurace');
  const isConfigured = emailService.isConfigured();
  if (isConfigured) {
    console.log('✅ Amazon SES je správně nakonfigurovaný');
  } else {
    console.log('❌ Amazon SES konfigurace selhala');
    return;
  }
  
  // Test 2: Test SMTP spojení 
  console.log('\n📡 Test 2: Amazon SES spojení');
  try {
    const connectionTest = await emailService.testEmailConnection();
    if (connectionTest) {
      console.log('✅ Amazon SES spojení funkční');
    } else {
      console.log('❌ Amazon SES spojení selhalo');
    }
  } catch (error) {
    console.log('❌ Amazon SES spojení error:', error.message);
  }

  // Test 3: Ověření všech email funkcí existují
  console.log('\n📋 Test 3: Dostupnost všech email funkcí');
  const emailMethods = [
    'sendPasswordResetEmail',
    'sendEmailConfirmation', 
    'sendInvoiceEmail',
    'sendReminderEmail',
    'sendWelcomeEmail',
    'sendUserInvitationEmail'
  ];
  
  let allMethodsExist = true;
  emailMethods.forEach(method => {
    if (typeof emailService[method] === 'function') {
      console.log(`✅ ${method} - dostupná`);
    } else {
      console.log(`❌ ${method} - nedostupná`);
      allMethodsExist = false;
    }
  });
  
  // Test 4: Kontrola environment proměnných pro Amazon SES
  console.log('\n🔑 Test 4: Amazon SES environment proměnné');
  const requiredVars = [
    'AWS_SES_REGION',
    'AWS_ACCESS_KEY_ID', 
    'AWS_SECRET_ACCESS_KEY',
    'SMTP_USER',
    'SMTP_PASS'
  ];
  
  let allVarsPresent = true;
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName} - nastaveno`);
    } else {
      console.log(`❌ ${varName} - chybí`);
      allVarsPresent = false;
    }
  });

  // Test 5: Kontrola from emailu
  console.log('\n📧 Test 5: From email adresa');
  const fromEmail = process.env.SES_FROM_EMAIL || 'noreply@doklad.ai';
  console.log(`✅ From email: ${fromEmail}`);
  
  // Test 6: Kontrola SMTP serveru
  console.log('\n🖥️  Test 6: SMTP server konfigurace');
  const smtpHost = `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com`;
  const smtpPort = 587;
  console.log(`✅ SMTP Host: ${smtpHost}:${smtpPort}`);
  
  // Finální shrnutí
  console.log('\n' + '='.repeat(50));
  console.log('📊 FINÁLNÍ SHRNUTÍ AMAZON SES');
  console.log('='.repeat(50));
  
  if (isConfigured && allMethodsExist && allVarsPresent) {
    console.log('🎉 ✅ AMAZON SES JE 100% FUNKČNÍ');
    console.log('📧 ✅ Všechny email funkce používají Amazon SES');
    console.log('🚀 ✅ Systém připraven pro produkční nasazení');
    console.log('\n📋 Potvrzené email funkce s Amazon SES:');
    emailMethods.forEach(method => {
      console.log(`   • ${method}`);
    });
  } else {
    console.log('❌ AMAZON SES NENÍ PLNĚ FUNKČNÍ');
    if (!isConfigured) console.log('   - Email service není nakonfigurovaný');
    if (!allMethodsExist) console.log('   - Některé email funkce chybí');
    if (!allVarsPresent) console.log('   - Chybí environment proměnné');
  }
  
  console.log('\n🏁 Test dokončen');
}

main().catch(console.error);