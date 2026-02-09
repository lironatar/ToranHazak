#!/bin/bash

# setup_free_real_https.sh
# Automates setting up a REAL, VALID HTTPS certificate using sslip.io
# This allows you to have HTTPS without buying a domain name.

# 1. Detect Public IP
# We try to detect it, but allow user override
DETECTED_IP=$(curl -s https://api.ipify.org)
echo "Detected IP: $DETECTED_IP"

read -p "Is this your server's public IP? [Y/n] " confirms
if [[ "$confirms" =~ ^[Nn]$ ]]; then
    read -p "Please enter your server's Public IP: " PUBLIC_IP
else
    PUBLIC_IP=$DETECTED_IP
fi

if [ -z "$PUBLIC_IP" ]; then
    echo "Error: Could not determine IP address."
    exit 1
fi

# Construct the Magic Domain
# sslip.io automatically resolves to the IP inside the domain name
DOMAIN="${PUBLIC_IP}.sslip.io"

echo "======================================================================"
echo "We will set up HTTPS for: $DOMAIN"
echo "This is a valid domain that points to your server automatically."
echo "======================================================================"

# 2. Install Certbot (if not already installed)
echo "Installing Certbot..."
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# 3. Reset Nginx Config to Port 80 (Standard HTTP)
# Certbot needs a clean Port 80 listener to verify the domain
echo "Configuring Nginx for $DOMAIN..."

CONFIG_FILE="/etc/nginx/sites-available/toren_hazak"

sudo tee "$CONFIG_FILE" > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Link and Reload
sudo ln -sf "$CONFIG_FILE" /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
echo "Reloading Nginx..."
sudo systemctl reload nginx

# 4. Request the Certificate
echo "Requesting Let's Encrypt Certificate..."
echo "Running: sudo certbot --nginx -d $DOMAIN"

sudo certbot --nginx -d "$DOMAIN"

# 5. Final Report
if [ $? -eq 0 ]; then
    echo ""
    echo "======================================================================"
    echo " SUCCESS!"
    echo " Your site is now live with REAL HTTPS at:"
    echo " https://$DOMAIN"
    echo "======================================================================"
else
    echo ""
    echo "======================================================================"
    echo " FAILED."
    echo " Please check the error messages above."
    echo " Ensure port 80 is open and your IP is reachable from the internet."
    echo "======================================================================"
fi
