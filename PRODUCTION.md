# CompanyMap Production Deployment

This directory contains the production configuration for the CompanyMap application.

## 🚀 Quick Start

1. **Configure Environment**
   ```bash
   cp env.prod.example .env.prod
   nano .env.prod  # Update with your production values
   ```

2. **Deploy Production**
   ```bash
   ./deploy-prod.sh
   ```

## 📁 Production Files

- `docker-compose.prod.yml` - Production Docker Compose configuration
- `nginx.prod.conf` - Production Nginx configuration with security headers
- `Backend/Dockerfile.prod` - Production Django backend with Gunicorn
- `Frontend/Dockerfile` - Production React frontend build
- `deploy-prod.sh` - Automated deployment script
- `env.prod.example` - Production environment variables template

## 🔧 Production Features

### Backend (Django)
- ✅ **Gunicorn WSGI Server** - Production-grade Python web server
- ✅ **Non-root User** - Enhanced security
- ✅ **Health Checks** - Container health monitoring
- ✅ **Optimized Dependencies** - Minimal production image
- ✅ **Static File Handling** - Proper static file serving

### Frontend (React)
- ✅ **Multi-stage Build** - Optimized production bundle
- ✅ **Nginx Serving** - Fast static file delivery
- ✅ **Asset Optimization** - Minified and compressed assets

### Database (PostgreSQL)
- ✅ **Persistent Volumes** - Data survives container restarts
- ✅ **Health Checks** - Database availability monitoring
- ✅ **Production Configuration** - Optimized for production use

### Reverse Proxy (Nginx)
- ✅ **Security Headers** - XSS, CSRF, and other protections
- ✅ **Rate Limiting** - API and login rate limiting
- ✅ **Gzip Compression** - Reduced bandwidth usage
- ✅ **SSL Ready** - HTTPS configuration available
- ✅ **Load Balancing** - Multiple backend workers

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:80 | React application |
| **Backend API** | http://localhost:8000 | Django REST API |
| **Django Admin** | http://localhost:80/admin | Admin interface |
| **Health Check** | http://localhost:80/health | Service health status |

## 📊 Monitoring

### View Logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f postgres
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Service Status
```bash
docker compose -f docker-compose.prod.yml ps
```

### Resource Usage
```bash
docker stats
```

## 🔒 Security Considerations

1. **Change Default Passwords** - Update all default passwords in `.env.prod`
2. **Generate Secure Secret Key** - Use Django's secret key generator
3. **Configure SSL** - Uncomment SSL section in `nginx.prod.conf`
4. **Firewall Rules** - Restrict access to production ports
5. **Regular Updates** - Keep Docker images and dependencies updated

## 🛠️ Maintenance

### Backup Database
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U companymap_user_prod companymap_db_prod > backup.sql
```

### Restore Database
```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U companymap_user_prod companymap_db_prod < backup.sql
```

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
./deploy-prod.sh
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Check if ports 80, 8000, 3000, 5432 are available
   - Update port numbers in `.env.prod`

2. **Permission Issues**
   - Ensure Docker has proper permissions
   - Check volume mount permissions

3. **Database Connection**
   - Verify PostgreSQL is running: `docker compose -f docker-compose.prod.yml ps postgres`
   - Check database logs: `docker compose -f docker-compose.prod.yml logs postgres`

4. **Static Files Not Loading**
   - Run collectstatic: `docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput`
   - Check Nginx configuration

### Emergency Commands

```bash
# Stop all services
docker compose -f docker-compose.prod.yml down

# Remove all data (DANGER!)
docker compose -f docker-compose.prod.yml down -v

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
```

## 📈 Performance Optimization

1. **Database Indexing** - Add indexes for frequently queried fields
2. **Caching** - Implement Redis for session and data caching
3. **CDN** - Use CDN for static assets
4. **Load Balancing** - Scale backend services horizontally
5. **Monitoring** - Implement application performance monitoring

---

**Note**: This is a production-ready setup. Always test thoroughly in a staging environment before deploying to production.
