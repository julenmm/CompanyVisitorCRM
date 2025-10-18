#!/bin/bash

# Production Deployment Script for CompanyMap
# This script builds and deploys the production environment

set -e  # Exit on any error

echo "🚀 Starting CompanyMap Production Deployment..."

# Check if .env.prod exists
if [ ! -f ".env.prod" ]; then
    echo "❌ Error: .env.prod file not found!"
    echo "📝 Please copy env.prod.example to .env.prod and configure your production settings:"
    echo "   cp env.prod.example .env.prod"
    echo "   nano .env.prod"
    exit 1
fi

# Load production environment variables
export $(cat .env.prod | grep -v '^#' | xargs)

echo "📦 Building production images..."

# Build all services
docker compose -f docker-compose.prod.yml build --no-cache

echo "🛑 Stopping existing production containers..."
docker compose -f docker-compose.prod.yml down

echo "🗄️ Creating production volumes..."
docker volume create companymap_postgres_data_prod 2>/dev/null || true
docker volume create companymap_backend_static_prod 2>/dev/null || true
docker volume create companymap_backend_media_prod 2>/dev/null || true

echo "🚀 Starting production services..."
docker compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🔍 Checking service health..."
docker compose -f docker-compose.prod.yml ps

echo "📊 Production deployment complete!"
echo ""
echo "🌐 Services available at:"
echo "   Frontend: http://localhost:${NGINX_PORT:-80}"
echo "   Backend API: http://localhost:${BACKEND_PORT:-8000}"
echo "   Django Admin: http://localhost:${NGINX_PORT:-80}/admin/"
echo ""
echo "📝 Useful commands:"
echo "   View logs: docker compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker compose -f docker-compose.prod.yml down"
echo "   Restart services: docker compose -f docker-compose.prod.yml restart"
echo ""
echo "✅ Production deployment successful!"
