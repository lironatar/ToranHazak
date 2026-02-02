#!/bin/bash

# Linux Deployment Script for TorenHazak
# Usage: ./deploy.sh

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting Deployment ===${NC}"

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js (v18+) and npm before running this script."
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node -v)${NC}"

# 2. Install PM2 (Process Manager) globally if not present
if ! command -v pm2 &> /dev/null; then
    echo -e "${BLUE}Installing PM2 globally...${NC}"
    # Try with sudo if not root, otherwise regular
    if [ "$EUID" -ne 0 ]; then
        sudo npm install -g pm2
    else
        npm install -g pm2
    fi
fi
echo -e "${GREEN}✓ PM2 is ready${NC}"

# 3. Setup Frontend
echo -e "${BLUE}--- Setting up Frontend ---${NC}"
cd frontend
if [ ! -d "node_modules" ] || [ "$1" == "clean" ]; then
    echo "Installing Frontend Dependencies..."
    npm install
fi

echo "Building Frontend..."
npm run build
cd ..

# 4. Setup Backend
echo -e "${BLUE}--- Setting up Backend ---${NC}"
cd backend
if [ ! -d "node_modules" ] || [ "$1" == "clean" ]; then
    echo "Installing Backend Dependencies..."
    npm install
fi

# 5. Start/Restart Application
echo -e "${BLUE}--- Starting Application ---${NC}"
# Check if already running
if pm2 list | grep -q "toren-hazak-server"; then
    echo "Restarting server..."
    pm2 restart toren-hazak-server
else
    echo "Starting server..."
    pm2 start server.js --name "toren-hazak-server"
    pm2 save
fi

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo "App should be running on port 5000 (unless configured otherwise)."
