# 📧 Profesionální Email Setup pro český fakturační systém

## Nejlepší řešení pro doručování emailů bez spadnutí do spamu

### ⭐ Amazon SES (doporučeno)
**Proč Amazon SES:**
- Nejnižší cena: 0,10$ za 1000 emailů
- Nejvyšší delivery rate: 99%+
- Automatické SPF, DKIM, DMARC nastavení
- Integrované bounce/complaint handling

**Quick setup:**
```bash
# 1. Instalace AWS SDK
npm install @aws-sdk/client-ses

# 2. Přidání do .env
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
SES_VERIFIED_EMAIL=noreply@yourdomain.cz

# 3. Ověření domény v AWS SES console
# - Přejít na https://console.aws.amazon.com/ses/
# - Verify domain: yourdomain.cz
# - Přidat DNS záznamy (automaticky vygenerované)
```

**Implementace připravena v:** `server/services/email/amazon-ses-setup.ts`

### 🔧 DNS záznamy pro prevenci spamu

```dns
; SPF - povoluje Amazon SES odesílat emaily za vaši doménu
yourdomain.cz. IN TXT "v=spf1 include:amazonses.com ~all"

; DKIM - Amazon automaticky vygeneruje
_amazonses.yourdomain.cz. IN CNAME [automaticky_vygenerováno].dkim.amazonses.com

; DMARC - politika ověřování
_dmarc.yourdomain.cz. IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@yourdomain.cz"
```

### 📝 Email template pro faktury

**✅ Subject lines které NEPADAJÍ do spamu:**
- "Faktura č. 20258960 - splatnost 31.01.2025"
- "Nová faktura od [Firma] - 25 000 CZK"
- "Dodávka dokončena - faktura 20258960"

**❌ Vyhněte se:**
- "URGENT!!! PAYMENT REQUIRED"
- Více než 3 vykřičníky
- CAPS LOCK text
- Slova jako "FREE", "WINNER", "CLICK HERE"

### 📊 Monitoring delivery rate

**Webhook pro SES notifications:**
```javascript
// server/routes/email-webhooks.ts
app.post('/webhooks/ses-bounce', (req, res) => {
  const notification = JSON.parse(req.body);
  
  if (notification.notificationType === 'Bounce') {
    // Označit email jako nedoručený v databázi
    console.log('Email bounced:', notification.bounce.bouncedRecipients);
  }
  
  if (notification.notificationType === 'Complaint') {
    // Spam complaint - odstranit z mailing listu
    console.log('Spam complaint:', notification.complaint.complainedRecipients);
  }
  
  res.status(200).send('OK');
});
```

### 🚀 Alternativní řešení

**2. SendGrid**
- 100 emailů/den zdarma
- Dobrý pro začátek
- Setup: `npm install @sendgrid/mail`

**3. Postmark**
- Nejrychlejší delivery
- Premium pricing
- Výborná dokumentace

## Smart Invoice Sharing - Implementováno ✅

Systém nyní podporuje bezpečné sdílení faktur:

- **Secure tokens**: Kryptografické náhodné tokeny
- **Expiration control**: Nastavitelná doba platnosti
- **View tracking**: Sledování počtu zobrazení
- **Public access**: Zobrazení bez přihlášení
- **PDF download**: Direct download z public linku

**API endpointy:**
- `POST /api/invoices/:id/share` - Generování odkazu
- `GET /api/public/invoice/:token` - Public zobrazení
- `GET /api/public/invoice/:token/pdf` - PDF download

**Frontend komponenta:** `InvoiceShareDialog.tsx`

## Oprava poznámek v AI systému

**Problém:** Poznámky se přidávaly do databáze ale neprobíhala správná aktualizace UI.

**Řešení:** Vylepšen refresh mechanismus v `bottom-ai-chat.tsx`:
- Query invalidation pro konkrétní fakturu
- Automatická detekce editované faktury z URL
- Správné cache management

**Test poznámky:**
```bash
curl -X POST "http://localhost:5000/api/chat/universal" \
  -H "Authorization: Bearer test-session-dev" \
  -d '{"message": "přidej poznámku: test poznámka", "currentPath": "/invoices/79/edit"}'
```

## Deployment checklist

1. **Environment variables:**
   ```
   DATABASE_URL=postgresql://...
   OPENAI_API_KEY=sk-...
   AWS_REGION=eu-west-1
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   SES_VERIFIED_EMAIL=noreply@yourdomain.cz
   ```

2. **DNS setup:**
   - SPF, DKIM, DMARC záznamy
   - Domain verification v SES

3. **Database migration:**
   ```bash
   npm run db:push
   ```

4. **Test email delivery:**
   - Pošlete test fakturu
   - Zkontrolujte delivery rate v SES console

Chcete implementovat konkrétní email službu nebo máte dotazy k nastavení?