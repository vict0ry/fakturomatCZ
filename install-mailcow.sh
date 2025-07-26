#!/bin/bash

set -e

echo "🐄 AUTOMATICKÁ INSTALACE MAILCOW PRO DOKLAD.AI"
echo "=============================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Tento script musí být spuštěn jako root (sudo)"
    exit 1
fi

# Update system
echo "📦 Aktualizuji systém..."
apt update && apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Instaluji Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
else
    echo "✅ Docker je již nainstalován"
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "🔧 Instaluji Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose je již nainstalován"
fi

# Clone Mailcow
echo "📥 Stahuji Mailcow..."
cd /opt
if [ -d "mailcow-dockerized" ]; then
    echo "⚠️  Mailcow adresář již existuje, aktualizuji..."
    cd mailcow-dockerized
    git pull
else
    git clone https://github.com/mailcow/mailcow-dockerized
    cd mailcow-dockerized
fi

# Generate configuration
echo "⚙️  Generuji konfiguraci pro mail.doklad.ai..."
echo "mail.doklad.ai" | ./generate_config.sh

# Configure timezone and settings
echo "🌍 Konfiguruji časové pásmo a nastavení..."
sed -i 's/TZ=.*/TZ=Europe\/Prague/' mailcow.conf
sed -i 's/SKIP_LETS_ENCRYPT=.*/SKIP_LETS_ENCRYPT=n/' mailcow.conf
sed -i 's/ADDITIONAL_SAN=.*/ADDITIONAL_SAN=doklad.ai/' mailcow.conf

# Show configuration
echo ""
echo "📋 KONFIGURACE MAILCOW:"
echo "========================"
grep -E "(MAILCOW_HOSTNAME|TZ|SKIP_LETS_ENCRYPT)" mailcow.conf
echo ""

# Pull and start containers
echo "🚀 Stahuji a spouštím Mailcow kontejnery..."
docker-compose pull
docker-compose up -d

# Wait for services to start
echo "⏳ Čekám na spuštění služeb..."
sleep 30

# Show status
echo ""
echo "📊 STAV MAILCOW SLUŽEB:"
echo "======================="
docker-compose ps

# Get admin password
echo ""
echo "🔐 ADMIN PŘÍSTUPOVÉ ÚDAJE:"
echo "=========================="
echo "URL: https://mail.doklad.ai"
echo "Username: admin"
echo "Password: $(docker-compose exec mysql-mailcow mysql -u mailcow -p\$(cat mysql-mailcow/mysql-mailcow.env | grep MYSQL_PASS | cut -d= -f2) mailcow -e "SELECT password FROM admin;" | tail -1)"

echo ""
echo "🎯 DALŠÍ KROKY:"
echo "==============="
echo "1. Nakonfigurujte DNS záznamy:"
echo "   A     mail.doklad.ai     → $(curl -s ifconfig.me)"
echo "   MX    doklad.ai          → mail.doklad.ai"
echo "   TXT   doklad.ai          → v=spf1 mx a ~all"
echo ""
echo "2. Otevřete https://mail.doklad.ai"
echo "3. Přihlaste se jako admin"
echo "4. Vytvořte doménu 'doklad.ai'"
echo "5. Vytvořte mailbox 'noreply@doklad.ai'"
echo ""
echo "✅ Mailcow je nainstalován a spuštěn!"