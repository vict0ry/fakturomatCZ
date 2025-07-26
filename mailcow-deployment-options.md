# 🐄 MAILCOW DEPLOYMENT MOŽNOSTI

## Přehled
Mailcow vyžaduje specifické systémové požadavky a konfigurace. Zde jsou možnosti nasazení:

## 🖥️ VLASTNÍ SERVER/VPS (DOPORUČENO)

### Výhody:
- ✅ Plná kontrola nad serverem
- ✅ Root přístup
- ✅ Vlastní IP adresa
- ✅ Otevřené porty (25, 587, 993, 995)
- ✅ SSL certifikáty (Let's Encrypt)
- ✅ Profesionální konfigurace

### Požadavky:
- **RAM**: Minimálně 4GB (doporučeno 8GB)
- **CPU**: 2+ cores
- **Disk**: 20GB+ volného místa
- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **Porty**: 25, 80, 443, 587, 993, 995
- **Doména**: Řízení DNS záznamů

### Instalace:
```bash
# Na vašem serveru spusťte:
sudo ./install-mailcow.sh
```

## ☁️ REPLIT (OMEZENÉ)

### Problémy:
- ❌ Žádný root přístup
- ❌ Omezené porty
- ❌ Není vhodné pro produkční email server
- ❌ Docker může mít problémy
- ❌ Firewall omezení

### Alternativa pro Replit:
Můžeme použít **Externí SMTP služby**:
- Gmail SMTP (rychlé řešení)
- SendGrid API
- Mailgun API
- Amazon SES

## 🎯 DOPORUČENÍ

### Pro testování:
1. **Gmail SMTP** - nejrychlejší (5 minut)
2. **SendGrid** - profesionální API

### Pro produkci:
1. **Vlastní Mailcow server** - nejlepší dlouhodobé řešení
2. **Managed email služby** - pro menší projekty

## 📞 DALŠÍ KROKY

**Pokud máte vlastní server:**
```bash
sudo ./install-mailcow.sh
./setup-dns-records.sh
./configure-mailcow-domain.sh
```

**Pokud chcete rychlé řešení:**
```bash
./quick-gmail-setup.sh configure
```

**Pokud chcete SendGrid:**
- Registrace na sendgrid.com
- API klíč
- Konfigurace v aplikaci