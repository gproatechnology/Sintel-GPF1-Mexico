#!/bin/bash
# SSL Certificate Setup Script for Let's Encrypt
# Usage: ./scripts/ssl-setup.sh your-domain.com

set -e

DOMAIN=${1:-localhost}
SSL_DIR="./frontend/ssl"
WWW_DIR="./frontend/public"

echo "=== SSL Certificate Setup for $DOMAIN ==="

# Create directories
mkdir -p $SSL_DIR
mkdir -p $WWW_DIR

# Check if certbot is available
if command -v certbot &> /dev/null; then
    echo "Certbot found, generating certificate..."
    
    # Generate certificate
    certbot certonly --webroot -w $WWW_DIR \
        --agree-tos \
        --email admin@$DOMAIN \
        --renew-by-default \
        -d $DOMAIN \
        -d www.$DOMAIN
    
    # Copy certificates
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/cert.pem
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/key.pem
    
    echo "Certificates generated and copied to $SSL_DIR"
    
else
    echo "Certbot not found. Please install certbot or use Docker:"
    echo "  docker run -it --rm -v $(pwd)/frontend/ssl:/etc/nginx/ssl:rw \\"
    echo "    -v $(pwd)/frontend/public:/var/www/html:rw \\"
    echo "    certbot/certbot:latest certonly --webroot \\"
    echo "    -w /var/www/html --agree-tos --renew-by-default \\"
    echo "    -d $DOMAIN -d www.$DOMAIN"
    
    # Create self-signed certificate for testing
    echo "Creating self-signed certificate for testing..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout $SSL_DIR/key.pem \
        -out $SSL_DIR/cert.pem \
        -subj "/C=MX/ST=State/L=City/O=F1Comedor/CN=$DOMAIN"
    
    echo "Self-signed certificate created (for testing only)"
fi

# Set proper permissions
chmod 600 $SSL_DIR/key.pem
chmod 644 $SSL_DIR/cert.pem

echo "=== SSL Setup Complete ==="
echo "Certificate: $SSL_DIR/cert.pem"
echo "Key: $SSL_DIR/key.pem"
