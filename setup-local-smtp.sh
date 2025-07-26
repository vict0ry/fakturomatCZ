#!/bin/bash

echo "🚀 Nastavuji lokální SMTP server na tomto serveru..."
echo "================================================="

# Install and configure Postfix SMTP server
echo "📦 Instaluji Postfix SMTP server..."

# Set up Postfix configuration for local sending
sudo tee /etc/postfix/main.cf > /dev/null << 'EOF'
# Postfix configuration for doklad.ai
myhostname = doklad.ai
mydomain = doklad.ai
myorigin = $mydomain
inet_interfaces = localhost
inet_protocols = ipv4
mydestination = $myhostname, localhost.$mydomain, localhost
relayhost = 
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128
mailbox_size_limit = 0
recipient_delimiter = +
home_mailbox = Maildir/

# DKIM Configuration
milter_default_action = accept
milter_protocol = 2
smtpd_milters = inet:localhost:8891
non_smtpd_milters = inet:localhost:8891
EOF

# Start Postfix service
echo "🔄 Spouštím Postfix službu..."
sudo systemctl enable postfix
sudo systemctl start postfix

# Create local user for sending emails
echo "👤 Vytvářím lokálního uživatele pro emaily..."
sudo useradd -m -s /bin/bash noreply 2>/dev/null || echo "User already exists"
echo "noreply:doklad2025" | sudo chpasswd

# Set up DKIM with OpenDKIM
echo "🔐 Nastavuji DKIM autentifikaci..."
sudo apt-get install -y opendkim opendkim-tools

# Configure OpenDKIM
sudo tee /etc/opendkim.conf > /dev/null << 'EOF'
Syslog yes
UMask 002
Socket inet:8891@localhost
Canonicalization relaxed/simple
Mode sv
SubDomains no
AutoRestart yes
AutoRestartRate 10/1M
Background yes
DNSTimeout 5
SignatureAlgorithm rsa-sha256
KeyFile /etc/opendkim/keys/doklad.ai/default.private
Selector default
Domain doklad.ai
EOF

# Create OpenDKIM directories and keys
sudo mkdir -p /etc/opendkim/keys/doklad.ai
sudo cp dkim_private.key /etc/opendkim/keys/doklad.ai/default.private
sudo cp dkim_public.key /etc/opendkim/keys/doklad.ai/default.txt
sudo chown -R opendkim:opendkim /etc/opendkim
sudo chmod 600 /etc/opendkim/keys/doklad.ai/default.private

# Start OpenDKIM
sudo systemctl enable opendkim
sudo systemctl start opendkim

# Restart Postfix with DKIM integration
sudo systemctl restart postfix

echo ""
echo "✅ Lokální SMTP server nastaven!"
echo "📧 Server nyní posílá emaily přes localhost:25"
echo "🔐 DKIM autentifikace aktivní"
echo ""
echo "Environment proměnné pro aplikaci:"
echo "SMTP_HOST=localhost"
echo "SMTP_PORT=25"
echo "SMTP_USER=noreply"
echo "SMTP_PASS=doklad2025"
echo ""
echo "🧪 Test odeslání emailu:"
echo 'echo "Test email from doklad.ai" | mail -s "Test Subject" test@example.com'

chmod +x setup-local-smtp.sh