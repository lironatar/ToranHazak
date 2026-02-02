#!/bin/bash
echo "=== Debugging Nginx & App Connection ==="

echo "1. Checking App Status (PM2)..."
pm2 list

echo -e "\n2. Checking Open Ports..."
sudo netstat -tlpn | grep 5000

echo -e "\n3. Testing Local Connection (curl)..."
curl -I http://127.0.0.1:5000
curl -I http://localhost:5000

echo -e "\n4. Nginx Configuration Check..."
sudo nginx -t

echo -e "\n5. Nginx Error Log (Last 10 lines)..."
sudo tail -n 10 /var/log/nginx/error.log
