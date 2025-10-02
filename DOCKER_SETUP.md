# Docker Setup for GenFit

This docker-compose.yml file runs the complete GenFit application stack including:
- PostgreSQL database
- Django backend API
- React frontend

## Quick Start

1. **Clone the repository** (if you haven't already)

2. **Set up environment variables** (optional)
   Create a `.env` file in the root directory with the following variables:
   ```
   # Database Configuration
   POSTGRES_DB=group2db
   POSTGRES_USER=group2
   POSTGRES_PASSWORD=group2

   # Django Configuration
   SECRET_KEY=django-insecure-p6p*^^1rp!n(^dqu72al_wq^+5v#kw=8lw#)1i9h5qgq42
   DEBUG=True

   # API Keys
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Run the application**
   ```bash
   docker-compose up --build
   ```

## Services

### Database (PostgreSQL)
- **Port**: 5432
- **Container**: genfit_db
- **Database**: group2db
- **Username**: group2
- **Password**: group2

### Backend (Django)
- **Port**: 8000
- **Container**: genfit_backend
- **URL**: http://localhost:8000
- **Admin**: http://localhost:8000/admin

### Frontend (React)
- **Port**: 3000
- **Container**: genfit_frontend
- **URL**: http://localhost:3000

## Development

For development, you can run individual services:

```bash
# Run only database and backend
docker-compose up db backend

# Run only database
docker-compose up db
```

## Stopping the Application

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete your database data)
docker-compose down -v
```

## Troubleshooting

1. **Port conflicts**: If you have services running on ports 3000, 8000, or 5432, stop them first
2. **Build issues**: Try `docker-compose build --no-cache` to rebuild from scratch
3. **Database connection issues**: Wait for the database health check to pass before the backend starts
4. **Frontend not loading**: Check that the backend is running and accessible at http://localhost:8000

## Network Architecture

All services run on a custom bridge network (`genfit-network`) allowing them to communicate using service names:
- Frontend → Backend: `http://backend:8000`
- Backend → Database: `postgresql://group2:group2@db:5432/group2db`
