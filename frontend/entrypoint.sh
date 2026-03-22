#!/bin/sh
# Entrypoint script for frontend container
# Replaces API URL placeholder with actual value

set -e

# Replace placeholder with actual API URL
if [ -n "$VITE_API_URL" ]; then
    echo "Configuring API proxy to: $VITE_API_URL"
    sed -i "s|__API_URL__|$VITE_API_URL|g" /etc/nginx/conf.d/default.conf
fi

# Start nginx
exec nginx -g 'daemon off;'
