import { db } from './server/db.js';
import { users, companies } from './shared/schema.js';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  try {
    console.log('Vytváření test uživatele...');
    
    // Vytvoření test společnosti
    const [testCompany] = await db.insert(companies).values({
      name: 'Test Firma s.r.o.',
      ico: '12345678',
      dic: 'CZ12345678',
      address: 'Testovací 123',
      city: 'Praha',
      postalCode: '11000',
      email: 'test@firma.cz',
      phone: '+420 123 456 789'
    }).returning();
    
    console.log('Test společnost vytvořena:', testCompany);
    
    // Vytvoření test uživatele s trial obdobím
    const hashedPassword = await bcrypt.hash('test123', 10);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7-day trial
    
    const [testUser] = await db.insert(users).values({
      username: 'test@test.cz',
      email: 'test@test.cz',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Uživatel',
      companyId: testCompany.id,
      role: 'user', // Běžný uživatel, ne admin
      subscriptionStatus: 'trial',
      trialEndsAt: trialEndsAt,
      subscriptionStartedAt: new Date()
    }).returning();
    
    console.log('Test uživatel vytvořen:');
    console.log('Username/Email: test@test.cz');
    console.log('Password: test123');
    console.log('Role: user (běžný uživatel)');
    console.log('Trial ends:', trialEndsAt.toISOString());
    console.log('Company:', testCompany.name);
    
  } catch (error) {
    console.error('Chyba při vytváření test uživatele:', error);
  }
}

createTestUser();