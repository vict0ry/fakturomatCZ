// SMTP Configuration Setup for doklad.ai
const fs = require('fs');

// Read the generated DKIM private key
const dkimPrivateKey = fs.readFileSync('dkim_private.key', 'utf8');

console.log('=== SMTP Configuration for doklad.ai ===\n');

console.log('Add these environment variables to your .env file or deployment:');
console.log('');
console.log('# SMTP Configuration');
console.log('SMTP_HOST=smtp.gmail.com');
console.log('SMTP_PORT=587');
console.log('SMTP_USER=noreply@doklad.ai');
console.log('SMTP_PASS=your_gmail_app_password_here');
console.log('');
console.log('# DKIM Configuration');
console.log('DKIM_DOMAIN=doklad.ai');
console.log('DKIM_SELECTOR=default');
console.log(`DKIM_PRIVATE_KEY="${dkimPrivateKey.replace(/\n/g, '\\n')}"`);
console.log('');
console.log('=== IMPORTANT STEPS ===');
console.log('1. Create Gmail account: noreply@doklad.ai');
console.log('2. Enable 2-factor authentication');
console.log('3. Generate app-specific password');
console.log('4. Add DNS TXT record for DKIM (see dns-records.md)');
console.log('5. Set environment variables');
console.log('');
console.log('Once configured, emails will be sent automatically!');