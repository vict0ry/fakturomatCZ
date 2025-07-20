# Profesionální Email Setup pro prevenci spamu

## Nejlepší řešení pro firemní emaily

### 1. **Amazon SES (Simple Email Service)** - DOPORUČENO ⭐
- Nejnižší cena (0,10$ za 1000 emailů)
- Nejvyšší delivery rate (99%+)
- Automatické SPF, DKIM, DMARC nastavení
- Integrované bounce/complaint handling
- Snadné nastavení přes AWS console

#### Setup pro SES:
```javascript
// Instalace AWS SDK
npm install @aws-sdk/client-ses

// Konfigurace v .env
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
SES_VERIFIED_EMAIL=noreply@yourdomain.cz

// Implementace
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({ region: process.env.AWS_REGION });

export async function sendInvoiceEmail(to: string, subject: string, html: string) {
  const command = new SendEmailCommand({
    Source: process.env.SES_VERIFIED_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: { Html: { Data: html, Charset: "UTF-8" } }
    }
  });
  
  return await sesClient.send(command);
}
```

### 2. **SendGrid** - Alternativa
- 100 emailů zdarma/den
- Dobrý pro začátek
- Vyžaduje více manuálního nastavení

### 3. **Postmark** - Premium volba
- Nejrychlejší delivery
- Výborná dokumentace
- Dražší než SES

## DNS nastavení pro prevenci spamu

### Povinné DNS záznamy:
```dns
; SPF záznam - povoluje servery k odesílání
yourdomain.cz. IN TXT "v=spf1 include:amazonses.com ~all"

; DKIM záznam - Amazon SES automaticky vygeneruje
_amazonses.yourdomain.cz. IN CNAME xyz.dkim.amazonses.com

; DMARC záznam - politika ověřování
_dmarc.yourdomain.cz. IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.cz"

; PTR záznam (reverse DNS) - nastaví hosting provider
```

## Best practices pro faktury

### Email template pro faktury:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faktura #{invoiceNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #f8f9fa; padding: 20px; text-align: center;">
        <h1 style="color: #333;">Nová faktura</h1>
    </div>
    
    <div style="padding: 20px;">
        <p>Dobrý den,</p>
        
        <p>zasíláme Vám novou fakturu <strong>#{invoiceNumber}</strong> 
        na částku <strong>{total} CZK</strong>.</p>
        
        <div style="background: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <strong>Splatnost:</strong> {dueDate}<br>
            <strong>Variabilní symbol:</strong> {variableSymbol}<br>
            <strong>Číslo účtu:</strong> {bankAccount}
        </div>
        
        <p style="text-align: center;">
            <a href="{invoiceUrl}" 
               style="background: #1976d2; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
                Zobrazit fakturu online
            </a>
        </p>
        
        <p><small>Faktura je v příloze jako PDF soubor.</small></p>
        
        <hr style="margin: 30px 0;">
        <p><small>S pozdravem,<br>{companyName}</small></p>
    </div>
</body>
</html>
```

### Subject řádky které nepadají do spamu:
✅ "Faktura č. 20258960 - splatnost 31.01.2025"
✅ "Nová faktura od {CompanyName} - {amount} CZK"  
✅ "Dodávka dokončena - faktura {invoiceNumber}"

❌ "URGENT!!! PAYMENT REQUIRED"
❌ "FREE MONEY - CLICK HERE" 
❌ Více než 3 vykřičníky

## Monitoring delivery rate

### Sledování bounces a complaints:
```javascript
// Webhook endpoint pro SES notifications
app.post('/webhooks/ses-bounce', (req, res) => {
  const notification = JSON.parse(req.body);
  
  if (notification.notificationType === 'Bounce') {
    // Označit email jako nedoručený
    console.log('Email bounced:', notification.bounce.bouncedRecipients);
  }
  
  if (notification.notificationType === 'Complaint') {
    // Označit jako spam complaint
    console.log('Spam complaint:', notification.complaint.complainedRecipients);
  }
  
  res.status(200).send('OK');
});
```

## Celkové doporučení:

1. **Použijte Amazon SES** - nejlepší poměr cena/výkon
2. **Nastavte správné DNS záznamy** - SPF, DKIM, DMARC
3. **Používejte profesionální šablony** - čisté HTML bez spamových slov
4. **Monitorujte delivery rate** - webhook notifikace
5. **Testujte různé ISP** - Gmail, Seznam, Outlook

Chcete, abych implementoval Amazon SES setup do aplikace?