// Application Constants and Configuration

export const APP_CONFIG = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL,
  
  // API Keys
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  
  // Business Logic
  DEFAULT_VAT_RATE: 21,
  DEFAULT_INVOICE_DUE_DAYS: 14,
  DEFAULT_CURRENCY: 'CZK',
  
  // File Paths
  UPLOAD_DIR: './uploads',
  TEMP_DIR: './temp',
  
  // Limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_INVOICE_ITEMS: 50,
  MAX_CUSTOMERS_PER_COMPANY: 1000,
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Neautorizovaný přístup',
  NOT_FOUND: 'Zdroj nebyl nalezen',
  VALIDATION_ERROR: 'Chyba validace dat',
  SERVER_ERROR: 'Vnitřní chyba serveru',
  AI_ERROR: 'Chyba AI asistenta',
  PDF_ERROR: 'Chyba při generování PDF',
  EMAIL_ERROR: 'Chyba při odesílání emailu',
  DATABASE_ERROR: 'Chyba databáze',
} as const;

export const SUCCESS_MESSAGES = {
  INVOICE_CREATED: 'Faktura byla úspěšně vytvořena',
  INVOICE_UPDATED: 'Faktura byla aktualizována',
  CUSTOMER_CREATED: 'Zákazník byl vytvořen',
  EMAIL_SENT: 'Email byl odeslán',
  PDF_GENERATED: 'PDF bylo vygenerováno',
} as const;