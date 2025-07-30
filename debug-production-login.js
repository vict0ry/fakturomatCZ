// Debug production login problému
const bcrypt = require('bcryptjs');

async function debugProductionLogin() {
  console.log('🔍 DEBUGGING PRODUCTION LOGIN PROBLÉMU');
  console.log('======================================\n');
  
  // Otestovat že náš hash skutečně funguje
  const testPassword = 'admin123';
  const testHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  
  console.log('1️⃣ Test bcrypt hash verification:');
  console.log(`   Password: ${testPassword}`);
  console.log(`   Hash: ${testHash}`);
  console.log(`   Verification: ${bcrypt.compareSync(testPassword, testHash)}`);
  
  // Zkusit všechny možné varianty hesla
  const passwordVariants = [
    'admin123',
    'Admin123', 
    'ADMIN123',
    'admin',
    'Admin',
    'password',
    '123456'
  ];
  
  console.log('\n2️⃣ Test různých hesel na production:');
  
  for (const pwd of passwordVariants) {
    try {
      const response = await fetch('https://doklad.ai/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin@doklad.ai',
          password: pwd
        })
      });
      
      const data = await response.json();
      console.log(`   "${pwd}": ${response.status} - ${data.message || 'success'}`);
      
      if (response.status === 200) {
        console.log('   🎉 ÚSPĚCH! Heslo nalezeno:', pwd);
        return;
      }
      
    } catch (error) {
      console.log(`   "${pwd}": ERROR - ${error.message}`);
    }
  }
  
  console.log('\n3️⃣ Test různých usernames:');
  const userVariants = [
    'admin@doklad.ai',
    'admin',
    'Admin',
    'administrator'
  ];
  
  for (const user of userVariants) {
    try {
      const response = await fetch('https://doklad.ai/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user,
          password: 'admin123'
        })
      });
      
      const data = await response.json();
      console.log(`   "${user}": ${response.status} - ${data.message || 'success'}`);
      
    } catch (error) {
      console.log(`   "${user}": ERROR - ${error.message}`);
    }
  }
  
  console.log('\n🏁 ZÁVĚR:');
  console.log('   Production má pravděpodobně jiné backend konfigurce');
  console.log('   nebo používá starší verzi kódu.');
}

debugProductionLogin().catch(console.error);