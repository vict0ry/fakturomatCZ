// Test debug pro frontend přihlášení
// Simuluje přesně stejný request jako frontend

const BASE_URL = 'http://localhost:5000';

async function testFrontendLogin() {
  console.log('🎯 SIMULACE FRONTEND PŘIHLÁŠENÍ');
  console.log('===============================\n');

  // Simuluje přesně to co posílá React formulář
  const frontendData = {
    username: "admin@doklad.ai",  // stejné pole jako frontend
    password: "admin123"
  };

  console.log('📤 Posílám data:', frontendData);

  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(frontendData),
    });

    console.log('📡 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const error = await response.json();
      console.log('❌ Error response:', error);
      throw new Error(error.message || 'Přihlášení selhalo');
    }

    const result = await response.json();
    console.log('✅ Success response:', result);

    // Test navigation logic
    if (result.user.role === 'admin') {
      console.log('🏛️ Admin detected - should navigate to /admin');
    } else {
      console.log('👤 Regular user - should navigate to /dashboard');
    }

  } catch (error) {
    console.log('💥 Request failed:', error.message);
  }
}

testFrontendLogin().catch(console.error);