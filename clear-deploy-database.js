// Script pro vymazání dat v deploy databázi
// POZOR: Toto vymaže všechna data v deploy databázi!

import { Pool } from '@neondatabase/serverless';

// Použije DATABASE_URL z prostředí (deploy má vlastní)
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

async function clearDeployDatabase() {
  try {
    console.log('🚨 POZOR: Mažu všechna data v deploy databázi!');
    
    // Vymazat data v správném pořadí (kvůli foreign key constraints)
    await pool.query('DELETE FROM invoice_items');
    await pool.query('DELETE FROM expense_items');  
    await pool.query('DELETE FROM invoices');
    await pool.query('DELETE FROM expenses');
    await pool.query('DELETE FROM customers');
    await pool.query('DELETE FROM chat_messages');
    await pool.query('DELETE FROM invoice_history');
    await pool.query('DELETE FROM reminders');
    await pool.query('DELETE FROM payment_matching_rules');
    await pool.query('DELETE FROM bank_transactions');
    
    // Ponechat users a companies pro přihlášení
    console.log('✅ Deploy databáze vymazána (kromě users a companies)');
    
    // Zkontrolovat výsledek
    const result = await pool.query(`
      SELECT 
        'invoices' as table_name, COUNT(*) as count FROM invoices
      UNION ALL
      SELECT 'customers', COUNT(*) FROM customers  
      UNION ALL
      SELECT 'expenses', COUNT(*) FROM expenses
    `);
    
    console.log('📊 Stav po vymazání:');
    result.rows.forEach(row => {
      console.log(`${row.table_name}: ${row.count} záznamů`);
    });
    
  } catch (error) {
    console.error('❌ Chyba při mazání deploy databáze:', error);
  } finally {
    await pool.end();
  }
}

clearDeployDatabase();