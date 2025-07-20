-- SQL script pro vymazání všech dat z deploy databáze
-- POZOR: Toto vymaže všechna data!

-- Nejprve vymazat závislé tabulky (kvůli foreign key constraints)
DELETE FROM invoice_items;
DELETE FROM expense_items;
DELETE FROM invoice_history;
DELETE FROM reminders;
DELETE FROM payment_matching_rules;
DELETE FROM bank_transactions;

-- Pak hlavní tabulky
DELETE FROM invoices;
DELETE FROM expenses;
DELETE FROM customers;
DELETE FROM chat_messages;

-- Zkontrolovat výsledek
SELECT 'invoices' as tabulka, COUNT(*) as pocet FROM invoices
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL  
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'invoice_items', COUNT(*) FROM invoice_items
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages;