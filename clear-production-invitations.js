#!/usr/bin/env node

/**
 * CLEAR PRODUCTION INVITATIONS
 * This will connect to the production database and clear all invitations
 */

import { Pool } from '@neondatabase/serverless';

const PRODUCTION_DATABASE_URL = process.env.DATABASE_URL;

async function clearProductionInvitations() {
  console.log('🗑️  CLEARING PRODUCTION INVITATIONS');
  
  if (!PRODUCTION_DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    return;
  }
  
  console.log('🔗 Connecting to:', PRODUCTION_DATABASE_URL.substring(0, 50) + '...');
  
  const pool = new Pool({ connectionString: PRODUCTION_DATABASE_URL });
  
  try {
    // First, check what's in there
    const countResult = await pool.query('SELECT COUNT(*) FROM user_invitations');
    console.log('📊 Current invitations count:', countResult.rows[0].count);
    
    if (parseInt(countResult.rows[0].count) > 0) {
      // Show the invitations
      const showResult = await pool.query('SELECT id, email, status FROM user_invitations');
      console.log('📋 Current invitations:');
      showResult.rows.forEach(row => {
        console.log(`   ID: ${row.id}, Email: ${row.email}, Status: ${row.status}`);
      });
      
      // Clear them
      console.log('🗑️  Deleting all invitations...');
      const deleteResult = await pool.query('DELETE FROM user_invitations');
      console.log(`✅ Deleted ${deleteResult.rowCount} invitations`);
      
      // Verify
      const verifyResult = await pool.query('SELECT COUNT(*) FROM user_invitations');
      console.log('✅ Final count:', verifyResult.rows[0].count);
    } else {
      console.log('✅ No invitations found - database already clean');
    }
    
    await pool.end();
    console.log('🎯 PRODUCTION DATABASE CLEARED');
    
  } catch (error) {
    console.error('❌ Error clearing invitations:', error.message);
    await pool.end();
  }
}

clearProductionInvitations();