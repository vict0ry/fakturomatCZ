-- Create admin user for production database
-- This user will work on both development and production

-- First ensure company exists
INSERT INTO companies (
  name, 
  email, 
  phone, 
  ico, 
  dic, 
  address, 
  city, 
  postal_code, 
  country, 
  bank_account,
  is_active
) VALUES (
  'Doklad.ai Admin', 
  'admin@doklad.ai', 
  '+420 777 123 456', 
  '12345678', 
  'CZ12345678', 
  'Václavské náměstí 1', 
  'Praha', 
  '110 00', 
  'CZ', 
  '123456789/0100',
  true
) ON CONFLICT (email) DO NOTHING;

-- Create admin user with bcrypt hash
INSERT INTO users (
  company_id,
  username,
  email,
  password,
  first_name,
  last_name,
  role,
  access_level,
  is_active,
  email_confirmed
) VALUES (
  (SELECT id FROM companies WHERE email = 'admin@doklad.ai'),
  'admin',
  'admin@doklad.ai',
  '$2b$12$g126JZp0G4wCEKsxJvA2F.OGqog3S40nhhjVttq7bn0WzmqUJR6Jq',
  'Admin',
  'Doklad.ai',
  'admin',
  'admin',
  true,
  true
) ON CONFLICT (email) DO UPDATE SET
  password = '$2b$12$g126JZp0G4wCEKsxJvA2F.OGqog3S40nhhjVttq7bn0WzmqUJR6Jq',
  first_name = 'Admin',
  last_name = 'Doklad.ai',
  role = 'admin',
  access_level = 'admin',
  is_active = true,
  email_confirmed = true;