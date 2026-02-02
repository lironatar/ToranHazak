#!/bin/bash

# Force Stop & Delete existing PM2 process
echo "Stopping existing instance..."
pm2 stop toren-hazak-server 2>/dev/null || true
pm2 delete toren-hazak-server 2>/dev/null || true

# --- GIT SYNC ---
echo "Syncing with repository..."

# 1. Point the server to the correct repository
git remote set-url origin https://github.com/lironatar/ToranHazak.git

# 2. Fetch the latest code
git fetch origin

# 3. FORCE reset the server to match your latest push
git reset --hard origin/main

# 4. Make your new scripts executable
chmod +x deploy.sh restart.sh

# Run the main deployment script
echo "Running deploy.sh..."
./deploy.sh
