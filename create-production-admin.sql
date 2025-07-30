-- Vytvořit admin účet pro production databázi
-- Heslo: admin123 (bcrypt hash)

-- Nejdříve zkontrolovat jestli admin už existuje
SELECT username, email, role FROM users WHERE email = 'admin@doklad.ai';

-- Pokud neexistuje, vytvořit ho
-- Password hash pro "admin123": $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO users (
  "companyId", 
  username, 
  email, 
  "passwordHash", 
  role, 
  "firstName", 
  "lastName", 
  "emailConfirmed"
) VALUES (
  1,
  'admin', 
  'admin@doklad.ai', 
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin',
  'Admin',
  'Doklad.ai',
  false
) ON CONFLICT (email) DO NOTHING;

-- Ověřit že byl vytvořen
SELECT id, username, email, role, "firstName", "lastName" FROM users WHERE email = 'admin@doklad.ai';