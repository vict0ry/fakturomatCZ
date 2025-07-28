# 🔐 AMAZON SES DOMAIN VERIFICATION GUIDE

## Problém Identifikován
**535 Authentication Credentials Invalid** je způsoben tím, že **doména doklad.ai není verified v Amazon SES**.

## 🎯 ŘEŠENÍ KROK ZA KROKEM

### 1. Přidání Domény do SES
```
1. AWS Console → Simple Email Service
2. Region: eu-north-1 (Stockholm)
3. Configuration → Verified identities
4. Create identity → Domain
5. Domain: doklad.ai
6. Assign a default configuration set: Default
```

### 2. DNS Verifikace
AWS vám poskytne TXT záznam pro přidání do DNS:

```dns
# Příklad DNS záznamu (skutečná hodnota bude jiná)
doklad.ai IN TXT "amazonses:verification-token-xyz123"
```

### 3. Přidání DNS Záznamu
V DNS správci doklad.ai domény:
```
Type: TXT
Name: doklad.ai (nebo @)
Value: "amazonses:verification-token-xyz123"
TTL: 300
```

### 4. Propagace a Čekání
- DNS propagace: 5-30 minut
- SES verifikace: až 72 hodin
- Status můžete sledovat v AWS Console

## 🧪 KONTROLA STAVU

### V AWS Console:
```
SES → Verified identities → doklad.ai
Status: Success/Pending/Failed
```

### DNS Kontrola:
```bash
dig TXT doklad.ai
nslookup -type=TXT doklad.ai
```

## ⚡ MEZITÍMNÍ ŘEŠENÍ

Dokud není doména verified, máte 3 možnosti:

### A) Email Adresa Místo Domény
```
1. SES → Create identity → Email address
2. Zadejte: noreply@doklad.ai
3. Ověřte přes email potvrzení
4. Funguje okamžitě!
```

### B) Gmail SMTP (Doporučeno)
```bash
./quick-gmail-setup.sh configure
# Funguje za 5 minut, žádná domain verifikace
```

### C) Lokální Test Mode
```
Použít reset token z API response
Testovat funkcionalitu bez skutečných emailů
```

## 🎯 DOPORUČENÝ POSTUP

1. **Okamžitě**: Nastavte Gmail SMTP pro testování
2. **Paralelně**: Spusťte domain verifikaci pro SES
3. **Později**: Přepněte zpět na SES když je doména verified

## 📧 PO VERIFIKACI

Když bude doklad.ai verified:
```
✅ Amazon SES bude plně funkční
✅ Emaily se budou doručovat
✅ Professional branding s @doklad.ai
✅ Nízké náklady (0.10$/1000 emails)
```

---
*Domain verifikace je povinná pro všechny SES domény*