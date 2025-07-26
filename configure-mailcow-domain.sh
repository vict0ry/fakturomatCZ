#!/bin/bash

echo "🐄 KONFIGURACE DOKLAD.AI DOMÉNY V MAILCOW"
echo "=========================================="
echo ""

# Check if Mailcow is running
if ! docker-compose -f /opt/mailcow-dockerized/docker-compose.yml ps | grep -q "Up"; then
    echo "❌ Mailcow není spuštěn. Nejdříve spusťte ./install-mailcow.sh"
    exit 1
fi

echo "📧 Konfiguruji doménu doklad.ai..."

# Get Mailcow API key (this would need to be set manually first time)
MAILCOW_API_KEY="${MAILCOW_API_KEY:-your_api_key_here}"
MAILCOW_URL="https://mail.doklad.ai"

if [ "$MAILCOW_API_KEY" = "your_api_key_here" ]; then
    echo "⚠️  MAILCOW_API_KEY není nastaven"
    echo ""
    echo "📋 MANUÁLNÍ KROKY:"
    echo "=================="
    echo "1. Otevřete: https://mail.doklad.ai"
    echo "2. Přihlaste se jako admin"
    echo "3. Jděte do: Configuration → Access → API"
    echo "4. Vygenerujte nový API klíč"
    echo "5. Spusťte: export MAILCOW_API_KEY=your_generated_key"
    echo "6. Spusťte tento script znovu"
    echo ""
    echo "NEBO pokračujte manuálně:"
    echo "========================="
    echo "1. Configuration → Mail Setup → Domains"
    echo "2. Add domain: doklad.ai"
    echo "3. Configuration → Mail Setup → Mailboxes"
    echo "4. Add mailbox:"
    echo "   - Local part: noreply"
    echo "   - Domain: doklad.ai"
    echo "   - Password: silné_heslo_123"
    echo "   - Quota: 1024 MB"
    exit 1
fi

# Add domain via API
echo "🌐 Přidávám doménu doklad.ai..."
curl -X POST "${MAILCOW_URL}/api/v1/add/domain" \
     -H "X-API-Key: ${MAILCOW_API_KEY}" \
     -H "Content-Type: application/json" \
     -d '{
       "domain": "doklad.ai",
       "description": "Doklad.ai email domain",
       "aliases": 400,
       "mailboxes": 10,
       "defquota": 1024,
       "maxquota": 2048,
       "quota": 10240,
       "active": 1,
       "rl_value": 10,
       "rl_frame": "s",
       "backupmx": 0,
       "relay_all_recipients": 0
     }'

echo ""

# Add mailbox via API
echo "📮 Vytvářím mailbox noreply@doklad.ai..."
curl -X POST "${MAILCOW_URL}/api/v1/add/mailbox" \
     -H "X-API-Key: ${MAILCOW_API_KEY}" \
     -H "Content-Type: application/json" \
     -d '{
       "local_part": "noreply",
       "domain": "doklad.ai",
       "name": "Doklad.ai Noreply",
       "quota": "1024",
       "password": "DokladAI2025!",
       "password2": "DokladAI2025!",
       "active": "1"
     }'

echo ""
echo "✅ Doména a mailbox vytvořeny!"
echo ""
echo "📧 SMTP údaje pro aplikaci:"
echo "==========================="
echo "PRODUCTION_SMTP_HOST=mail.doklad.ai"
echo "PRODUCTION_SMTP_PORT=587"
echo "PRODUCTION_SMTP_USER=noreply@doklad.ai"
echo "PRODUCTION_SMTP_PASS=DokladAI2025!"
echo ""
echo "🔧 Nastavte tyto environment variables a restartujte aplikaci"