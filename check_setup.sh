#!/bin/bash

# check_setup.sh
# Verifies that TorenHazak is running and HTTPS is configured correctly.

echo "=== TorenHazak System Check ==="

# 1. Check Node.js Backend (Port 5000)
echo -n "Checking Backend (Port 5000)... "
if netstat -tuln | grep -q ":5000"; then
    echo "✅ RUNNING"
else
    echo "❌ NOT RUNNING"
    echo "  -> Run './restart.sh' to start the application."
fi

# 2. Check Nginx (Web Server)
echo -n "Checking Nginx Service...       "
if systemctl is-active --quiet nginx; then
    echo "✅ ACTIVE"
else
    echo "❌ INACTIVE"
    echo "  -> Run 'sudo systemctl start nginx'"
fi

# 3. Check HTTPS Configuration
CONFIG_FILE="/etc/nginx/sites-enabled/toren_hazak"
echo -n "Checking HTTPS Config...        "

if [ -f "$CONFIG_FILE" ]; then
    if grep -q "ssl_certificate" "$CONFIG_FILE"; then
        echo "✅ FOUND"
        
        # Extract the domain name
        DOMAIN=$(grep "server_name" "$CONFIG_FILE" | head -n 1 | awk '{print $2}' | sed 's/;//')
        echo "  -> Domain detected: $DOMAIN"
        echo "  -> You should be able to visit: https://$DOMAIN"
    else
        echo "⚠️  MISSING SSL"
        echo "  -> Nginx is configured, but SSL/HTTPS lines are missing."
        echo "  -> Did you run './setup_free_real_https.sh'?"
    fi
else
    echo "❌ MISSING CONFIG"
    echo "  -> The Nginx config file $CONFIG_FILE does not exist."
fi

echo "==============================="
echo "If all checks passed with ✅, your site is good to go!"
echo "If you see errors, run the suggested commands."
