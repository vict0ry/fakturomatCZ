import nodemailer from 'nodemailer';

console.log('🔧 OPRAVA AMAZON SES CREDENTIALS');
console.log('===============================');
console.log('');

// Kontrola credentials
console.log('📋 Aktuální konfigurace:');
console.log(`   Region: ${process.env.AWS_SES_REGION}`);
console.log(`   Access Key: ${process.env.AWS_ACCESS_KEY_ID?.substring(0,10)}...`);
console.log(`   From Email: ${process.env.SES_FROM_EMAIL}`);
console.log('');

console.log('⚠️  PROBLÉM IDENTIFIKOVÁN:');
console.log('   535 Authentication Credentials Invalid');
console.log('');
console.log('🔍 MOŽNÉ PŘÍČINY:');
console.log('   1. AWS credentials nejsou pro SMTP (jsou pro API)');
console.log('   2. Region eu-north-1 nemá SES SMTP podporu');
console.log('   3. Doména doklad.ai není verified v SES');
console.log('   4. Account je v sandbox módu');
console.log('');

console.log('💡 ŘEŠENÍ:');
console.log('   1. V AWS Console → SES → Account Dashboard');
console.log('   2. SMTP Settings → Create SMTP credentials');
console.log('   3. Použijte SMTP credentials (ne API keys)');
console.log('   4. Zkuste region eu-west-1 místo eu-north-1');
console.log('');

// Test s eu-west-1
console.log('🧪 ZKOUŠÍM REGION EU-WEST-1...');

const transporter = nodemailer.createTransport({
  host: `email-smtp.eu-west-1.amazonaws.com`,
  port: 587,
  secure: false,
  auth: {
    user: process.env.AWS_ACCESS_KEY_ID,
    pass: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ EU-WEST-1 také nefunguje:', error.message);
    console.log('');
    console.log('🎯 DOPORUČENÍ:');
    console.log('   1. Přejděte do AWS Console → Simple Email Service');
    console.log('   2. Vyberte region EU-WEST-1 (Dublin)');
    console.log('   3. Verify domain: doklad.ai');
    console.log('   4. SMTP Settings → Create SMTP credentials');
    console.log('   5. Nahraďte AWS_ACCESS_KEY_ID a AWS_SECRET_ACCESS_KEY');
    console.log('   6. Nastavte AWS_SES_REGION=eu-west-1');
  } else {
    console.log('✅ EU-WEST-1 region funguje!');
    console.log('   Změňte AWS_SES_REGION na eu-west-1');
  }
});