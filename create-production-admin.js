// Vytvoří admin účet pro production databázi
import bcryptjs from 'bcryptjs';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, companies } from './shared/schema.js';

async function createProductionAdmin() {
  console.log('🏭 VYTVÁŘENÍ ADMIN ÚČTU PRO PRODUCTION');
  console.log('=====================================\n');

  try {
    // Připojení k databázi
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL není nastaven');
    }

    console.log('🔌 Připojuji se k databázi...');
    const sql = neon(databaseUrl);
    const db = drizzle(sql);

    // Zkontrolovat jestli admin už existuje
    console.log('🔍 Kontroluji existenci admin účtu...');
    const existingAdmin = await db
      .select()
      .from(users)
      .where(users.email.eq('admin@doklad.ai'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('✅ Admin účet už existuje:');
      console.log(`   ID: ${existingAdmin[0].id}`);
      console.log(`   Email: ${existingAdmin[0].email}`);
      console.log(`   Role: ${existingAdmin[0].role}`);
      return;
    }

    // Najít nebo vytvořit company
    console.log('🏢 Kontroluji company...');
    let company = await db
      .select()
      .from(companies)
      .limit(1);

    let companyId;
    if (company.length === 0) {
      console.log('🏢 Vytvářím admin company...');
      const newCompany = await db
        .insert(companies)
        .values({
          name: 'Doklad.ai Admin',
          ico: '00000000',
          dic: 'CZ00000000',
          address: 'Praha',
          email: 'admin@doklad.ai',
          phone: '+420000000000'
        })
        .returning();
      companyId = newCompany[0].id;
      console.log(`✅ Company vytvořena s ID: ${companyId}`);
    } else {
      companyId = company[0].id;
      console.log(`✅ Používám existující company ID: ${companyId}`);
    }

    // Hashovat heslo
    console.log('🔒 Hashuji heslo...');
    const passwordHash = await bcryptjs.hash('admin123', 10);

    // Vytvořit admin účet
    console.log('👤 Vytvářím admin účet...');
    const newAdmin = await db
      .insert(users)
      .values({
        companyId: companyId,
        username: 'admin',
        email: 'admin@doklad.ai',
        passwordHash: passwordHash,
        role: 'admin',
        firstName: 'Admin',
        lastName: 'Doklad.ai',
        emailConfirmed: false
      })
      .returning();

    console.log('🎉 ADMIN ÚČET ÚSPĚŠNĚ VYTVOŘEN!');
    console.log(`   ID: ${newAdmin[0].id}`);
    console.log(`   Email: ${newAdmin[0].email}`);
    console.log(`   Username: ${newAdmin[0].username}`);
    console.log(`   Role: ${newAdmin[0].role}`);
    console.log(`   Company ID: ${newAdmin[0].companyId}`);
    console.log('\n🔑 PŘIHLAŠOVACÍ ÚDAJE:');
    console.log('   Email: admin@doklad.ai');
    console.log('   Heslo: admin123');

  } catch (error) {
    console.log(`💥 Chyba při vytváření admin účtu: ${error.message}`);
    console.log(error.stack);
  }
}

createProductionAdmin();