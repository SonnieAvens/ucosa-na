#!/bin/bash
# Run once on a fresh DigitalOcean Ubuntu 22.04 Droplet
set -euo pipefail

DOMAIN="${1:-yourdomain.com}"
APP_DIR="/opt/ucosa-na"

echo "==> Updating system packages..."
apt-get update -y && apt-get upgrade -y

echo "==> Installing Docker..."
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

echo "==> Installing Nginx..."
apt-get install -y nginx

echo "==> Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx

echo "==> Creating Docker network..."
docker network create app-network || true

echo "==> Creating app directory..."
mkdir -p "$APP_DIR"
cat > "$APP_DIR/.env" <<EOF
NODE_ENV=production
PORT=3000
# Add your secrets below
EOF

echo "==> Copying Nginx config..."
cp "$(dirname "$0")/../nginx/nginx.conf" /etc/nginx/sites-available/ucosa-na
sed -i "s/yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/ucosa-na
ln -sf /etc/nginx/sites-available/ucosa-na /etc/nginx/sites-enabled/ucosa-na
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==> Obtaining SSL certificate for $DOMAIN..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
  --non-interactive --agree-tos --email "admin@$DOMAIN" \
  --redirect

echo "==> Setting up Certbot auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

echo ""
echo "==> Droplet setup complete!"
echo "    Now set GitHub Secrets and push to main to trigger deployment."
