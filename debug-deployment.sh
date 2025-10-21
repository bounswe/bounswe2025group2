#!/bin/bash

echo "🔍 GenFit HTTPS Deployment Debug Script"
echo "========================================"

echo ""
echo "📊 Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🔗 Network Status:"
docker network ls | grep genfit

echo ""
echo "🔧 Port Check (Host Level):"
echo "Checking if ports 80 and 443 are listening on host..."
netstat -tlnp | grep -E ':80|:443' || echo "❌ No processes listening on ports 80/443"

echo ""
echo "🔧 Docker Port Mapping Check:"
echo "Checking Docker port mappings..."
docker port $(docker-compose -f docker-compose.prod.yml ps -q nginx) 2>/dev/null || echo "❌ Nginx container not running or no port mappings"

echo ""
echo "📋 Nginx Container Logs (last 30 lines):"
docker-compose -f docker-compose.prod.yml logs --tail=30 nginx

echo ""
echo "🧪 Internal Connectivity Test:"
echo "Testing if nginx can reach frontend and backend..."
docker-compose -f docker-compose.prod.yml exec nginx wget -q --spider http://frontend:80 && echo "✅ Nginx -> Frontend: OK" || echo "❌ Nginx -> Frontend: FAILED"
docker-compose -f docker-compose.prod.yml exec nginx wget -q --spider http://backend:8000 && echo "✅ Nginx -> Backend: OK" || echo "❌ Nginx -> Backend: FAILED"

echo ""
echo "📋 Frontend Container Logs (last 15 lines):"
docker-compose -f docker-compose.prod.yml logs --tail=15 frontend

echo ""
echo "📋 Backend Container Logs (last 15 lines):"
docker-compose -f docker-compose.prod.yml logs --tail=15 backend

echo ""
echo "📁 SSL Certificate Check:"
if [ -f ssl/nginx.crt ] && [ -f ssl/nginx.key ]; then
    echo "✅ SSL certificates exist"
    echo "Certificate details:"
    openssl x509 -in ssl/nginx.crt -text -noout | grep -E "Subject:|Not After" || echo "Could not read certificate"
    echo "File permissions:"
    ls -la ssl/
else
    echo "❌ SSL certificates missing"
    echo "SSL directory contents:"
    ls -la ssl/ 2>/dev/null || echo "SSL directory doesn't exist"
fi

echo ""
echo "🔥 Firewall Check:"
echo "Checking if UFW is blocking ports..."
ufw status 2>/dev/null || echo "UFW not installed or not accessible"

echo ""
echo "🌐 Expected URLs:"
echo "  HTTPS: https://164.90.166.81"
echo "  HTTP:  http://164.90.166.81 (should redirect to HTTPS)"
echo ""
echo "❌ OLD URL (should no longer work): http://164.90.166.81:3000"

echo ""
echo "🔧 Quick Fix Commands (if needed):"
echo "  Restart nginx: docker-compose -f docker-compose.prod.yml restart nginx"
echo "  View all logs: docker-compose -f docker-compose.prod.yml logs"
echo "  Recreate containers: docker-compose -f docker-compose.prod.yml up -d --force-recreate"
