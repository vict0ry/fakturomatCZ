# 🔧 AMAZON SES TROUBLESHOOTING GUIDE

## Problém: 535 Authentication Credentials Invalid

### Identifikované příčiny:
1. **AWS credentials jsou pro API, ne pro SMTP**
2. **Region nemá SES SMTP podporu**
3. **Doména není verified v AWS SES**
4. **Sandbox mode limitations**

## 🎯 ŘEŠENÍ KROK ZA KROKEM

### 1. Ověření AWS Console Setup
```
1. AWS Console → Simple Email Service
2. Vyberte region: EU-WEST-1 (Dublin) - má garantovanou SMTP podporu
3. Verified identities → Create identity → Domain: doklad.ai
4. Přidejte DNS záznamy pro verifikaci domény
```

### 2. Správné SMTP Credentials
```
1. V SES Console → Account dashboard → SMTP settings
2. Create SMTP credentials (NE stejné jako API keys!)
3. Stáhněte SMTP username a password
4. Nahraďte v Replit Secrets:
   - AWS_ACCESS_KEY_ID = SMTP_USERNAME
   - AWS_SECRET_ACCESS_KEY = SMTP_PASSWORD
```

### 3. Environment Variables Check
```
AWS_SES_REGION=eu-west-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX (SMTP credentials)
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (SMTP password)
SES_FROM_EMAIL=noreply@doklad.ai
```

### 4. Sandbox Mode Exit
```
1. Support → Create case
2. Service limit increase → SES Sending Quota
3. Požadavek na production access
4. Důvod: Transactional emails for invoice system
```

## 🧪 TESTOVÁNÍ

### Manual Test
```bash
node test-email-direct.js
```

### Application Test
```bash
curl -X POST "http://localhost:5000/api/auth/forgot-password" \
     -H "Content-Type: application/json" \
     -d '{"email":"mail@victoreliot.com"}'
```

## 📊 REGIONÁLNÍ PODPORA

### Podporované regiony pro SMTP:
- ✅ **us-east-1** (N. Virginia)
- ✅ **us-west-2** (Oregon)  
- ✅ **eu-west-1** (Dublin)
- ❌ **eu-north-1** (Stockholm) - OMEZENÁ SMTP podpora

### Doporučení:
Pro EU použijte **eu-west-1** (Dublin)

## 🎯 ALTERNATIVNÍ ŘEŠENÍ

Pokud SES stále nefunguje:

### 1. Gmail SMTP (5 minut)
```bash
./quick-gmail-setup.sh configure
```

### 2. SendGrid API
```bash
npm install @sendgrid/mail
# Konfigurace přes SENDGRID_API_KEY
```

### 3. Mailcow Server
```bash
./install-mailcow.sh
```

## 📧 PO VYŘEŠENÍ

Úspěšný log bude vypadat:
```
📧 Email Service Status:
   SMTP: ✅ Configured
   From: noreply@doklad.ai
   Server: email-smtp.eu-west-1.amazonaws.com:587
   Mode: 📧 Amazon SES Production
✅ Email sent successfully!
```