#!/bin/bash

# setup_self_signed_https.sh
# Sets up HTTPS for an IP address using a Self-Signed Certificate.
# NOTE: Browsers will show a warning because the certificate is self-signed.

echo "=== Setting up Self-Signed HTTPS ==="

# 1. Create Directory for Certificates
echo "Creating SSL directory..."
sudo mkdir -p /etc/nginx/ssl

# 2. Generate Self-Signed Certificate
# -x509: Output a X.509 structure instead of a cert request
# -nodes: No password for the key
# -days 365: Valid for a year
# -newkey rsa:2048: New RSA key of 2048 bits
# -keyout: Save private key here
# -out: Save certificate here
# -subj: shortcuts the prompt for info
echo "Generating SSL Certificate..."
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/selfsigned.key \
    -out /etc/nginx/ssl/selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=YOUR_IP"

# 3. Create Nginx Configuration
# We will overwrite the existing config to support SSL
CONFIG_FILE="/etc/nginx/sites-available/toren_hazak"

echo "Configuring Nginx for HTTPS..."
sudo tee $CONFIG_FILE > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/nginx/ssl/selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/selfsigned.key;

    # Basic SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

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

# 4. Enable Site (Ensure link exists)
sudo ln -sf /etc/nginx/sites-available/toren_hazak /etc/nginx/sites-enabled/

# 5. Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx

echo "=== DONE ==="
echo "Your site is now available at: https://YOUR_SERVER_IP"
echo "IMPORTANT: Validating this certificate is impossible for browsers."
echo "You WILL see a 'Not Secure' or 'Connection Privacy' warning."
echo "You must click 'Advanced' -> 'Proceed to...' to view your site."
