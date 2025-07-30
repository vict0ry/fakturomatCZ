// Automatický test přihlášení admin - simuluje přesně frontend
const puppeteer = require('puppeteer');

async function testAdminLoginUI() {
  console.log('🚀 SPOUŠTÍM AUTOMATICKÝ UI TEST ADMIN PŘIHLÁŠENÍ');
  console.log('==================================================\n');

  let browser;
  try {
    // Spustit prohlížeč
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Zachytit console logy z prohlížeče
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🔐') || text.includes('📡') || text.includes('✅') || text.includes('❌')) {
        console.log(`🌐 Browser: ${text}`);
      }
    });
    
    // Zachytit chyby
    page.on('pageerror', error => {
      console.log(`💥 Browser Error: ${error.message}`);
    });
    
    console.log('📱 Otevírám login stránku...');
    await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle0' });
    
    // Zkontrolovat jestli je login formulář přítomen
    const usernameInput = await page.$('input[name="username"]');
    const passwordInput = await page.$('input[name="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (!usernameInput || !passwordInput || !submitButton) {
      console.log('❌ Login formulář nenalezen!');
      return;
    }
    
    console.log('✅ Login formulář nalezen');
    
    // Vyplnit admin údaje
    console.log('✏️ Vyplňuji admin údaje...');
    await page.type('input[name="username"]', 'admin@doklad.ai');
    await page.type('input[name="password"]', 'admin123');
    
    console.log('🔒 Klikám na přihlásit...');
    
    // Počkat na response po kliknutí
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    await submitButton.click();
    
    // Čekat na response
    const response = await responsePromise;
    const responseData = await response.json();
    
    console.log(`📡 API Response status: ${response.status()}`);
    console.log(`📋 Response data:`, responseData);
    
    if (response.status() === 200) {
      console.log('✅ API přihlášení úspěšné!');
      
      // Čekat na redirect nebo změnu URL
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      console.log(`🌍 Aktuální URL: ${currentUrl}`);
      
      if (currentUrl.includes('/admin')) {
        console.log('🏛️ ✅ ÚSPĚCH! Admin je přesměrován na /admin');
      } else if (currentUrl.includes('/dashboard')) {
        console.log('👤 Admin je na /dashboard (možná chyba v logice)');
      } else {
        console.log('❓ Admin není přesměrován nikam');
      }
      
      // Zkontrolovat localStorage
      const sessionData = await page.evaluate(() => ({
        sessionId: localStorage.getItem('sessionId'),
        user: localStorage.getItem('user')
      }));
      
      console.log(`💾 Session uložena: ${sessionData.sessionId ? 'ANO' : 'NE'}`);
      console.log(`💾 User data: ${sessionData.user ? 'ANO' : 'NE'}`);
      
    } else {
      console.log(`❌ API přihlášení selhalo: ${responseData.message}`);
    }
    
  } catch (error) {
    console.log(`💥 Test selhal: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  console.log('\n🏁 KONEC AUTOMATICKÉHO TESTU');
}

testAdminLoginUI().catch(console.error);