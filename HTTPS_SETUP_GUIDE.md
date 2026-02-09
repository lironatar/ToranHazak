# HTTPS Setup Checklist (Free, Real SSL)

Follow these steps in order to enable secure HTTPS for your application.

## Prerequisites
- [ ] **Application is Running**: verify your app is running on port 5000.
    ```bash
    pm2 status
    # If not running:
    # pm2 start backend/server.js --name "toren-hazak-server"
    ```

## Installation Steps

### 1. Upload the Script
- [ ] Upload `setup_free_real_https.sh` to your server (e.g., to `/root/` or `~/`).
    *   *Tip: You can drag and drop it if using an SFTP client (like FileZilla or MobaXterm), or copy-paste the content into a new file on the server.*

### 2. Prepare the Script
- [ ] Connect to your server via SSH.
- [ ] Navigate to the folder where you uploaded the script.
- [ ] Make the script executable:
    ```bash
    chmod +x setup_free_real_https.sh
    ```

### 3. Run the Setup
- [ ] Execute the script:
    ```bash
    ./setup_free_real_https.sh
    ```
- [ ] **Follow the prompts**:
    1.  Confirm your IP address (Press `Y`).
    2.  Enter your email for Let's Encrypt (required for checking expiration).
    3.  Agree to Terms of Service (`A`).
    4.  (Optional) Share email (`N`).

### 4. Verification
- [ ] The script will output a URL like: `https://123.45.67.89.sslip.io`
- [ ] Click that link or paste it into your browser.
- [ ] **Check for the Lock Icon**: You should see a secure padlock next to the URL, meaning HTTPS is working!

## Troubleshooting
If it fails:
- Ensure **Port 80** and **Port 443** are open in your server's firewall (Kamatera/AWS/UFW).
    ```bash
    sudo ufw allow 80
    sudo ufw allow 443
    ```
