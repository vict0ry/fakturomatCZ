# 🔗 Unified Database Setup

## Problém
- Development a deployment používají různé databáze
- Uživatelé registrovaní na deployed verzi neexistují v dev databázi
- Způsobuje login problémy mezi prostředími

## Řešení: Unified DATABASE_URL

### 1. Replit Secrets Configuration
V Replit Secrets (pro deployment) nastavte stejnou DATABASE_URL jako development:

```
DATABASE_URL=postgresql://neondb_owner:npg_y9IBMqSUlgC5@ep-cool-[...]
```

### 2. Ověření unified setup
Po nastavení by měly obě prostředí používat stejnou databázi:
- Development: používá lokální env variables
- Deployment: používá Replit Secrets s unified DATABASE_URL

### 3. Test
- Registrace na deployed verzi → viditelná v dev databázi
- Login funguje na obou prostředích se stejnými credentials

## Status: ✅ IMPLEMENTOVÁNO