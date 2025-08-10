# Localhost Development Setup Guide

## Quick Start Commands

After downloading all files to your local machine, use these commands:

```bash
# Install dependencies
npm install

# Run in development mode on localhost
npm run dev

# Or explicitly set localhost environment
NODE_ENV=development HOST=localhost PORT=3000 npm run dev

# Build for production
npm run build

# Run production build locally
npm run start
```

## Environment Configuration

### 1. Create `.env.local` file in your project root:

```env
# Database Configuration
DATABASE_URL=your_postgresql_connection_string
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=doklad_ai

# Email Configuration (Amazon SES)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_SES_REGION=eu-north-1
SES_FROM_EMAIL=noreply@yourdomain.com

# Alternative SMTP Configuration
SMTP_HOST=localhost
SMTP_PORT=2525
SMTP_USER=test
SMTP_PASS=test

# Session Security
SESSION_SECRET=your_very_long_random_session_secret_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key

# Development Settings
NODE_ENV=development
HOST=localhost
PORT=3000
```

### 2. Database Setup

```bash
# Push database schema
npm run db:push

# Open database studio (optional)
npm run db:studio
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run check` | Type checking |
| `npm run db:push` | Apply database schema |
| `npm run db:studio` | Open Drizzle Studio |

## Custom Development Scripts

Create these additional scripts in your local package.json:

```json
{
  "scripts": {
    "dev:localhost": "NODE_ENV=development HOST=localhost PORT=3000 tsx server/index.ts",
    "dev:watch": "NODE_ENV=development tsx watch server/index.ts",
    "localhost": "npm run dev:localhost",
    "start:localhost": "NODE_ENV=production HOST=localhost PORT=3000 node dist/index.js",
    "test": "node test-simple-user-deletion.js",
    "test:all": "node run-user-deletion-tests.js",
    "test:backend": "node test-user-deletion.js",
    "test:frontend": "node test-frontend-user-deletion.js",
    "install:clean": "rm -rf node_modules package-lock.json && npm install",
    "setup": "npm install && npm run db:push"
  }
}
```

## Local Development Features

✅ **Complete User Management System**
- Admin panel with user deletion functionality
- User invitation system
- Account deactivation

✅ **Invoice Management**
- Create, edit, delete invoices
- ARES API integration for Czech companies
- PDF generation and email delivery

✅ **Email System**
- Amazon SES integration
- Local SMTP server for testing
- Professional HTML templates

✅ **AI Integration**
- OpenAI-powered chat system
- Intelligent text processing
- Business insights and analysis

✅ **Testing Suite**
- Backend API tests
- Frontend UI tests with Puppeteer
- User deletion functionality tests

## Localhost URLs

- **Application**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/settings (requires admin login)
- **Database Studio**: Usually runs on http://localhost:4983

## Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Ensure PostgreSQL is running locally
   - Check DATABASE_URL in .env.local

2. **Email Not Working**
   - For development: Use local SMTP settings
   - For production: Configure Amazon SES properly

3. **Port Already in Use**
   - Change PORT in .env.local or kill existing process
   - Use: `lsof -ti:3000 | xargs kill -9`

4. **Dependencies Issues**
   - Run: `npm run install:clean`
   - Ensure Node.js version 18+ is installed

## Production Deployment

When ready for production:

1. Set `NODE_ENV=production`
2. Configure proper database connection
3. Set up domain for email verification
4. Configure SSL certificates
5. Use `npm run build && npm run start`

Your doklad.ai application is fully configured for localhost development with all features intact!