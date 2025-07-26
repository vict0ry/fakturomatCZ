// Manual password reset for user when emails don't reach external addresses
const http = require('http');

const resetData = {
  email: 'mail@victoreliot.com',
  newPassword: 'newpassword123'
};

console.log('🔧 RUČNÍ RESET HESLA PRO mail@victoreliot.com');
console.log('=============================================');
console.log('');
console.log('📧 Problém: Lokální SMTP server neposílá emaily na externí adresy');
console.log('🔧 Řešení: Ruční reset hesla v databázi');
console.log('');

// Method 1: Extract token from email and use reset endpoint
console.log('📄 METODA 1: Použít token z lokálního emailu');

const fs = require('fs');
const emailContent = fs.readFileSync('sent-emails/email-2025-07-26T19-51-47-219Z.txt', 'utf8');
const tokenMatch = emailContent.match(/token=([A-Za-z0-9]+)/);

if (tokenMatch) {
  const token = tokenMatch[1];
  console.log(`🔑 Nalezen token: ${token}`);
  console.log(`🔗 Reset link: http://localhost:5000/reset-password?token=${token}`);
  console.log('');
  console.log('👨‍💻 CO DĚLAT:');
  console.log('1. Otevřít tento link v prohlížeči');
  console.log('2. Zadat nové heslo');
  console.log('3. Uložit změny');
} else {
  console.log('❌ Token nenalezen v emailu');
}

console.log('');
console.log('📄 METODA 2: Přímá změna hesla v databázi');
console.log('🔧 SQL příkaz pro změnu hesla:');
console.log(`UPDATE users SET password = crypt('${resetData.newPassword}', gen_salt('bf')) WHERE email = '${resetData.email}';`);

console.log('');
console.log('📄 METODA 3: Konfigurace externího SMTP');
console.log('🔧 Pro skutečné emaily nastavit:');
console.log('- Gmail SMTP (smtp.gmail.com:587)');
console.log('- SendGrid API');
console.log('- Nebo jiného poskytovatele');