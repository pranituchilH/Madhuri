#!/usr/bin/env bash
# Builds a release from this folder and ships it to the VM. Safe to re-run for every update.
#   ./deploy/deploy.sh          -> deploy code
#   ./deploy/deploy.sh --ssl    -> also (re)issue the HTTPS certificate (run once DNS points to the VM)
set -euo pipefail
cd "$(dirname "$0")/.."
source deploy/config.sh

TMP=$(mktemp -d)
echo "→ Packaging release"
# Admin-uploaded images on the server are never overwritten (only seed images are shipped).
tar -czf "$TMP/madhuri-release.tgz" \
  --exclude node_modules --exclude .next --exclude '.env' --exclude '.env.local' --exclude '.env.production.local' \
  --exclude 'backend/uploads/products/upload-*' --exclude .DS_Store \
  backend frontend deploy

echo "→ Uploading"
upload "$TMP/madhuri-release.tgz" "$SSH_USER@$SERVER_IP":/tmp/madhuri-release.tgz
upload backend/.env "$SSH_USER@$SERVER_IP":/tmp/madhuri-backend.env
rm -rf "$TMP"

echo "→ Installing & building on server (takes a few minutes)"
remote "bash -lc 'tar -xzf /tmp/madhuri-release.tgz -C $APP_DIR deploy/remote-release.sh && bash $APP_DIR/deploy/remote-release.sh $APP_DIR $DOMAIN $ADMIN_EMAIL_PROD'"

echo "→ Configuring Nginx"
remote "sed 's/__DOMAIN__/$DOMAIN/g' $APP_DIR/deploy/nginx.conf.template | sudo tee /etc/nginx/sites-available/madhuri >/dev/null \
  && sudo ln -sf /etc/nginx/sites-available/madhuri /etc/nginx/sites-enabled/madhuri && sudo rm -f /etc/nginx/sites-enabled/default \
  && sudo nginx -t && sudo systemctl reload nginx"

if [[ "${1:-}" == "--ssl" ]]; then
  echo "→ Issuing HTTPS certificate"
  remote "sudo certbot --nginx --non-interactive --agree-tos --redirect -m $LETSENCRYPT_EMAIL -d $DOMAIN -d www.$DOMAIN"
fi

echo "✓ Deployed → https://$DOMAIN"
