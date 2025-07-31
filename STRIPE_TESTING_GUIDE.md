# 🧪 STRIPE TESTING GUIDE - Bezpečné Testování

## ✅ AKTUÁLNÍ STATUS

### Stripe Keys Configuration
- ✅ **STRIPE_SECRET_KEY** - správně nastaven (sk_test_...)
- ✅ **VITE_STRIPE_PUBLIC_KEY** - funkční pro frontend
- ✅ **Stripe API connection** - ✅ úspěšná (balance: 0 CZK test mode)

### Backend Endpoints
- ✅ `/api/stripe/create-checkout-session` - vytváření checkout sessions
- ✅ `/api/stripe/subscription-status` - kontrola předplatného
- ✅ `/api/stripe/cancel-subscription` - zrušení předplatného  
- ✅ `/api/stripe/webhook` - zpracování Stripe událostí

## 🧪 TESTING COMMANDS

### 1. Rychlý API Test
```bash
# Test subscription status
curl -X GET "http://localhost:5000/api/stripe/subscription-status" \
  -H "Authorization: Bearer test-session-dev"

# Test checkout session creation
curl -X POST "http://localhost:5000/api/stripe/create-checkout-session" \
  -H "Authorization: Bearer test-session-dev" \
  -H "Content-Type: application/json"
```

### 2. Kompletní Test Scripts
```bash
node test-stripe-simple.js           # Jednoduchý test s admin uživatelem
node check-stripe-keys.js            # Ověření Stripe API klíčů
node debug-stripe-checkout.js        # Debug checkout procesu
```

## 💳 TESTOVACÍ KARTY (žádné skutečné poplatky!)

### ✅ Úspěšné Karty
```
Základní test:        4242424242424242
Visa:                 4242424242424242  
Mastercard:           5555555555554444
American Express:     378282246310005
```

### ❌ Chybové Karty
```
Zamítnutá platba:     4000000000000002
Nedostatek prostředků: 4000000000009995
Prošlá karta:         4000000000000069
Vyžaduje ověření:     4000000000000341
```

### 📋 Univerzální Testovací Data
```
Expiry Date:    12/25 (nebo jakékoliv budoucí datum)
CVC:           123 (nebo jakékoliv 3 číslice)
ZIP:           12345 (nebo jakékoliv PSČ)
Jméno:         Test User
Email:         test@example.com
```

## 🌐 MANUÁLNÍ TESTOVÁNÍ V PROHLÍŽEČI

### Krok 1: Získání Checkout URL
```bash
node test-stripe-simple.js
# Zkopíruj URL z outputu
```

### Krok 2: Testovací Postup
1. **Otevři checkout URL** v prohlížeči
2. **Vyplň testovací kartu** - 4242424242424242
3. **Zkontroluj trial period** - 7 dní zdarma
4. **Dokončit platbu** - klikni "Subscribe"
5. **Ověř přesměrování** - na /dashboard
6. **Zkontroluj status** - na /subscription

### Krok 3: Očekávané Výsledky
- ✅ Status: "Zkušební období"
- ✅ Zbývá: 7 dní
- ✅ Cena po trial: 199 Kč/měsíc
- ✅ Možnost zrušit předplatné

## 🔧 DEBUGGING

### Common Issues & Solutions

**Problem:** "Authentication required"
```bash
Solution: Použij Bearer token v testech
curl -H "Authorization: Bearer test-session-dev" ...
```

**Problem:** "User not found"  
```bash
Solution: Zkontroluj že admin uživatel existuje
SELECT * FROM users WHERE email = 'admin@doklad.ai';
```

**Problem:** "Invalid API Key"
```bash
Solution: Zkontroluj STRIPE_SECRET_KEY format
echo $STRIPE_SECRET_KEY | head -c 12  # Mělo by být: sk_test_...
```

### Debug Logs
Zapni detailní logování:
```bash
# V server/routes/stripe.ts najdi console.log statements
# Sleduj workflow console pro error messages
```

## ⚠️ BEZPEČNOSTNÍ UPOZORNĚNÍ

### ✅ Safe Testing
- 🧪 **Test Mode Only** - všechny klíče začínají `*_test_`
- 💳 **Fake Cards Only** - 4242424242424242 a podobné
- 🚫 **No Real Money** - žádné skutečné transakce
- 🔒 **Webhook Validation** - všechny webhooks ověřeny

### 🚨 Production Warnings
- ❌ **NEVER** použij live klíče (`sk_live_*`) na development
- ❌ **NEVER** testuj se skutečnými kartami
- ❌ **NEVER** commits klíče do Git repository
- ❌ **NEVER** sdílej secret klíče

## 📊 STRIPE DASHBOARD

Ve Stripe Test Dashboard uvidíš:

### Customers
- Nové test zákazníky vytvořené během testování
- Email adresy odpovídající test účtům

### Subscriptions  
- Aktivní subscriptions s 7denní trial
- Status, billing cycle, trial end dates

### Payments
- Payment intents (může být $0 pro trial)
- Successful/failed payment attempts

### Events
- `customer.subscription.created`
- `invoice.payment_succeeded`
- `customer.subscription.updated`

## 🎯 NEXT STEPS

Po úspěšném testování:

1. **Production Deployment**
   - Změň na live klíče
   - Nastav production webhooks
   - Aktualizuj redirect URLs

2. **Enhanced Features**
   - Multiple subscription tiers
   - Usage-based billing
   - Coupon support
   - Invoice customization

3. **Monitoring**
   - Stripe Dashboard monitoring
   - Email notifications
   - Failed payment handling
   - Churn analytics

## 🔄 TROUBLESHOOTING CHECKLIST

- [ ] Server běží na portu 5000
- [ ] Stripe klíče jsou test verze (`sk_test_`, `pk_test_`)
- [ ] Database connection funguje  
- [ ] Admin uživatel existuje
- [ ] Bearer token authentication funguje
- [ ] Checkout session se vytváří úspěšně
- [ ] Test karty jsou z oficiálního Stripe dokumentu
- [ ] Browser developer tools nehlásí chyby
- [ ] Webhooks jsou correctně nakonfigurovány (pro production)

**Systém je připraven na 100% bezpečné testování! 🎉**