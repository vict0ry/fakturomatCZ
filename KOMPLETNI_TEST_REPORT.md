# 📋 KOMPLETNÍ TESTOVACÍ ZADÁNÍ - Password Reset & Email Systém

## 🎯 Přehled pro testera

Doklad.ai má plně funkční password reset email systém postavený na Amazon SES infrastruktuře. Tento dokument obsahuje všechny test případy a skripty pro kompletní testování.

---

## 🚀 Rychlý Start pro Testera

### Přístupové údaje pro testování:
- **Testovací uživatel**: `mail@victoreliot.com`
- **Původní heslo**: `F@llout1` (pro porovnání)
- **Email provider**: Amazon SES (skutečné emaily)
- **Development mode**: Tokeny se zobrazují v API response

---

## 📊 Test Kategorie

### 1. ZÁKLADNÍ EMAIL FUNKCIONALITA
**Priorita**: KRITICKÁ
**Očekávaný výsledek**: Všechny emaily se odesílají přes Amazon SES

#### Test Case 1.1: Password Reset Email
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "mail@victoreliot.com"}'
```
**Očekávaný výsledek**:
- HTTP Status: 200
- Response obsahuje `developmentToken` (development mód)
- V logu: "✅ Password reset email sent to mail@victoreliot.com"
- Skutečný email dorazí na `mail@victoreliot.com`

#### Test Case 1.2: Neexistující Email
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "neexistuje@example.com"}'
```
**Očekávaný výsledek**:
- HTTP Status: 200
- Stejná zpráva (security - neodhalujeme existenci emailů)
- Žádný skutečný email se neodešle

---

### 2. PASSWORD RESET FUNKCIONALITA
**Priorita**: KRITICKÁ
**Očekávaný výsledek**: Hesla se skutečně mění v databázi

#### Test Case 2.1: Platný Token Reset
```bash
# Nejprve získej token z password reset
TOKEN="[TOKEN_Z_RESPONSE]"
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\", \"newPassword\": \"NoveTestHeslo123!\"}"
```
**Očekávaný výsledek**:
- HTTP Status: 200
- Response: "Heslo bylo úspěšně změněno"
- Heslo se skutečně změnilo v databázi

#### Test Case 2.2: Neplatný Token
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "neplatny-token", "newPassword": "NoveHeslo123!"}'
```
**Očekávaný výsledek**:
- HTTP Status: 404
- Response: "Neplatný nebo expirovaný token"

#### Test Case 2.3: Slabé Heslo
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\", \"newPassword\": \"123\"}"
```
**Očekávaný výsledek**:
- HTTP Status: 400
- Response: "Heslo musí mít alespoň 6 znaků"

---

### 3. LOGIN FUNKCIONALITA
**Priorita**: KRITICKÁ
**Očekávaný výsledek**: Login funguje s novým heslem po resetu

#### Test Case 3.1: Login s Novým Heslem
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "mail@victoreliot.com", "password": "NoveTestHeslo123!"}'
```
**Očekávaný výsledek**:
- HTTP Status: 200
- Response obsahuje `sessionId`
- V logu: "🔑 Password comparison result: true"

#### Test Case 3.2: Login se Starým Heslem
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "mail@victoreliot.com", "password": "F@llout1"}'
```
**Očekávaný výsledek**:
- HTTP Status: 401
- Response: "Neplatné přihlašovací údaje"
- V logu: "🔑 Password comparison result: false"

---

### 4. DATABÁZOVÁ INTEGRITA
**Priorita**: VYSOKÁ
**Očekávaný výsledek**: Data se správně ukládají a aktualizují

#### Test Case 4.1: Token Generation
```sql
SELECT email, "passwordResetToken", "passwordResetExpires" 
FROM users WHERE email = 'mail@victoreliot.com';
```
**Očekávaný výsledek**:
- `passwordResetToken`: 32-character string nebo NULL (po použití)
- `passwordResetExpires`: Timestamp 1 hodinu do budoucna

#### Test Case 4.2: Password Hash Update
```sql
SELECT email, password FROM users WHERE email = 'mail@victoreliot.com';
```
**Očekávaný výsledek**:
- `password`: Nový bcrypt hash (začíná $2b$12$)
- Hash se liší od původního

---

### 5. AMAZON SES INFRASTRUKTURA
**Priorita**: VYSOKÁ
**Očekávaný výsledek**: Profesionální email delivery

#### Test Case 5.1: SMTP Status
**Kontrola při startu serveru**:
```
📧 Email Service Status:
   SMTP: ✅ Configured
   From: noreply@doklad.ai
   Server: email-smtp.eu-north-1.amazonaws.com:587
   Mode: 🧪 Amazon SES Development
```

#### Test Case 5.2: Email Headers
**Ověření v přijatém emailu**:
```
From: noreply@doklad.ai
Message-ID: obsahuje @doklad.ai
Anti-spam headers: přítomny
```

---

## 🛠️ AUTOMATIZOVANÉ TESTOVACÍ SKRIPTY

### Master Test Script
Spusť: `node test-kompletni-email-system.js`

### Jednotlivé Test Komponenty
1. `test-email-delivery.js` - Amazon SES delivery test
2. `test-password-reset-flow.js` - Kompletní password reset
3. `test-database-integrity.js` - Databázové operace
4. `test-security-validation.js` - Bezpečnostní testy

---

## 📈 OČEKÁVANÉ VÝSLEDKY

### ✅ ÚSPĚŠNÝ TEST
- Všechny API calls vrací očekávané status kódy
- Emaily se doručují na skutečné adresy
- Password reset skutečně mění hesla
- Login funguje s novými hesly
- Debug logy jsou transparentní a informativní

### ❌ NEÚSPĚŠNÝ TEST
- API calls vrací chybové status kódy
- Emaily se neodesílají
- Hesla se neaktualizují v databázi
- Login nefunguje po password resetu
- Chybějí nebo jsou nepřesné debug logy

---

## 🔧 DEBUG & TROUBLESHOOTING

### Častые Problemy
1. **"Cannot read properties of undefined (reading 'set')"**
   - Problém se sessions objektem
   - Řešení: Restart serveru

2. **"535 authentication error"**
   - Problém s SMTP credentials
   - Řešení: Zkontroluj environment variables

3. **Token NULL v databázi**
   - Enhanced routes se nepoužívají
   - Řešení: Verify setupEnhancedAuthRoutes registration

### Logování
Sleduj tyto klíčové logy:
```
🔍 Hledám uživatele s emailem: [email]
👤 Uživatel nalezen: ID: [id], Email: [email]
🔧 Ukládám reset token pro [email]: [token]
✅ Token uložen do databáze
✅ Password reset email sent to [email]
🔑 Password comparison result: [true/false]
```

---

## 🎯 FINÁLNÍ OVĚŘENÍ

Po dokončení všech testů ověř:

1. ✅ **Email Infrastructure**: Amazon SES aktivní
2. ✅ **Password Reset Flow**: Kompletní funkcionalita
3. ✅ **Database Integrity**: Správné ukládání dat
4. ✅ **Security**: Proper token validation a expiration
5. ✅ **User Experience**: Smooth workflow od emailu po login

**Status Target**: 100% úspěšnost na všech kritických testech

Systém je připraven pro produkční nasazení při splnění všech test případů.