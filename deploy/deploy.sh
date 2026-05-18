#!/bin/bash
# ============================================================
# RemoteWeb3 - One-Click Ubuntu Deployment Script
# For Ubuntu 22.04/24.04 fresh server
# Usage: chmod +x deploy.sh && sudo ./deploy.sh
# ============================================================
set -e

# ============================================================
# Configuration
# ============================================================
DB_PASSWORD="${DB_PASSWORD:-remoteweb3_2026}"
DB_NAME="${DB_NAME:-remoteweb3}"
DB_ADMIN_NAME="${DB_ADMIN_NAME:-remoteweb3Admin}"
DOMAIN="${DOMAIN:-remoteweb3.com}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.remoteweb3.com}"
APP_DIR="/var/www/remoteweb3"
GITHUB_REPO="https://github.com/devLiCheng/remoteweb3.git"
CERT_EMAIL="819812520@qq.com"
BUN_PATH="/root/.bun/bin"

echo "=========================================="
echo "  RemoteWeb3 - Full Deployment"
echo "  ${DOMAIN}"
echo "=========================================="
echo ""

# ============================================================
# 1. System Update & Install Dependencies
# ============================================================
echo "[1/8] Installing system dependencies..."

export DEBIAN_FRONTEND=noninteractive
sudo apt update -y
sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl unzip nginx certbot python3-certbot-nginx git ufw

# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo "  [OK] System packages installed."

# Install Bun
if ! command -v bun &> /dev/null && [ ! -f "${BUN_PATH}/bun" ]; then
    echo "  Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="${BUN_PATH}:$PATH"
    # Add to .bashrc for persistence
    grep -q "bun" /root/.bashrc 2>/dev/null || echo "export PATH=\"${BUN_PATH}:\$PATH\"" >> /root/.bashrc
    grep -q "bun" /home/$SUDO_USER/.bashrc 2>/dev/null || echo "export PATH=\"${BUN_PATH}:\$PATH\"" >> /home/$SUDO_USER/.bashrc
fi

# Ensure bun is in PATH
if [ -f "${BUN_PATH}/bun" ]; then
    export PATH="${BUN_PATH}:$PATH"
fi

echo "  [OK] Bun: $(bun --version 2>/dev/null || echo 'will use npx')"

# Install Node.js (for PM2/npm)
if ! command -v node &> /dev/null; then
    echo "  Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "  [OK] Node: $(node --version 2>/dev/null || echo 'installed')"

# ============================================================
# 2. MySQL Setup
# ============================================================
echo "[2/8] Installing and configuring MySQL..."

sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# Configure root password and auth
sudo mysql <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASSWORD}';
FLUSH PRIVILEGES;
SQL

