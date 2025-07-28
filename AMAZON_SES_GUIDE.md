# 📧 AMAZON SES INTEGRATION GUIDE

## Přehled
Kompletní návod pro nastavení Amazon SES pro profesionální email delivery v Doklad.ai systému.

## 🚀 RYCHLÝ START

### 1. AWS Console Setup
1. Jděte do **AWS Console** → **Simple Email Service (SES)**
2. Vyberte region (doporučeno: `eu-west-1` pro Evropu)
3. **Configuration** → **Verified identities** → **Create identity**
4. **Identity type**: Domain
5. **Domain**: `doklad.ai`
6. **Use a default DKIM signing key**: Yes

### 2. DNS Verifikace
AWS vám poskytne DNS záznamy pro přidání:

```dns
# Domain verification
doklad.ai IN TXT "ses-verification-token-xyz"

# DKIM authentication (3 záznamy)
ses-dkim-1._domainkey.doklad.ai IN CNAME ses-dkim-1.amazonaws.com
ses-dkim-2._domainkey.doklad.ai IN CNAME ses-dkim-2.amazonaws.com
ses-dkim-3._domainkey.doklad.ai IN CNAME ses-dkim-3.amazonaws.com

# SPF record
doklad.ai IN TXT "v=spf1 include:amazonses.com ~all"
```

### 3. SMTP Credentials
1. **Account dashboard** → **SMTP settings**
2. **Create SMTP credentials**
3. Zadejte název: `doklad-ai-smtp`
4. **Stáhněte credentials** (Access Key + Secret Access Key)

### 4. Environment Variables
```bash
export AWS_SES_REGION=eu-west-1
export AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
export AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export SES_FROM_EMAIL=noreply@doklad.ai
```

### 5. Production Access Request
1. **Support** → **Create case**
2. **Service limit increase**
3. **Limit type**: SES Sending Quota
4. **Mail type**: Transactional
5. **Website URL**: https://doklad.ai
6. **Use case description**: "Transactional emails for invoice management system"

## 🔧 TECHNICKÉ DETAILY

### Email Service Priority
Systém automaticky detekuje v tomto pořadí:
1. **Amazon SES** (AWS_SES_REGION + credentials)
2. **Mailcow** (PRODUCTION_SMTP_*)
3. **Generic SMTP** (SMTP_*)
4. **Local server** (localhost fallback)

### Podporované Features
- ✅ Transactional emails (password reset, invoices)
- ✅ DKIM signing
- ✅ Bounce/complaint handling
- ✅ Delivery statistics
- ✅ EU data residency (eu-west-1)

### Limity
- **Sandbox**: 200 emails/day, pouze verified emails
- **Production**: Až 200 emails/second po approval

## 💰 CENOVÁ STRUKTURA

### Sandbox (Zdarma)
- 200 emailů denně
- Pouze na verified email adresy
- Ideální pro development/testing

### Production
- **Odesílání**: $0.10 za 1,000 emailů
- **Příjem**: $0.09 za 1,000 emailů
- **Bez setup fees nebo měsíčních poplatků**

### Příklad měsíčních nákladů:
- 1,000 emailů: $0.10
- 10,000 emailů: $1.00
- 100,000 emailů: $10.00

## 🧪 TESTOVÁNÍ

```bash
# Konfigurace
./setup-amazon-ses.sh configure

# DNS záznamy
./setup-amazon-ses.sh dns

# Test funkcionalita
./setup-amazon-ses.sh test
```

## 🔍 MONITORING

### AWS Console
- **Sending statistics**: Delivered, bounced, complaints
- **Reputation metrics**: Bounce rate, complaint rate
- **Account-level suppression list**

### Application Logs
```
📧 Email Service Status:
   SMTP: ✅ Configured
   DKIM: ✅ Enabled
   From: noreply@doklad.ai
   Server: email-smtp.eu-west-1.amazonaws.com:587
   Mode: 📧 Amazon SES Production
```

## 🚨 ŘEŠENÍ PROBLÉMŮ

### Domain Not Verified
```bash
# Zkontrolovat DNS propagaci
dig TXT doklad.ai
nslookup -type=TXT doklad.ai
```

### SMTP Authentication Failed
- Ověřte správnost Access Key a Secret Key
- Zkontrolujte region v environment variables
- Ujistěte se že credentials jsou pro SMTP (ne API)

### Emails v Spam
- Ověřte DKIM konfiguraci
- Přidejte SPF záznam
- Požádejte o production access
- Sledujte bounce/complaint rates

## 🎯 PO DOKONČENÍ

✅ **Skutečné email delivery** na jakékoliv adresy  
✅ **Profesionální infrastruktura** s AWS  
✅ **Nízké náklady** bez pevných poplatků  
✅ **EU data residency** (GDPR compliance)  
✅ **Vysoká doručitelnost** 99%+  
✅ **Detailní statistiky** a monitoring  

---
*Amazon SES je nyní připraven pro produkční použití v Doklad.ai systému*