#!/bin/bash
echo "=== FORCE FIXING NGINX ==="

# 1. Clean up existing configs
echo "Removing old configurations..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/toren_hazak

# 2. Write NEW Config (Review: Port 5000)
echo "Writing new config (Port 5000)..."
sudo tee /etc/nginx/sites-available/toren_hazak > /dev/null <<EOF
server {
    listen 80;
    server_name _; 

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

# 3. Link it
sudo ln -sf /etc/nginx/sites-available/toren_hazak /etc/nginx/sites-enabled/

# 4. Show what we wrote (Verification)
echo "--------------------------------"
cat /etc/nginx/sites-available/toren_hazak
echo "--------------------------------"

# 5. Restart
echo "Restarting Nginx..."
sudo systemctl restart nginx

echo "DONE. Nginx is now pointing to 127.0.0.1:5000."
