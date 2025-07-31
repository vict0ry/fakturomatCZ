# 🧪 STRIPE TESTING GUIDE - FAKE KARTY

## ⚠️ DŮLEŽITÉ: ŽÁDNÉ SKUTEČNÉ PENÍZE SE NESTRHÁVAJÍ!

Všechny testy používají Stripe **TEST MÓD** - žádné skutečné poplatky se neúčtují.

## 🎯 POSTUP TESTOVÁNÍ

### 1. Spuštění aplikace
```bash
npm run dev
```

### 2. Registrace/Přihlášení
- Přejdi na: `http://localhost:5000/register`
- Vytvoř nový účet nebo se přihlaš

### 3. Přechod na pricing
- Přejdi na: `http://localhost:5000/pricing`
- Klikni **"Začít 7denní zkušební období"**

### 4. Stripe Checkout
Použij tyto **TESTOVACÍ** údaje:

#### ✅ ÚSPĚŠNÁ KARTA
```
Číslo karty: 4242424242424242
Expiry:      12/25
CVC:         123
ZIP:         12345
Jméno:       Test User
```

#### ❌ TESTOVACÍ CHYBY
```
Zamítnutá karta:         4000000000000002
Nedostatek prostředků:   4000000000009995
Vyžaduje ověření:        4000000000000341
Prošlá karta:           4000000000000069
```

## 📊 CO OČEKÁVAT

### Po úspěšné platbě:
1. **Přesměrování** na success page
2. **Subscription status** na `/subscription`:
   - Status: "Zkušební období"
   - Zbývá: 7 dní
   - Cena: 199 Kč/měsíc

### Ve Stripe Dashboard:
1. **Customers** - nový zákazník
2. **Subscriptions** - nové předplatné s trial
3. **Payments** - payment intent
4. **Webhooks** - události (pokud nastaveny)

## 🔍 TROUBLESHOOTING

### Stripe dashboard je prázdný?
- **Normální!** Data se zobrazí až po dokončení checkout procesu
- Ujisti se, že jsi v **test módu** (sandbox)

### Checkout nefunguje?
1. Zkontroluj console errory v prohlížeči
2. Zkontroluj server logy
3. Ověř Stripe klíče v environment variables

### Webhook události?
```bash
# Instalace Stripe CLI
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

## 🧪 AUTOMATICKÉ TESTY

```bash
node test-stripe-simple.js     # Základní test
node test-stripe-fake-cards.js # Dokumentace karet
```

## 🔒 BEZPEČNOST

- ✅ Všechny karty fungují pouze v TEST módu
- ✅ Žádné skutečné peníze se nestrhávají
- ✅ Test data jsou automaticky smazána po 90 dnech
- ✅ Pro produkci použij LIVE Stripe klíče

## 📱 MOBILNÍ TESTOVÁNÍ

Stripe Checkout je plně responsivní - testuj na:
- Desktop prohlížeč
- Mobilní prohlížeč
- Developer tools mobile view

## 🎯 POKROČILÉ TESTOVÁNÍ

### 3D Secure
```
Karta: 4000000000000341
→ Zobrazí se 3D Secure challenge
```

### Různé měny
```
Karta: 4242424242424242
→ Testuj s CZK (výchozí)
```

### Webhooks
```bash
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

## 📈 OČEKÁVANÉ VÝSLEDKY

### ✅ Úspěšný test flow:
1. Pricing page se načte
2. Checkout session se vytvoří
3. Stripe checkout se otevře
4. Platba proběhne úspěšně
5. Přesměrování na success
6. Subscription status se aktualizuje
7. Data se zobrazí ve Stripe dashboard

### ❌ Běžné problémy:
- CORS errors → zkontroluj server běží
- 401 Unauthorized → přihlaš se znovu
- 500 Server Error → zkontroluj Stripe klíče
- Empty dashboard → počkej na dokončení checkout

---

**💡 TIP:** Pro nejlepší testovací zkušenost otevři Stripe dashboard v druhé záložce a sleduj data v real-time!