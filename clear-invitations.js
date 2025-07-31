#!/usr/bin/env node

/**
 * Rychlé smazání všech invitations z databáze
 */

import { db } from './server/db.js';
import { userInvitations } from './shared/schema.js';

async function clearInvitations() {
  try {
    console.log('🗑️ Mažu všechny invitations...');
    
    const result = await db.delete(userInvitations);
    console.log('✅ Všechny invitations smazány');
    
    // Verificace
    const count = await db.$count(userInvitations);
    console.log(`📊 Počet invitations v databázi: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Chyba při mazání:', error);
    process.exit(1);
  }
}

clearInvitations();