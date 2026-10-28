#!/usr/bin/env bash
# One-time: installs the server stack on a freshly created VM (Oracle Cloud Ubuntu 24.04).
set -euo pipefail
cd "$(dirname "$0")/.."
source deploy/config.sh

upload deploy/server-setup.sh "$SSH_USER@$SERVER_IP":/tmp/server-setup.sh
remote "sudo APP_DIR=$APP_DIR bash /tmp/server-setup.sh"

echo
echo "✓ Server ready at $SERVER_IP"
if [[ "$DOMAIN" == *.sslip.io ]]; then
  echo "  No DOMAIN set — the site will use $DOMAIN. Run ./deploy/deploy.sh --ssl"
else
  echo "  Point DNS for $DOMAIN and www.$DOMAIN (A records) to $SERVER_IP, then run ./deploy/deploy.sh --ssl"
fi
