# Deployment settings — edit before running ./deploy/server-create.sh
SERVER_IP="${SERVER_IP:-}"            # public IP of the Oracle Cloud VM
SSH_USER="${SSH_USER:-ubuntu}"        # default user on Oracle's Ubuntu images
SSH_KEY="${SSH_KEY:-$HOME/.ssh/oracle_madhuri.key}"   # private key downloaded when creating the VM

DOMAIN="${DOMAIN:-}"                  # e.g. madhurisarees.com (without www); leave empty to use <ip>.sslip.io
ADMIN_EMAIL_PROD="${ADMIN_EMAIL_PROD:-admin@madhurisarees.com}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-$ADMIN_EMAIL_PROD}"

APP_DIR="/opt/madhuri"

: "${SERVER_IP:?Set SERVER_IP in deploy/config.sh}"
DOMAIN="${DOMAIN:-$SERVER_IP.sslip.io}"
SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new)
remote() { ssh "${SSH_OPTS[@]}" "$SSH_USER@$SERVER_IP" "$@"; }
upload() { scp "${SSH_OPTS[@]}" "$@"; }
