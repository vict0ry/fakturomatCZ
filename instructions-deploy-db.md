# Instrukce pro vymazání deploy databáze

## Možnost 1: Přes Replit Database Tool

1. **Otevřete Database tool** v Replit workspace (vlevo v sidebar)
2. **Připojte se k PostgreSQL** databázi
3. **Vložte a spusťte** tento SQL script:

```sql
-- Vymazat všechna data z deploy databáze
DELETE FROM invoice_items;
DELETE FROM expense_items;
DELETE FROM invoice_history;
DELETE FROM reminders;
DELETE FROM payment_matching_rules;
DELETE FROM bank_transactions;
DELETE FROM invoices;
DELETE FROM expenses;
DELETE FROM customers;
DELETE FROM chat_messages;

-- Zkontrolovat výsledek
SELECT 'invoices' as tabulka, COUNT(*) as pocet FROM invoices
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL  
SELECT 'expenses', COUNT(*) FROM expenses;
```

## Možnost 2: Přes psql příkazový řádek

Pokud máte deploy DATABASE_URL:

```bash
# Připojit se k deploy databázi
psql "DEPLOY_DATABASE_URL_HERE"

# Pak spustit SQL příkazy výše
```

## Možnost 3: JavaScript script

```bash
# Nastavit deploy DATABASE_URL a spustit
DEPLOY_DATABASE_URL="your_deploy_url" node connect-deploy-db.js
```

## Po vymazání dat

1. **Redeploy aplikaci** - použije nový kód bez mock dat
2. **Data budou prázdná** - zobrazí se prázdné stavy
3. **Znovu vytvořte data** podle potřeby

## Kde najít deploy DATABASE_URL?

- V **Deployments** záložce → **Environment Variables**
- Nebo v **Database** tool → **Connection details**