# CompanyMap - Full Stack Application

A full-stack web application with React frontend, Django REST API backend, and PostgreSQL database, containerized with Docker.

CompanyVisitorCRM is designed to function as an intelligent visitor relationship management platform. Users can upload lists of client company domains, which are then processed through data pipelines to automatically identify and geolocate each company’s offices. When traveling to a new region, users can instantly see which clients or prospects are nearby, allowing them to strategically plan visits and maximize trip efficiency.

This application addresses a major challenge for organizations that manage numerous B2B relationships across multiple regions or countries. By centralizing geospatial company data—something traditional CRM or MSA systems lack at an international scale—CompanyVisitorCRM enables smarter, data-driven business travel and relationship management.


## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Django + Django REST Framework
- **Database**: PostgreSQL
- **Reverse Proxy**: Nginx
- **Containerization**: Docker + Docker Compose

## Quick Start

1. **Clone and navigate to the project directory**:
   ```bash
   cd CompanyMap
   ```

2. **Create environment file**:
   ```bash
   cp env.example .env
   ```

3. **Build and start all services**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Django Admin: http://localhost:8000/admin/
   - Nginx (all services): http://localhost:80

## Services

### PostgreSQL Database
- **Port**: 5432
- **Database**: companymap_db
- **User**: companymap_user
- **Password**: companymap_password

### Django Backend
- **Port**: 8000
- **Framework**: Django 5.2.6 + DRF
- **Features**: 
  - REST API endpoints
  - Django Admin interface
  - CORS enabled
  - Static file serving

### React Frontend
- **Port**: 3000
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Features**:
  - Map integration (Leaflet)
  - Responsive design
  - TypeScript support

### Nginx Reverse Proxy
- **Port**: 80
- **Features**:
  - Load balancing
  - Static file serving
  - API proxying

## Development

### Backend Development
```bash
# Run Django migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Access Django shell
docker-compose exec backend python manage.py shell

# Run tests
docker-compose exec backend python manage.py test
```

### Frontend Development
```bash
# Install dependencies
docker-compose exec frontend npm install

# Run in development mode
docker-compose exec frontend npm run dev
```

## Environment Variables

Copy `env.example` to `.env` and modify as needed:

```env
# Database
POSTGRES_DB=companymap_db
POSTGRES_USER=companymap_user
POSTGRES_PASSWORD=companymap_password

# Django
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
NGINX_PORT=80
```

## API Endpoints

- `GET /api/` - API root
- `GET /admin/` - Django Admin interface

## Database Management

### Reset Database
```bash
# Stop services and remove volumes
docker-compose down -v

# Restart services
docker-compose up --build
```

### Backup Database
```bash
docker-compose exec postgres pg_dump -U companymap_user companymap_db > backup.sql
```

### Restore Database
```bash
docker-compose exec -T postgres psql -U companymap_user -d companymap_db < backup.sql
```

## Production Deployment

For production deployment:

1. Set `DEBUG=False` in environment variables
2. Use a strong `SECRET_KEY`
3. Configure proper `ALLOWED_HOSTS`
4. Use environment-specific database credentials
5. Consider using Docker Swarm or Kubernetes for orchestration

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in `.env` file
2. **Database connection**: Ensure PostgreSQL is running and accessible
3. **CORS errors**: Check `CORS_ALLOWED_ORIGINS` in Django settings
4. **Static files**: Run `python manage.py collectstatic` in backend container

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
