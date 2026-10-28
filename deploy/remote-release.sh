#!/usr/bin/env bash
# Runs ON the VM as the deploy user after a release tarball is uploaded.
# First run: creates DB + user, production .env files, seeds the catalogue and the admin account.
set -euo pipefail
APP_DIR="$1"; DOMAIN="$2"; ADMIN_EMAIL="$3"
cd "$APP_DIR"
tar -xzf /tmp/madhuri-release.tgz -C "$APP_DIR"
rm /tmp/madhuri-release.tgz

FIRST_RUN=0
if [ ! -f backend/.env ]; then
  FIRST_RUN=1
  DB_PASS=$(openssl rand -hex 16)
  JWT=$(openssl rand -hex 32)
  ADMIN_PASS="Ms$(openssl rand -hex 6)!"
  sudo mysql -e "CREATE DATABASE IF NOT EXISTS madhuri_sarees CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE USER IF NOT EXISTS 'madhuri'@'localhost' IDENTIFIED BY '$DB_PASS';
    ALTER USER 'madhuri'@'localhost' IDENTIFIED BY '$DB_PASS';
    GRANT ALL ON madhuri_sarees.* TO 'madhuri'@'localhost'; FLUSH PRIVILEGES;"
  # Start from the uploaded local .env (carries Razorpay keys), then override server-specific values.
  cp /tmp/madhuri-backend.env backend/.env
  set_env() { if grep -q "^$1=" backend/.env; then sed -i "s|^$1=.*|$1=$2|" backend/.env; else echo "$1=$2" >> backend/.env; fi; }
  set_env NODE_ENV production
  set_env PORT 5050
  set_env CLIENT_URL "https://$DOMAIN,https://www.$DOMAIN"
  set_env DB_HOST localhost
  set_env DB_USER madhuri
  set_env DB_PASSWORD "$DB_PASS"
  set_env DB_NAME madhuri_sarees
  set_env JWT_SECRET "$JWT"
  set_env ADMIN_EMAIL "$ADMIN_EMAIL"
  set_env ADMIN_PASSWORD "$ADMIN_PASS"
  chmod 600 backend/.env
fi
rm -f /tmp/madhuri-backend.env

cat > frontend/.env.production.local <<ENV
NEXT_PUBLIC_API_URL=https://$DOMAIN
NEXT_PUBLIC_SITE_URL=https://$DOMAIN
INTERNAL_API_URL=http://127.0.0.1:5050
ENV

(cd backend && npm ci --omit=dev)
if [ "$FIRST_RUN" = 1 ]; then (cd backend && npm run db:seed); fi
(cd frontend && npm ci && npm run build)

pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save
if [ "$FIRST_RUN" = 1 ]; then
  sudo env PATH="$PATH" pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null
  echo "=================================================="
  echo " ADMIN LOGIN  →  https://$DOMAIN/admin"
  echo " Email:    $ADMIN_EMAIL"
  echo " Password: $ADMIN_PASS"
  echo " (shown once — save it now and change it later)"
  echo "=================================================="
fi
