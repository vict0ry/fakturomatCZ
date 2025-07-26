#!/bin/bash

echo "📧 RYCHLÉ NASTAVENÍ GMAIL SMTP"
echo "==============================="
echo ""

if [ "$1" = "configure" ]; then
    echo "🔧 NASTAVENÍ GMAIL SMTP PRO OKAMŽITÉ POUŽITÍ:"
    echo ""
    echo "1️⃣ Ve vašem Gmail účtu:"
    echo "   • Jděte do Google Account → Security"
    echo "   • Zapněte 2-Step Verification"
    echo "   • Jděte do App passwords"
    echo "   • Vygenerujte heslo pro 'Mail'"
    echo ""
    echo "2️⃣ Nastavte environment variables:"
    echo "   export SMTP_HOST=smtp.gmail.com"
    echo "   export SMTP_PORT=587"
    echo "   export SMTP_USER=vase.email@gmail.com"
    echo "   export SMTP_PASS=app_password_z_gmail"
    echo ""
    echo "3️⃣ Restart aplikace:"
    echo "   Aplikace automaticky přepne na Gmail SMTP"
    echo ""
    echo "✅ Po restartu se emaily budou posílat skutečně!"
    
elif [ "$1" = "test" ]; then
    echo "🧪 TESTOVÁNÍ GMAIL SMTP:"
    echo ""
    
    if [ -z "$SMTP_HOST" ] || [ "$SMTP_HOST" = "localhost" ]; then
        echo "❌ Gmail SMTP není nakonfigurován!"
        echo "   Spusťte: ./quick-gmail-setup.sh configure"
        exit 1
    fi
    
    echo "✅ Gmail SMTP konfigurován:"
    echo "   Host: $SMTP_HOST"
    echo "   Port: $SMTP_PORT"
    echo "   User: $SMTP_USER"
    echo ""
    
    echo "📧 Testování password reset..."
    curl -X POST "http://localhost:5000/api/auth/forgot-password" \
         -H "Content-Type: application/json" \
         -d '{"email":"test@example.com"}' 2>/dev/null
    echo ""
    echo "📋 Výsledek najdete v logs konzole"
    
else
    echo "🚀 MOŽNOSTI PRO OKAMŽITÉ EMAILY:"
    echo ""
    echo "📧 VARIANTA A: Gmail SMTP (5 minut)"
    echo "   ./quick-gmail-setup.sh configure"
    echo "   → Rychlé, jednoduché, okamžitě funkční"
    echo ""
    echo "🐄 VARIANTA B: Mailcow server (30+ minut)"
    echo "   cat MAILCOW_SETUP_GUIDE.md"
    echo "   → Profesionální, vlastní infrastruktura"
    echo ""
    echo "📮 VARIANTA C: SendGrid/Mailgun"
    echo "   → Komerční služby s API"
    echo ""
    echo "💡 DOPORUČENÍ:"
    echo "   Pro rychlé testování: Gmail SMTP"
    echo "   Pro produkci: Mailcow server"
fi