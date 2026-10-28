#!/usr/bin/env bash
# Runs ON the VM (Ubuntu 24.04) as root: Node 22, MySQL, Nginx, Certbot, PM2, swap.
set -euo pipefail
APP_DIR="${APP_DIR:-/opt/madhuri}"
export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y ca-certificates curl gnupg nginx mysql-server certbot python3-certbot-nginx
if ! command -v node >/dev/null || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
npm install -g pm2

# 2 GB swap so `next build` doesn't run out of memory on small machines
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

systemctl enable --now mysql nginx

# Oracle Cloud images ship iptables rules that only allow SSH — open HTTP/HTTPS and persist
if [ -f /etc/iptables/rules.v4 ]; then
  for port in 80 443; do
    iptables -C INPUT -p tcp --dport $port -m state --state NEW -j ACCEPT 2>/dev/null || \
      iptables -I INPUT 6 -p tcp --dport $port -m state --state NEW -j ACCEPT
  done
  netfilter-persistent save
fi

mkdir -p "$APP_DIR"
chown -R "${SUDO_USER:-$(logname 2>/dev/null || echo root)}": "$APP_DIR"

# Daily MySQL backup kept for 14 days
mkdir -p /var/backups/madhuri
cat > /etc/cron.daily/madhuri-db-backup <<'CRON'
#!/bin/sh
mysqldump --single-transaction madhuri_sarees | gzip > /var/backups/madhuri/db-$(date +\%F).sql.gz
find /var/backups/madhuri -name 'db-*.sql.gz' -mtime +14 -delete
CRON
chmod +x /etc/cron.daily/madhuri-db-backup
echo "server setup complete"
