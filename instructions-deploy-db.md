# UNIFIED DATABASE SETUP INSTRUCTIONS

## Problem
Production a development používají různé databáze, proto admin login nefunguje na production.

## Solution: Unified Database

### Step 1: Get Current DATABASE_URL
Development používá: `postgresql://neondb_owner:****@ep-cool-boat-af1s1pq6.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require`

### Step 2: Update Production Environment
V Replit Deployment nastavit environment variable:

```
DATABASE_URL=postgresql://neondb_owner:npz_...@ep-cool-boat-af1s1pq6.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
```

### Step 3: Deploy
Po nastavení DATABASE_URL udělat nový deployment.

### Step 4: Verify
Test production login:
```bash
curl -X POST https://doklad.ai/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin@doklad.ai", "password": "admin123"}'
```

Měl by vrátit status 200 s sessionId.

## Expected Result
✅ Development: admin@doklad.ai / admin123 - works
✅ Production: admin@doklad.ai / admin123 - works (same database)

## Benefits
- Single source of truth for data
- Consistent behavior across environments  
- No need to sync multiple databases
- Simplified deployment process