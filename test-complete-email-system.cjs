// Complete Email System Test
const http = require('http');
const fs = require('fs');

class EmailSystemTester {
  constructor() {
    this.testResults = [];
    this.baseUrl = 'http://localhost:5000';
  }

  async runAllTests() {
    console.log('🧪 KOMPLETNÍ TEST EMAIL SYSTÉMU');
    console.log('===============================\n');

    await this.testPasswordReset();
    await this.testEmailConfiguration();
    await this.testSMTPServerStatus();
    await this.checkSentEmails();
    
    this.printResults();
  }

  async testPasswordReset() {
    console.log('1. 📧 Test Password Reset...');
    
    try {
      const response = await this.makeRequest('/api/auth/forgot-password', {
        method: 'POST',
        data: { email: 'test@doklad.ai' }
      });

      if (response.resetLink) {
        this.addResult('Password Reset', '❌ FAIL', 'Still in development mode - showing token');
        console.log('   ❌ Development mode detected');
        console.log('   Token:', response.resetLink);
      } else if (response.message.includes('Pokud email existuje')) {
        this.addResult('Password Reset', '✅ PASS', 'Production mode - real email sent');
        console.log('   ✅ Production mode active');
        console.log('   Message:', response.message);
      } else {
        this.addResult('Password Reset', '⚠️  UNKNOWN', response.message);
        console.log('   ⚠️  Unexpected response:', response.message);
      }
    } catch (error) {
      this.addResult('Password Reset', '❌ ERROR', error.message);
      console.log('   ❌ Error:', error.message);
    }

    await this.sleep(1000);
  }

  async testEmailConfiguration() {
    console.log('\n2. ⚙️  Test SMTP Configuration...');
    
    const config = {
      SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
      SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
      SMTP_USER: process.env.SMTP_USER || 'NOT SET',
      SMTP_PASS: process.env.SMTP_PASS ? '***SET***' : 'NOT SET'
    };

    console.log('   Host:', config.SMTP_HOST);
    console.log('   Port:', config.SMTP_PORT);
    console.log('   User:', config.SMTP_USER);
    console.log('   Pass:', config.SMTP_PASS);

    const isLocalhost = config.SMTP_HOST === 'localhost';
    const hasPort = config.SMTP_PORT === '2525';
    const isConfigured = isLocalhost && hasPort;

    if (isConfigured) {
      this.addResult('SMTP Config', '✅ PASS', 'Local SMTP server configured');
      console.log('   ✅ Local SMTP server correctly configured');
    } else {
      this.addResult('SMTP Config', '❌ FAIL', 'Configuration incomplete');
      console.log('   ❌ Configuration incomplete');
    }
  }

  async testSMTPServerStatus() {
    console.log('\n3. 🚀 Test SMTP Server Status...');
    
    try {
      // Check if SMTP server is responding by testing the port
      const net = require('net');
      const socket = new net.Socket();
      
      const testConnection = new Promise((resolve, reject) => {
        socket.setTimeout(5000);
        
        socket.on('connect', () => {
          console.log('   ✅ SMTP server is listening on port 2525');
          this.addResult('SMTP Server', '✅ PASS', 'Server running on port 2525');
          socket.destroy();
          resolve(true);
        });
        
        socket.on('error', (error) => {
          console.log('   ❌ SMTP server connection failed:', error.message);
          this.addResult('SMTP Server', '❌ FAIL', `Connection error: ${error.message}`);
          reject(error);
        });
        
        socket.on('timeout', () => {
          console.log('   ⚠️  SMTP server connection timeout');
          this.addResult('SMTP Server', '⚠️  TIMEOUT', 'Port 2525 not responding');
          socket.destroy();
          reject(new Error('Timeout'));
        });
      });

      socket.connect(2525, 'localhost');
      await testConnection;
      
    } catch (error) {
      console.log('   ❌ SMTP server test failed:', error.message);
    }
  }

  async checkSentEmails() {
    console.log('\n4. 📁 Check Sent Emails...');
    
    try {
      if (fs.existsSync('sent-emails')) {
        const files = fs.readdirSync('sent-emails');
        console.log(`   📄 Found ${files.length} email files`);
        
        if (files.length > 0) {
          this.addResult('Email Storage', '✅ PASS', `${files.length} emails saved`);
          
          // Show latest email
          const latestFile = files[files.length - 1];
          console.log(`   📧 Latest: ${latestFile}`);
          
          const emailContent = fs.readFileSync(`sent-emails/${latestFile}`, 'utf8');
          const lines = emailContent.split('\n').slice(0, 10);
          console.log('   📝 Preview:');
          lines.forEach(line => {
            if (line.trim()) console.log(`      ${line.trim()}`);
          });
        } else {
          this.addResult('Email Storage', '⚠️  EMPTY', 'No emails saved yet');
          console.log('   ⚠️  No emails found in sent-emails folder');
        }
      } else {
        this.addResult('Email Storage', '❌ MISSING', 'sent-emails folder not found');
        console.log('   ❌ sent-emails folder does not exist');
      }
    } catch (error) {
      this.addResult('Email Storage', '❌ ERROR', error.message);
      console.log('   ❌ Error checking emails:', error.message);
    }
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const data = options.data ? JSON.stringify(options.data) : '';
      
      const reqOptions = {
        hostname: 'localhost',
        port: 5000,
        path: path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(data && { 'Content-Length': Buffer.byteLength(data) })
        }
      };

      const req = http.request(reqOptions, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (error) {
            resolve({ raw: responseData });
          }
        });
      });

      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
  }

  addResult(test, status, details) {
    this.testResults.push({ test, status, details });
  }

  printResults() {
    console.log('\n📊 VÝSLEDKY TESTŮ');
    console.log('==================');
    
    this.testResults.forEach(result => {
      console.log(`${result.status} ${result.test}: ${result.details}`);
    });

    const passed = this.testResults.filter(r => r.status === '✅ PASS').length;
    const total = this.testResults.length;
    
    console.log(`\n🎯 Celkový výsledek: ${passed}/${total} testů prošlo`);
    
    if (passed === total) {
      console.log('🎉 EMAIL SYSTÉM JE PLNĚ FUNKČNÍ!');
    } else {
      console.log('⚠️  Některé testy selhaly - zkontrolujte konfiguraci');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Spustit testy
const tester = new EmailSystemTester();
tester.runAllTests().catch(console.error);