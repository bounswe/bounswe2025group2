#!/bin/bash

# Generate self-signed SSL certificate for GenFit
# This creates a simple HTTPS setup for IP-based access

echo "🔒 Generating self-signed SSL certificate for GenFit..."

# Create SSL directory if it doesn't exist
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/nginx.key 2048

# Generate certificate signing request and certificate
openssl req -new -x509 -key ssl/nginx.key -out ssl/nginx.crt -days 365 -subj "/C=US/ST=State/L=City/O=GenFit/CN=genfit-app"

echo "✅ SSL certificate generated successfully!"
echo "📁 Files created:"
echo "   - ssl/nginx.key (private key)"
echo "   - ssl/nginx.crt (certificate)"
echo ""
echo "🚀 You can now run: docker-compose -f docker-compose.prod.yml up -d"
echo "🌐 Your app will be available at: https://YOUR_SERVER_IP"
echo ""
echo "⚠️  Note: Browsers will show a security warning for self-signed certificates."
echo "   Click 'Advanced' and 'Proceed to site' to continue."
