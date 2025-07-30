// Script to create admin user on production database
import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function createProductionAdmin() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if companies table exists
    const companyCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'companies'
      );
    `);

    if (!companyCheck.rows[0].exists) {
      console.log('❌ Companies table does not exist');
      return;
    }

    // Insert company
    await client.query(`
      INSERT INTO companies (
        name, email, phone, ico, dic, address, city, postal_code, country, bank_account, is_active
      ) VALUES (
        'Doklad.ai Admin', 'admin@doklad.ai', '+420 777 123 456', '12345678', 'CZ12345678',
        'Václavské náměstí 1', 'Praha', '110 00', 'CZ', '123456789/0100', true
      ) ON CONFLICT (email) DO NOTHING;
    `);

    // Get company ID
    const companyResult = await client.query(`
      SELECT id FROM companies WHERE email = 'admin@doklad.ai';
    `);

    const companyId = companyResult.rows[0]?.id;
    if (!companyId) {
      console.log('❌ Could not find or create company');
      return;
    }

    // Insert admin user
    const result = await client.query(`
      INSERT INTO users (
        company_id, username, email, password, first_name, last_name, role, access_level, is_active, email_confirmed
      ) VALUES (
        $1, 'admin', 'admin@doklad.ai', '$2b$12$g126JZp0G4wCEKsxJvA2F.OGqog3S40nhhjVttq7bn0WzmqUJR6Jq',
        'Admin', 'Doklad.ai', 'admin', 'admin', true, true
      ) ON CONFLICT (email) DO UPDATE SET
        password = '$2b$12$g126JZp0G4wCEKsxJvA2F.OGqog3S40nhhjVttq7bn0WzmqUJR6Jq',
        first_name = 'Admin',
        last_name = 'Doklad.ai',
        role = 'admin',
        access_level = 'admin',
        is_active = true,
        email_confirmed = true
      RETURNING id;
    `, [companyId]);

    console.log('✅ Admin user created/updated with ID:', result.rows[0]?.id);
    console.log('🔑 Credentials: admin@doklad.ai / admin123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createProductionAdmin();