#!/usr/bin/env node

/**
 * FORCE CLEAR ALL INVITATIONS FROM PRODUCTION DATABASE
 * Uses the same connection as the main application
 */

const { Pool } = require('pg');

async function forceClearInvitations() {
  console.log('🗑️ FORCE CLEARING ALL INVITATIONS');
  
  // Use standard PostgreSQL connection instead of Neon serverless
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    return;
  }
  
  console.log('🔗 Connecting to database...');
  
  const client = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // Check current state
    console.log('📊 Checking current invitations...');
    const countResult = await client.query('SELECT COUNT(*) FROM user_invitations');
    console.log('Current invitations count:', countResult.rows[0].count);
    
    if (parseInt(countResult.rows[0].count) > 0) {
      // Show what we have
      const listResult = await client.query('SELECT id, email, status, company_id FROM user_invitations ORDER BY id');
      console.log('📋 Found invitations:');
      listResult.rows.forEach(row => {
        console.log(`   ID: ${row.id}, Email: ${row.email}, Status: ${row.status}, Company: ${row.company_id}`);
      });
      
      // Force delete all
      console.log('🗑️ Force deleting ALL invitations...');
      const deleteResult = await client.query('DELETE FROM user_invitations');
      console.log(`✅ Deleted ${deleteResult.rowCount} rows`);
      
      // Reset the sequence
      await client.query('ALTER SEQUENCE user_invitations_id_seq RESTART WITH 1');
      console.log('🔄 Reset ID sequence');
      
      // Final verification
      const finalResult = await client.query('SELECT COUNT(*) FROM user_invitations');
      console.log('✅ Final verification count:', finalResult.rows[0].count);
      
    } else {
      console.log('✅ No invitations found');
    }
    
    await client.end();
    console.log('🎯 DATABASE SUCCESSFULLY CLEARED');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
  }
}

forceClearInvitations();