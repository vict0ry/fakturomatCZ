#!/usr/bin/env node

console.log('🔍 Analýza Amazon SES credentials:\n');

console.log('📧 SMTP Configuration:');
console.log('SMTP_USER:', process.env.SMTP_USER || 'NENÍ NASTAVENO');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? `${process.env.SMTP_PASS.substring(0,20)}...` : 'NENÍ NASTAVENO');
console.log('AWS_SES_REGION:', process.env.AWS_SES_REGION || 'NENÍ NASTAVENO');

console.log('\n🔑 AWS API Credentials:');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID || 'NENÍ NASTAVENO');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? `${process.env.AWS_SECRET_ACCESS_KEY.substring(0,20)}...` : 'NENÍ NASTAVENO');

console.log('\n🚨 PROBLÉM:');
console.log('SMTP_USER má hodnotu "noreply" - to není správný Amazon SES SMTP username');
console.log('Amazon SES SMTP username musí být ve formátu "AKIA..." (podobně jako Access Key)');

console.log('\n💡 ŘEŠENÍ:');
console.log('1. Jít do AWS Console → Simple Email Service');
console.log('2. Kliknout na "SMTP Settings" v levém menu');
console.log('3. Kliknout "Create SMTP Credentials"');
console.log('4. Stáhnout credentials - username bude začínat "AKIA..."');
console.log('5. Nastavit nové environment variables:');
console.log('   SMTP_USER=AKIA... (z AWS)');
console.log('   SMTP_PASS=... (z AWS)');

console.log('\n🎯 Současné vs. Potřebné:');
console.log('Současný SMTP_USER:', process.env.SMTP_USER, '❌');
console.log('Potřebný SMTP_USER: AKIA... (SES SMTP username) ✅');