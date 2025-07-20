// Script pro připojení k deploy databázi a vymazání dat
import { Pool } from '@neondatabase/serverless';

// Pokud máte deploy DATABASE_URL, zadejte ji zde
const DEPLOY_DATABASE_URL = process.env.DEPLOY_DATABASE_URL || process.env.DATABASE_URL;

if (!DEPLOY_DATABASE_URL) {
  console.log('❌ Chybí DEPLOY_DATABASE_URL nebo DATABASE_URL');
  console.log('💡 Musíte zadat URL deploy databáze');
  process.exit(1);
}

const pool = new Pool({ connectionString: DEPLOY_DATABASE_URL });

async function clearDeployData() {
  console.log('🔗 Připojuji se k deploy databázi...');
  
  try {
    // Test připojení
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Připojení úspěšné:', testResult.rows[0].now);
    
    // Zobrazit aktuální stav
    console.log('\n📊 Aktuální stav databáze:');
    const statusResult = await pool.query(`
      SELECT 'invoices' as tabulka, COUNT(*) as pocet FROM invoices
      UNION ALL
      SELECT 'customers', COUNT(*) FROM customers
      UNION ALL  
      SELECT 'expenses', COUNT(*) FROM expenses
      UNION ALL
      SELECT 'invoice_items', COUNT(*) FROM invoice_items
    `);
    
    statusResult.rows.forEach(row => {
      console.log(`${row.tabulka}: ${row.pocet} záznamů`);
    });
    
    // Vymazat data
    console.log('\n🗑️ Mažu data...');
    
    await pool.query('DELETE FROM invoice_items');
    await pool.query('DELETE FROM expense_items');
    await pool.query('DELETE FROM invoice_history');
    await pool.query('DELETE FROM reminders');
    await pool.query('DELETE FROM payment_matching_rules');
    await pool.query('DELETE FROM bank_transactions');
    await pool.query('DELETE FROM invoices');
    await pool.query('DELETE FROM expenses');
    await pool.query('DELETE FROM customers');
    await pool.query('DELETE FROM chat_messages');
    
    console.log('✅ Data vymazána!');
    
    // Zkontrolovat výsledek
    const finalResult = await pool.query(`
      SELECT 'invoices' as tabulka, COUNT(*) as pocet FROM invoices
      UNION ALL
      SELECT 'customers', COUNT(*) FROM customers
      UNION ALL  
      SELECT 'expenses', COUNT(*) FROM expenses
      UNION ALL
      SELECT 'invoice_items', COUNT(*) FROM invoice_items
    `);
    
    console.log('\n📊 Stav po vymazání:');
    finalResult.rows.forEach(row => {
      console.log(`${row.tabulka}: ${row.pocet} záznamů`);
    });
    
  } catch (error) {
    console.error('❌ Chyba:', error.message);
  } finally {
    await pool.end();
  }
}

clearDeployData();