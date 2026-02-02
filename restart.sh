#!/bin/bash

# Force Stop & Delete existing PM2 process
echo "Stopping existing instance..."
pm2 stop toren-hazak-server 2>/dev/null || true
pm2 delete toren-hazak-server 2>/dev/null || true

# Run the main deployment script
echo "Running deploy.sh..."
./deploy.sh
