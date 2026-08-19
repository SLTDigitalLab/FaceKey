# FaceKey - Production Deployment Guide (Linux VPS)

This guide provides step-by-step instructions for deploying **FaceKey** on an Ubuntu/Debian Linux VPS using **Nginx**, **Gunicorn**, **Systemd**, and **MySQL**.

---

## Prerequisites

Before starting, ensure your VPS has:
- **Ubuntu 22.04 LTS / 24.04 LTS** (or Debian 11/12)
- Root or `sudo` privileges
- A domain name pointing to your VPS IP address (e.g. `facekey.yourdomain.com`)

---

## Step 1: System Package Installation

Update system packages and install required software:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-venv python3-dev build-essential \
                    mysql-server nginx git curl software-properties-common certbot python3-certbot-nginx
```

Install Node.js 20 LTS (if not already installed):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## Step 2: MySQL Database Setup

1. Log into MySQL:
   ```bash
   sudo mysql
   ```

2. Create the database and user with a secure password:
   ```sql
   CREATE DATABASE facekey DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'facekey_user'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD_HERE';
   GRANT ALL PRIVILEGES ON facekey.* TO 'facekey_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

---

## Step 3: Clone Codebase & Setup Backend

1. Create application directory and clone project:
   ```bash
   sudo mkdir -p /var/www/facekey
   sudo chown -R $USER:$USER /var/www/facekey
   cd /var/www/facekey
   git clone <YOUR_GIT_REPOSITORY_URL> .
   ```

2. Create and activate Python virtual environment for backend:
   ```bash
   cd /var/www/facekey/backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install --upgrade pip
   pip install -r ../requirements.txt
   ```

3. Configure Environment Variables:
   ```bash
   cp /var/www/facekey/deployment/.env.production.example /var/www/facekey/backend/.env
   nano /var/www/facekey/backend/.env
   ```
   *Update `DB_USER`, `DB_PASS`, `DB_NAME`, `SUPER_ADMIN_PASSWORD`, and `BREVO_API_KEY` with actual values.*

4. Verify Backend Startup:
   ```bash
   python -m src.app.main
   ```
   *(Press Ctrl+C after verifying database connection and super admin bootstrapping).*

---

## Step 4: Build Frontend

1. Navigate to the `frontend` folder and install dependencies:
   ```bash
   cd /var/www/facekey/frontend
   npm install
   ```

2. Build static production assets:
   ```bash
   npm run build
   ```
   *This creates optimized static files in `/var/www/facekey/frontend/dist`.*

---

## Step 5: Configure Systemd Backend Service

1. Copy the provided service file to `/etc/systemd/system/`:
   ```bash
   sudo cp /var/www/facekey/deployment/facekey-backend.service /etc/systemd/system/facekey-backend.service
   ```

2. Create log directory for backend logs:
   ```bash
   sudo mkdir -p /var/log/facekey
   sudo chown -R www-data:www-data /var/log/facekey
   sudo chown -R www-data:www-data /var/www/facekey
   ```

3. Enable and start the systemd service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable facekey-backend
   sudo systemctl start facekey-backend
   sudo systemctl status facekey-backend
   ```

---

## Step 6: Configure Nginx & SSL Certificate

1. Copy Nginx site configuration:
   ```bash
   sudo cp /var/www/facekey/deployment/nginx.conf /etc/nginx/sites-available/facekey
   ```

2. Edit domain name in Nginx configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/facekey
   ```
   *Replace `yourdomain.com` with your actual domain or VPS IP.*

3. Enable Nginx site and restart service:
   ```bash
   sudo ln -s /etc/nginx/sites-available/facekey /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. Install SSL Certificate (Let's Encrypt):
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## Step 7: Firewall & Security Configuration

Configure UFW firewall to allow HTTP, HTTPS, and SSH traffic:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Maintenance Commands

- **Check Backend Logs**:
  ```bash
  sudo journalctl -u facekey-backend -f
  ```
- **Restart Backend Service**:
  ```bash
  sudo systemctl restart facekey-backend
  ```
- **Rebuild Frontend after update**:
  ```bash
  cd /var/www/facekey/frontend && npm run build
  ```
