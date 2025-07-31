#!/usr/bin/env node

/**
 * COMPREHENSIVE DATABASE VERIFICATION
 * Checks all possible database connections for invitations
 */

const { Pool } = require('pg');

async function verifyDatabaseClear() {
  console.log('🔍 COMPREHENSIVE DATABASE VERIFICATION\n');
  
  // Check main DATABASE_URL
  console.log('1️⃣ Checking DATABASE_URL connection...');
  if (process.env.DATABASE_URL) {
    try {
      const client = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      
      const result = await client.query('SELECT COUNT(*) FROM user_invitations');
      console.log(`   ✅ DATABASE_URL: ${result.rows[0].count} invitations`);
      
      if (parseInt(result.rows[0].count) > 0) {
        const list = await client.query('SELECT id, email, status FROM user_invitations');
        list.rows.forEach(row => {
          console.log(`      ID: ${row.id}, Email: ${row.email}, Status: ${row.status}`);
        });
        
        console.log('   🗑️ Clearing DATABASE_URL invitations...');
        const deleteResult = await client.query('DELETE FROM user_invitations');
        console.log(`   ✅ Deleted ${deleteResult.rowCount} rows from DATABASE_URL`);
      }
      
      await client.end();
    } catch (error) {
      console.log(`   ❌ DATABASE_URL error: ${error.message}`);
    }
  }
  
  // Check alternative connection using PG environment variables
  console.log('\n2️⃣ Checking PG environment variables...');
  if (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE) {
    try {
      const client = new Pool({
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: process.env.PGPORT || 5432,
        ssl: { rejectUnauthorized: false }
      });
      
      const result = await client.query('SELECT COUNT(*) FROM user_invitations');
      console.log(`   ✅ PG ENV: ${result.rows[0].count} invitations`);
      
      if (parseInt(result.rows[0].count) > 0) {
        const list = await client.query('SELECT id, email, status FROM user_invitations');
        list.rows.forEach(row => {
          console.log(`      ID: ${row.id}, Email: ${row.email}, Status: ${row.status}`);
        });
        
        console.log('   🗑️ Clearing PG ENV invitations...');
        const deleteResult = await client.query('DELETE FROM user_invitations');
        console.log(`   ✅ Deleted ${deleteResult.rowCount} rows from PG ENV`);
      }
      
      await client.end();
    } catch (error) {
      console.log(`   ❌ PG ENV error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 VERIFICATION COMPLETE');
  console.log('💡 If you still see invitations in the database panel:');
  console.log('   - Try refreshing the browser page');
  console.log('   - Check if the panel is showing a different database');
  console.log('   - The panel might be cached');
}

verifyDatabaseClear();