#!/bin/bash

# Setup Nginx Proxy for TorenHazak
# Redirects Port 80 -> Port 5000

echo "Installing Nginx..."
sudo apt-get update
sudo apt-get install -y nginx

echo "Configuring Nginx..."

# Create Nginx Config
# We use a heredoc to write the config file directly
sudo tee /etc/nginx/sites-available/toren_hazak > /dev/null <<EOF
server {
    listen 80;
    server_name _; # Responds to IP address and all domains

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
echo "Enabling site..."
sudo ln -sf /etc/nginx/sites-available/toren_hazak /etc/nginx/sites-enabled/

# Remove default site if it exists to avoid conflicts
sudo rm -f /etc/nginx/sites-enabled/default

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx

echo "Done! You can now access the site at http://YOUR_SERVER_IP (without :5000)"
