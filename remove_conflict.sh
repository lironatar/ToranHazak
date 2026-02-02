#!/bin/bash
echo "=== REMOVING CONFLICTING CONFIG (todofast) ==="

echo "Removing /etc/nginx/sites-enabled/todofast..."
sudo rm -f /etc/nginx/sites-enabled/todofast

echo "Restarting Nginx..."
sudo systemctl restart nginx

echo "Done. Try accessing the site now."
