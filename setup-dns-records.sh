#!/bin/bash

echo "🌐 DNS ZÁZNAMY PRO DOKLAD.AI MAILCOW"
echo "====================================="
echo ""

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me)
if [ -z "$PUBLIC_IP" ]; then
    PUBLIC_IP="YOUR_SERVER_IP"
fi

echo "📍 Váš server IP: $PUBLIC_IP"
echo ""

echo "📋 POTŘEBNÉ DNS ZÁZNAMY:"
echo "========================"
echo ""

echo "🔸 A ZÁZNAMY:"
echo "mail.doklad.ai.     IN  A     $PUBLIC_IP"
echo "doklad.ai.          IN  A     $PUBLIC_IP"
echo ""

echo "🔸 MX ZÁZNAM:"
echo "doklad.ai.          IN  MX    10 mail.doklad.ai."
echo ""

echo "🔸 TXT ZÁZNAMY (SPF):"
echo "doklad.ai.          IN  TXT   \"v=spf1 mx a ip4:$PUBLIC_IP ~all\""
echo ""

echo "🔸 DKIM ZÁZNAM (vygeneruje se v Mailcow):"
echo "default._domainkey.doklad.ai. IN TXT \"v=DKIM1; k=rsa; p=...\""
echo ""

echo "🔸 DMARC ZÁZNAM:"
echo "_dmarc.doklad.ai.   IN  TXT   \"v=DMARC1; p=quarantine; ruf=mailto:admin@doklad.ai\""
echo ""

echo "⚡ RYCHLÁ KONFIGURACE PRO CLOUDFLARE:"
echo "===================================="
echo "A     mail    $PUBLIC_IP"
echo "A     @       $PUBLIC_IP"
echo "MX    @       mail.doklad.ai  (Priority: 10)"
echo "TXT   @       v=spf1 mx a ip4:$PUBLIC_IP ~all"
echo ""

echo "🔍 OVĚŘENÍ DNS:"
echo "==============="
echo "nslookup mail.doklad.ai"
echo "dig MX doklad.ai"
echo "dig TXT doklad.ai"
echo ""

echo "📧 Po nastavení DNS spusťte:"
echo "============================="
echo "./configure-mailcow-domain.sh"