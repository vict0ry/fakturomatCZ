#!/bin/bash

echo "🐄 KONFIGURACE MAILCOW SMTP PRO DOKLAD.AI"
echo "=========================================="
echo ""

# Check if this is a configuration or testing run
if [ "$1" = "test" ]; then
    echo "🧪 TESTOVÁNÍ MAILCOW SMTP PŘIPOJENÍ"
    echo ""
    
    # Check environment variables
    if [ -z "$PRODUCTION_SMTP_HOST" ] || [ -z "$PRODUCTION_SMTP_USER" ] || [ -z "$PRODUCTION_SMTP_PASS" ]; then
        echo "❌ Mailcow SMTP není nakonfigurován!"
        echo "   Nastavte environment variables:"
        echo "   PRODUCTION_SMTP_HOST=mail.doklad.ai"
        echo "   PRODUCTION_SMTP_PORT=587"
        echo "   PRODUCTION_SMTP_USER=noreply@doklad.ai"
        echo "   PRODUCTION_SMTP_PASS=vaše_heslo_z_mailcow"
        exit 1
    fi
    
    echo "✅ Environment variables nastaveny:"
    echo "   Host: $PRODUCTION_SMTP_HOST"
    echo "   Port: ${PRODUCTION_SMTP_PORT:-587}"
    echo "   User: $PRODUCTION_SMTP_USER"
    echo "   Pass: ***configured***"
    echo ""
    
    # Test email sending
    echo "📧 Testování odeslání emailu..."
    curl -X POST "http://localhost:5000/api/auth/forgot-password" \
         -H "Content-Type: application/json" \
         -d '{"email":"test@example.com"}' 2>/dev/null
    
    sleep 2
    echo ""
    echo "📋 Výsledek testu najdete v logs konzole aplikace"
    
else
    echo "📋 POSTUPY PRO NASTAVENÍ MAILCOW:"
    echo ""
    echo "1️⃣ INSTALACE MAILCOW SERVERU:"
    echo "   git clone https://github.com/mailcow/mailcow-dockerized"
    echo "   cd mailcow-dockerized"
    echo "   ./generate_config.sh   # Zadejte: mail.doklad.ai"
    echo "   nano mailcow.conf      # Změňte TZ=Europe/Prague"
    echo "   docker compose pull"
    echo "   docker compose up -d"
    echo ""
    
    echo "2️⃣ DNS KONFIGURACE (na doklad.ai doméně):"
    echo "   A     mail.doklad.ai     → IP_VAŠEHO_SERVERU"
    echo "   MX    doklad.ai          → mail.doklad.ai"
    echo "   TXT   doklad.ai          → v=spf1 mx a ~all"
    echo ""
    
    echo "3️⃣ VYTVOŘENÍ EMAIL ÚČTU:"
    echo "   • Otevřít: https://mail.doklad.ai"
    echo "   • Přihlásit jako admin (heslo z mailcow.conf)"
    echo "   • Configuration → Mail Setup → Domains → Add domain: doklad.ai"
    echo "   • Configuration → Mail Setup → Mailboxes → Add mailbox:"
    echo "     - Local part: noreply"
    echo "     - Domain: doklad.ai"
    echo "     - Password: silné_heslo"
    echo ""
    
    echo "4️⃣ NASTAVENÍ ENVIRONMENT VARIABLES:"
    echo "   export PRODUCTION_SMTP_HOST=mail.doklad.ai"
    echo "   export PRODUCTION_SMTP_PORT=587"
    echo "   export PRODUCTION_SMTP_USER=noreply@doklad.ai"
    echo "   export PRODUCTION_SMTP_PASS=heslo_z_mailcow"
    echo ""
    
    echo "5️⃣ RESTART APLIKACE:"
    echo "   • Restartujte Doklad.ai aplikaci"
    echo "   • V konzoli uvidíte: 'Mode: 🐄 Mailcow Production Server'"
    echo ""
    
    echo "6️⃣ TESTOVÁNÍ:"
    echo "   ./configure-mailcow-smtp.sh test"
    echo ""
    
    echo "🔧 ŘEŠENÍ PROBLÉMŮ:"
    echo "   • Firewall: Otevřete porty 25, 587, 993, 995"
    echo "   • DNS: Ověřte propagaci DNS záznamů"
    echo "   • SSL: Mailcow automaticky konfiguruje Let's Encrypt"
    echo "   • Logs: docker compose logs mailcow-dockerized_postfix-mailcow_1"
fi

echo ""
echo "🎯 Po dokončení budou emaily posílány skutečně přes Mailcow!"