# Create databases
sudo mysql -u root -p"${DB_PASSWORD}" <<SQL
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS ${DB_ADMIN_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO 'root'@'localhost';
GRANT ALL PRIVILEGES ON ${DB_ADMIN_NAME}.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
SQL

echo "  [OK] MySQL configured."

# ============================================================
# 3. Clone Application from GitHub
# ============================================================
echo "[3/8] Cloning application from GitHub..."

sudo mkdir -p ${APP_DIR}
sudo rm -rf ${APP_DIR}/* ${APP_DIR}/.git 2>/dev/null || true
git clone ${GITHUB_REPO} ${APP_DIR}
sudo chown -R $SUDO_USER:$SUDO_USER ${APP_DIR}

echo "  [OK] Code cloned to ${APP_DIR}"

# ============================================================
# 4. Initialize Database Schema
# ============================================================
echo "[4/8] Initializing database tables..."

cd ${APP_DIR}

# Main database
sudo mysql -u root -p"${DB_PASSWORD}" ${DB_NAME} < backend/src/db/init.sql 2>/dev/null
echo "  [OK] Main database (${DB_NAME}) initialized."

# Admin database (same schema)
sudo mysql -u root -p"${DB_PASSWORD}" ${DB_ADMIN_NAME} < backend/src/db/init.sql 2>/dev/null
echo "  [OK] Admin database (${DB_ADMIN_NAME}) initialized."

# ============================================================
# 5. Backend Setup (.env + deps)
# ============================================================
echo "[5/8] Setting up backend..."

cd ${APP_DIR}/backend

# Create .env file
cat > .env << ENVEOF
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
PORT=3000
ENVEOF

bun install --production

echo "  [OK] Backend dependencies installed."

# ============================================================
# 6. Frontend Build
# ============================================================
echo "[6/8] Building frontend..."

cd ${APP_DIR}/frontend
bun install
bun run build

echo "  [OK] Frontend built."

# ============================================================
# 6b. Admin Panel Build
# ============================================================
echo "[6b/8] Building admin panel..."

cd ${APP_DIR}/admin
bun install
bun run build

echo "  [OK] Admin panel built."

# ============================================================
# 7. PM2 Process Manager
# ============================================================
echo "[7/8] Setting up PM2..."

if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

cd ${APP_DIR}/backend
pm2 delete remoteweb3-backend 2>/dev/null || true
pm2 start bun --name remoteweb3-backend -- run src/index.ts
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER || pm2 startup

echo "  [OK] PM2 configured. Backend running."

# ============================================================
# 8. Nginx Configuration (HTTP first, then SSL)
# ============================================================
echo "[8/8] Configuring Nginx..."

# ---- Step A: HTTP-only config (needed for SSL verification) ----
sudo tee /etc/nginx/sites-available/remoteweb3 > /dev/null << 'NGINXHTTP'
# HTTP server - used during SSL certificate verification
server {
    listen 80;
    server_name remoteweb3.com www.remoteweb3.com;
    
    root /var/www/remoteweb3/frontend/dist;
    index index.html;

    location /.well-known/acme-challenge/ {
        root /var/www/remoteweb3/frontend/dist;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin HTTP
server {
    listen 80;
    server_name admin.remoteweb3.com;
    
    root /var/www/remoteweb3/admin/dist;
    index index.html;

    location /.well-known/acme-challenge/ {
        root /var/www/remoteweb3/admin/dist;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXHTTP

sudo ln -sf /etc/nginx/sites-available/remoteweb3 /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo "  [OK] HTTP Nginx configured."

# ---- Step B: Obtain SSL Certificates ----
echo "  Obtaining SSL certificates..."

# Get cert for main domain
sudo certbot --nginx \
    -d ${DOMAIN} -d www.${DOMAIN} \
    --non-interactive --agree-tos \
    --email ${CERT_EMAIL} \
    --redirect 2>/dev/null || echo "  [WARN] SSL for ${DOMAIN} - run manually: sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"

# Get cert for admin subdomain
sudo certbot --nginx \
    -d ${ADMIN_DOMAIN} \
    --non-interactive --agree-tos \
    --email ${CERT_EMAIL} \
    --redirect 2>/dev/null || echo "  [WARN] SSL for ${ADMIN_DOMAIN} - run manually: sudo certbot --nginx -d ${ADMIN_DOMAIN}"

echo "  [OK] SSL certificates obtained."

# ---- Step C: Final Nginx with HTTPS ----
sudo tee /etc/nginx/sites-available/remoteweb3 > /dev/null << 'NGINXHTTPS'
# Main site - HTTPS
server {
    listen 443 ssl http2;
    server_name remoteweb3.com www.remoteweb3.com;

    ssl_certificate /etc/letsencrypt/live/remoteweb3.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/remoteweb3.com/privkey.pem;
    
    # Modern SSL config
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types text/plain text/css text/javascript application/javascript application/json image/svg+xml application/xml;

    root /var/www/remoteweb3/frontend/dist;
    index index.html;

    # Static assets - long cache
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
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
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name remoteweb3.com www.remoteweb3.com;
    return 301 https://$host$request_uri;
}

# Admin panel - HTTPS
server {
    listen 443 ssl http2;
    server_name admin.remoteweb3.com;

    ssl_certificate /etc/letsencrypt/live/admin.remoteweb3.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.remoteweb3.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types text/plain text/css text/javascript application/javascript application/json image/svg+xml;

    root /var/www/remoteweb3/admin/dist;
    index index.html;

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

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
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}

# Admin HTTP -> HTTPS redirect
server {
    listen 80;
    server_name admin.remoteweb3.com;
    return 301 https://$host$request_uri;
}
NGINXHTTPS

sudo nginx -t && sudo systemctl reload nginx

echo "  [OK] Nginx configured with HTTPS."

# ============================================================
# Done
# ============================================================
echo ""
echo "=========================================="
echo "  DEPLOYMENT COMPLETE"
echo "=========================================="
echo "  Website:  https://${DOMAIN}"
echo "  Admin:    https://${ADMIN_DOMAIN}"
echo "  API:      https://${DOMAIN}/api/health"
echo ""
echo "  Status:   pm2 status"
echo "  Logs:     pm2 logs remoteweb3-backend"
echo ""
echo "  To update:"
echo "    cd ${APP_DIR} && git pull"
echo "    cd backend  && bun install && pm2 restart remoteweb3-backend"
echo "    cd frontend && bun install && bun run build"
echo "    cd ../admin  && bun install && bun run build"
echo "=========================================="
