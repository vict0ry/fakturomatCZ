#!/bin/bash

echo "📧 AMAZON SES SETUP PRO DOKLAD.AI"
echo "=================================="
echo ""

if [ "$1" = "configure" ]; then
    echo "🔧 NASTAVENÍ AMAZON SES:"
    echo "========================"
    echo ""
    echo "1️⃣ AWS Console Setup:"
    echo "   • Jděte do AWS Console → Simple Email Service (SES)"
    echo "   • Vyberte region (např. eu-west-1 pro Evropu)"
    echo "   • Configuration → Verified identities"
    echo "   • Verify domain: doklad.ai"
    echo "   • Přidejte DNS záznamy pro verifikaci"
    echo ""
    echo "2️⃣ SMTP Credentials:"
    echo "   • Account dashboard → SMTP settings"
    echo "   • Create SMTP credentials"
    echo "   • Stáhněte credentials (Access Key + Secret)"
    echo ""
    echo "3️⃣ Environment Variables:"
    echo "   export AWS_SES_REGION=eu-west-1"
    echo "   export AWS_ACCESS_KEY_ID=your_access_key"
    echo "   export AWS_SECRET_ACCESS_KEY=your_secret_key"
    echo "   export SES_FROM_EMAIL=noreply@doklad.ai"
    echo ""
    echo "4️⃣ Production Access:"
    echo "   • Request production access (výchozí je sandbox)"
    echo "   • Support → Create case → Service limit increase"
    echo "   • Type: SES Sending Quota"
    echo ""
    echo "✅ Po restartu aplikace se aktivuje Amazon SES!"

elif [ "$1" = "test" ]; then
    echo "🧪 TESTOVÁNÍ AMAZON SES:"
    echo "========================"
    echo ""
    
    if [ -z "$AWS_SES_REGION" ] || [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        echo "❌ Amazon SES není nakonfigurován!"
        echo "   Spusťte: ./setup-amazon-ses.sh configure"
        exit 1
    fi
    
    echo "✅ Amazon SES konfigurován:"
    echo "   Region: $AWS_SES_REGION"
    echo "   Access Key: ${AWS_ACCESS_KEY_ID:0:10}..."
    echo "   From Email: ${SES_FROM_EMAIL:-noreply@doklad.ai}"
    echo ""
    
    echo "📧 Testování password reset..."
    curl -X POST "http://localhost:5000/api/auth/forgot-password" \
         -H "Content-Type: application/json" \
         -d '{"email":"test@example.com"}' 2>/dev/null
    echo ""
    echo "📋 Výsledek najdete v logs konzole"

elif [ "$1" = "dns" ]; then
    echo "🌐 DNS ZÁZNAMY PRO SES VERIFIKACI:"
    echo "=================================="
    echo ""
    echo "Po přidání domény v AWS SES Console dostanete:"
    echo ""
    echo "🔸 DKIM záznamy (3x):"
    echo "ses-dkim-1._domainkey.doklad.ai IN CNAME ses-dkim-1.amazonaws.com"
    echo "ses-dkim-2._domainkey.doklad.ai IN CNAME ses-dkim-2.amazonaws.com"  
    echo "ses-dkim-3._domainkey.doklad.ai IN CNAME ses-dkim-3.amazonaws.com"
    echo ""
    echo "🔸 Domain verification TXT:"
    echo "doklad.ai IN TXT \"ses-verification-token\""
    echo ""
    echo "🔸 SPF záznam:"
    echo "doklad.ai IN TXT \"v=spf1 include:amazonses.com ~all\""
    echo ""
    echo "📋 Zkopírujte přesné hodnoty z AWS Console!"

else
    echo "🚀 AMAZON SES PRO PROFESIONÁLNÍ EMAILY"
    echo "======================================"
    echo ""
    echo "📊 VÝHODY SES:"
    echo "   ✅ Vysoká doručitelnost (99%+)"
    echo "   ✅ Nízká cena (0.10$ za 1000 emailů)"
    echo "   ✅ Automatické DKIM/SPF"
    echo "   ✅ Bounce/complaint handling"
    echo "   ✅ Detailní statistiky"
    echo "   ✅ Škálovatelnost"
    echo ""
    echo "📋 PŘÍKAZY:"
    echo "==========="
    echo "./setup-amazon-ses.sh configure  # Konfigurace"
    echo "./setup-amazon-ses.sh dns       # DNS záznamy"
    echo "./setup-amazon-ses.sh test      # Test emailů"
    echo ""
    echo "💰 CENA:"
    echo "   • Sandbox: 200 emailů/den zdarma"
    echo "   • Production: 0.10$ za 1000 emailů"
    echo "   • Bez měsíčních poplatků"
fi