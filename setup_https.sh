#!/bin/bash

# setup_https.sh
# Automates the setup of HTTPS using Let's Encrypt and Certbot for Nginx

echo "=== HTTPS Setup for TorenHazak ==="

# 1. Check for Domain Name
if [ -z "$1" ]; then
    echo "This script requires a valid Domain Name (e.g., example.com) that points to this server."
    echo "Usage: ./setup_https.sh <your-domain.com>"
    read -p "Enter your domain name now: " DOMAIN
else
    DOMAIN=$1
fi

if [ -z "$DOMAIN" ]; then
    echo "Error: No domain provided. Exiting."
    exit 1
fi

echo "Setting up HTTPS for: $DOMAIN"

# 2. Update System & Install Certbot
echo "Installing Certbot..."
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# 3. Update Nginx Config with Domain
# Certbot needs the correct server_name to work
echo "Updating Nginx server_name..."

CONFIG_FILE="/etc/nginx/sites-available/toren_hazak"

# Check if file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Nginx config file $CONFIG_FILE not found!"
    exit 1
fi

# Replace 'server_name _;' or existing server_name with the new domain
# We will overwrite the specific line to be safe
# Using sed to replace the line containing 'server_name'
sudo sed -i "s/server_name .*/server_name $DOMAIN;/" "$CONFIG_FILE"

# Reload Nginx to apply changes
sudo systemctl reload nginx

# 4. Run Certbot
echo "Running Certbot..."
# --nginx: Use the Nginx plugin
# --non-interactive: Run without user input (requires --agree-tos and -m email)
# But for first time run, interactive is usually better so user can provide email. 
# We'll use interactive mode but auto-select nginx options where possible.

sudo certbot --nginx -d "$DOMAIN"

# Check if Certbot succeeded
if [ $? -eq 0 ]; then
    echo "=== SUCCESS! ==="
    echo "HTTPS should now be enabled for https://$DOMAIN"
else
    echo "=== ERROR ==="
    echo "Certbot failed. Please check the error message above."
    echo "Make sure your DNS settings are correct and $DOMAIN points to this server's IP."
fi
