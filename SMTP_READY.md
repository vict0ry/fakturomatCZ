# 🚀 SMTP Server Ready for doklad.ai

## ✅ Co je připraveno

### 📧 Kompletní Email Systém
- **Password reset** - bezpečné tokeny s expirací
- **Email konfirmace** - potvrzení registrace
- **Fakturní emaily** - s PDF přílohami
- **Platební připomínky** - 3 typy (první, druhá, konečná)

### 🔐 DKIM Bezpečnost
- **2048-bit RSA klíč** vygenerován pro doklad.ai
- **DNS konfigurace** připravena v `dns-records.md`
- **Anti-spam ochrana** s SPF a DMARC záznamy

### ⚙️ Produkční Konfigurace
```bash
# Spusťte pro konfigurační instrukce
./configure-production-smtp.sh

# Nebo nastavte environment proměnné:
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=noreply@doklad.ai
export SMTP_PASS=your_gmail_app_password
export DKIM_DOMAIN=doklad.ai
export DKIM_SELECTOR=default
export DKIM_PRIVATE_KEY="[generated_key]"
```

## 🧪 Aktuální Stav

**Development mód aktivní:**
- Password reset funguje (zobrazuje tokeny v konzoli)
- Všechny email funkce připraveny
- Automatický přepnutí na SMTP při konfiguraci

**Test produkčního módu:**
```bash
# Po nastavení SMTP údajů
curl -X POST "http://localhost:5000/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@doklad.ai"}'
```

## 📋 Kroky pro aktivaci

1. **Vytvořte Gmail účet:** noreply@doklad.ai
2. **Zapněte 2FA** v Gmail nastavení
3. **Vygenerujte app-specific heslo**
4. **Nastavte environment proměnné** (viz výše)
5. **Přidejte DNS TXT záznamy** (viz `dns-records.md`)
6. **Restartujte server**

## 🎯 Po aktivaci

✅ Skutečné emaily budou odcházet automaticky
✅ DKIM podpis pro lepší doručitelnost  
✅ Professional HTML design všech emailů
✅ Bezpečné token handling s expirací
✅ Error handling a logging

**Systém je plně připraven na produkční email komunikaci!**