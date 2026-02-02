#!/bin/bash
echo "=== HUNTING FOR PORT 8000 ==="

echo "Searching /etc/nginx for '8000':"
sudo grep -rn "8000" /etc/nginx/

echo "--------------------------------"
echo "If you see a file listed above (like /etc/nginx/sites-enabled/default), that is the culprit."
echo "Running the fixes..."

# Re-run the fix just in case
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
echo "Tried removing 'default'. Check if it works now."
