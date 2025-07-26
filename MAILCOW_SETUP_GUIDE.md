# 🐄 MAILCOW SETUP GUIDE PRO DOKLAD.AI

## Přehled
Kompletní návod pro nastavení vlastního Mailcow email serveru pro skutečné posílání emailů místo lokálního SMTP serveru.

## 🚀 RYCHLÝ START

### 1. Instalace Mailcow serveru
```bash
git clone https://github.com/mailcow/mailcow-dockerized
cd mailcow-dockerized
./generate_config.sh   # Zadejte: mail.doklad.ai
nano mailcow.conf      # Změňte TZ=Europe/Prague
docker compose pull
docker compose up -d
```

### 2. DNS konfigurace na doklad.ai doméně
```dns
A     mail.doklad.ai     → IP_VAŠEHO_SERVERU
MX    doklad.ai          → mail.doklad.ai
TXT   doklad.ai          → v=spf1 mx a ~all
```

### 3. Vytvoření email účtu v Mailcow
1. Otevřít: https://mail.doklad.ai
2. Přihlásit jako admin (heslo z mailcow.conf)
3. Configuration → Mail Setup → Domains → Add domain: `doklad.ai`
4. Configuration → Mail Setup → Mailboxes → Add mailbox:
   - Local part: `noreply`
   - Domain: `doklad.ai`
   - Password: `silné_heslo_123`

### 4. Konfigurace Doklad.ai aplikace
```bash
export PRODUCTION_SMTP_HOST=mail.doklad.ai
export PRODUCTION_SMTP_PORT=587
export PRODUCTION_SMTP_USER=noreply@doklad.ai
export PRODUCTION_SMTP_PASS=silné_heslo_123
```

### 5. Restart a test
```bash
# Restart aplikace - uvidíte v konzoli:
# Mode: 🐄 Mailcow Production Server

# Test emailu
./configure-mailcow-smtp.sh test
```

## 🔧 TECHNICKÉ DETAILY

### Environment Variables (priorita)
1. **PRODUCTION_SMTP_*** - Mailcow server (nejvyšší priorita)
2. **SMTP_*** - Ostatní SMTP servery
3. **localhost:2525** - Lokální server (fallback)

### Email service automaticky detekuje:
- Mailcow configuraci přes PRODUCTION_SMTP_*
- Standardní SMTP přes SMTP_*
- Lokální server jako fallback

### Porty a security
- **Port 587** - STARTTLS (doporučeno)
- **Port 465** - SSL/TLS
- **Port 25** - Plain (pouze lokálně)

## 🎯 VÝHODY MAILCOW

### ✅ Vlastní infrastruktura
- Kompletní kontrola nad email serverem
- Žádné limity třetích stran
- Profesionální doména @doklad.ai

### ✅ Bezpečnost
- Automatické Let's Encrypt SSL
- DKIM, SPF, DMARC podpora
- Anti-spam a anti-virus

### ✅ Správa
- Web interface pro administraci
- Monitoring a logy
- Backup a restore možnosti

## 🚨 ŘEŠENÍ PROBLÉMŮ

### Email se neposílá
```bash
# Zkontrolovat Mailcow logy
docker compose logs mailcow-dockerized_postfix-mailcow_1

# Zkontrolovat DNS
nslookup mail.doklad.ai
dig MX doklad.ai

# Test SMTP připojení
telnet mail.doklad.ai 587
```

### DNS propagace
```bash
# Zkontrolovat DNS záznamy
dig A mail.doklad.ai
dig MX doklad.ai
dig TXT doklad.ai
```

### Firewall
```bash
# Otevřít potřebné porty
ufw allow 25,587,993,995/tcp
```

## 🎉 PO DOKONČENÍ

Po úspěšném nastavení:
1. **Emaily se posílají skutečně** na externí adresy
2. **Konzole ukazuje**: "Mode: 🐄 Mailcow Production Server"
3. **Password reset** funguje pro jakoukoliv email adresu
4. **Professional email** s @doklad.ai doménou

---
*Vytvořeno pro Doklad.ai systém - Vlastní Mailcow email server*