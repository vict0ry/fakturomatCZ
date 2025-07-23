// Skript pro vytvoření admin účtu
// Spustit: node create-admin.js

import { db } from './server/db.ts';
import { users, companies } from './shared/schema.ts';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  try {
    console.log('🔧 Vytvářím admin účet...');
    
    // Vytvoř admin společnost
    const [company] = await db.insert(companies).values({
      name: "Doklad.ai Admin",
      ico: "00000000",
      dic: "CZ00000000", 
      address: "Praha, Česká republika",
      phone: "+420 000 000 000",
      email: "admin@doklad.ai",
      bankAccount: "0000000000/0000"
    }).returning();

    console.log(`✅ Admin společnost vytvořena: ${company.name}`);

    // Hash hesla
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Vytvoř admin uživatele - pouze základní pole
    const [admin] = await db.insert(users).values({
      username: 'admin',
      email: 'admin@doklad.ai',
      password: hashedPassword,
      role: 'admin',
      companyId: company.id,
      firstName: 'Admin',
      lastName: 'Doklad.ai'
    }).returning();

    console.log(`✅ Admin uživatel vytvořen:`);
    console.log(`   Email: admin@doklad.ai`);
    console.log(`   Heslo: admin123`);
    console.log(`   Role: admin`);
    console.log(`   Společnost: ${company.name} (ID: ${company.id})`);
    
    console.log('\n🚀 Admin účet je připraven!');
    console.log('   Přihlašte se na /dashboard pomocí:');
    console.log('   Email: admin@doklad.ai');
    console.log('   Heslo: admin123');
    
  } catch (error) {
    console.error('❌ Chyba při vytváření admin účtu:', error);
  }
  
  process.exit(0);
}

createAdmin();