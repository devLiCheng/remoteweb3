#!/bin/bash
# RemoteWeb3 - One-Click Ubuntu Deployment Script
# Usage: chmod +x deploy.sh && ./deploy.sh

set -e

echo "=========================================="
echo "  RemoteWeb3 - Deployment Script"
echo "  remoteweb3.com"
echo "=========================================="
echo ""

# ==========================================
# Configuration - MODIFY THESE
# ==========================================
DB_PASSWORD="${DB_PASSWORD:-root}"
DB_NAME="${DB_NAME:-remoteweb3}"
DOMAIN="${DOMAIN:-remoteweb3.com}"
APP_DIR="/var/www/remoteweb3"

# ==========================================
# 1. System Update & Dependencies
# ==========================================
echo "[1/7] Installing system dependencies..."
sudo apt update -y && sudo apt upgrade -y
sudo apt install -y curl unzip nginx mysql-server certbot python3-certbot-nginx

# Install Bun
if ! command -v bun &> /dev/null; then
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    source /root/.bashrc
    source /home/$USER/.bashrc 2>/dev/null || true
fi

# Install Node.js (for npm if needed)
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "[✓] System dependencies installed."

# ==========================================
# 2. MySQL Setup
# ==========================================
echo "[2/7] Setting up MySQL..."
sudo systemctl start mysql || sudo systemctl start mysqld
sudo systemctl enable mysql || sudo systemctl enable mysqld

# Create database and user
sudo mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';" 2>/dev/null || true
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASSWORD}';" 2>/dev/null || true
sudo mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO 'root'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "[✓] MySQL configured."

# ==========================================
# 3. Application Setup
# ==========================================
echo "[3/7] Setting up application..."

# Create app directory
sudo mkdir -p ${APP_DIR}

# Clone or copy files
if [ -d "./backend" ]; then
    echo "Copying local files..."
    sudo cp -r ./* ${APP_DIR}/
else
    echo "Cloning from GitHub..."
    sudo rm -rf ${APP_DIR}/*
    git clone https://github.com/YOUR_USERNAME/remoteweb3.git ${APP_DIR}
fi

sudo chown -R $USER:$USER ${APP_DIR}

# Initialize database
echo "[4/7] Initializing database..."
cd ${APP_DIR}/backend
cp .env.example .env 2>/dev/null || true
cat > .env << 'ENVEOF'
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=remoteweb3
PORT=3000
ENVEOF

# Run SQL init
echo "Running database migrations..."
sudo mysql ${DB_NAME} < src/db/init.sql 2>/dev/null || echo "SQL init completed (some tables may already exist)"

echo "[✓] Database initialized."

# ==========================================
# 4. Install Dependencies & Build
# ==========================================
echo "[5/7] Installing dependencies..."

# Backend
cd ${APP_DIR}/backend
bun install --production

# Frontend
cd ${APP_DIR}/frontend
bun install
bun run build

echo "[✓] Dependencies installed and built."

# ==========================================
# 5. PM2 Setup (Process Manager)
# ==========================================
echo "[6/7] Setting up process manager..."

# Install PM2
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Start backend
cd ${APP_DIR}/backend
pm2 delete remoteweb3-backend 2>/dev/null || true
pm2 start bun --name remoteweb3-backend -- run src/index.ts
pm2 save
pm2 startup systemd -u $USER --hp /home/$USER

echo "[✓] PM2 configured."

# ==========================================
# 6. Nginx Configuration
# ==========================================
echo "[7/7] Configuring Nginx..."

sudo tee /etc/nginx/sites-available/remoteweb3 > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name remoteweb3.com www.remoteweb3.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name remoteweb3.com www.remoteweb3.com;

    ssl_certificate /etc/letsencrypt/live/remoteweb3.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/remoteweb3.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip
    gzip on;
    gzip_types text/css text/javascript application/javascript application/json image/svg+xml;
    gzip_min_length 256;
    gzip_comp_level 6;
    gzip_vary on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Frontend static files
    root /var/www/remoteweb3/frontend/dist;
    index index.html;

    # Cache static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/remoteweb3 /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# SSL Certificate (Let's Encrypt)
echo "Obtaining SSL certificate..."
sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN} || echo "SSL: Run manually: sudo certbot --nginx"

echo "[✓] Nginx configured."

# ==========================================
# Done
# ==========================================
echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo "  Website: https://${DOMAIN}"
echo "  API:     https://${DOMAIN}/api/health"
echo "  Backend: pm2 status remoteweb3-backend"
echo ""
echo "  To update:"
echo "    cd ${APP_DIR} && git pull"
echo "    cd backend && bun install"
echo "    cd ../frontend && bun install && bun run build"
echo "    pm2 restart remoteweb3-backend"
echo "=========================================="
