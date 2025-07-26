// Extract reset token for user from sent emails
const fs = require('fs');

function extractResetToken(email) {
  console.log(`🔍 Hledám reset token pro: ${email}`);
  
  const emailFiles = fs.readdirSync('sent-emails')
    .filter(file => file.startsWith('email-'))
    .sort()
    .reverse(); // Nejnovější první

  for (const file of emailFiles) {
    const content = fs.readFileSync(`sent-emails/${file}`, 'utf8');
    
    if (content.includes(email)) {
      console.log(`📧 Nalezen email v: ${file}`);
      
      // Extract reset token
      const tokenMatch = content.match(/reset-password\?token=([^&\s<]+)/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        console.log(`🔑 Reset token: ${token}`);
        console.log(`🔗 Reset link: http://localhost:5000/reset-password?token=${token}`);
        return token;
      }
    }
  }
  
  console.log('❌ Reset token nenalezen');
  return null;
}

// Extract token for the specific email
const email = 'mail@victoreliot.com';
extractResetToken(email);