// Jednoduchý script pro vytvoření test uživatele přes API

async function createTestUser() {
  try {
    console.log('Vytváření test uživatele přes registrační API...');
    
    const registrationData = {
      personal: {
        firstName: 'Test',
        lastName: 'Uživatel',
        email: 'test@test.cz',
        password: 'test123',
        confirmPassword: 'test123'
      },
      company: {
        companyName: 'Test Firma s.r.o.',
        ico: '12345678', 
        dic: 'CZ12345678',
        address: 'Testovací 123',
        city: 'Praha',
        postalCode: '11000',
        phone: '+420 123 456 789',
        bankAccount: '123456789/0100'
      },
      payment: {
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardName: 'Test User'
      },
      trialDays: 7
    };

    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test uživatel úspěšně vytvořen!');
      console.log('');
      console.log('=== PŘIHLAŠOVACÍ ÚDAJE ===');
      console.log('Email/Username: test@test.cz');
      console.log('Heslo: test123');
      console.log('Role: user (běžný uživatel s trial)');
      console.log('Společnost: Test Firma s.r.o.');
      console.log('Trial: 7 dní od dneška');
      console.log('');
      console.log('Nyní se můžete přihlásit na /login');
    } else {
      const error = await response.text();
      console.error('❌ Chyba při vytváření uživatele:', error);
    }
  } catch (error) {
    console.error('❌ Chyba připojení:', error.message);
  }
}

createTestUser();