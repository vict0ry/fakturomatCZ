#!/bin/bash

echo "🚀 Konfigurace produkčního SMTP serveru pro doklad.ai"
echo "=================================================="
echo ""

# Read DKIM private key
DKIM_KEY=$(cat dkim_private.key | tr '\n' '\\n')

echo "📝 Nastavte tyto environment proměnné:"
echo ""
echo "export SMTP_HOST=smtp.gmail.com"
echo "export SMTP_PORT=587" 
echo "export SMTP_USER=noreply@doklad.ai"
echo "export SMTP_PASS=your_gmail_app_password"
echo "export DKIM_DOMAIN=doklad.ai"
echo "export DKIM_SELECTOR=default"
echo "export DKIM_PRIVATE_KEY=\"$DKIM_KEY\""
echo ""
echo "🔧 Kroky pro nastavení Gmail SMTP:"
echo "1. Vytvořte Gmail účet: noreply@doklad.ai"
echo "2. Zapněte 2FA (two-factor authentication)"
echo "3. Vygenerujte app-specific heslo v nastavení Gmail"
echo "4. Použijte toto heslo jako SMTP_PASS"
echo ""
echo "🌐 DNS konfigurace (povinná pro DKIM):"
echo "Přidejte TXT záznam do DNS doklad.ai domény:"
echo "Název: default._domainkey.doklad.ai"
echo "Hodnota: v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEF..."
echo "(kompletní záznam je v souboru dns-records.md)"
echo ""
echo "🧪 Testování:"
echo "Po nastavení restartujte server a spusťte:"
echo "node test-email-with-smtp.cjs"
echo ""
echo "✅ Po konfiguraci bude systém odesílat skutečné emaily!"

chmod +x configure-production-smtp.sh