# Sleep Apnea Management System - Docker Setup

## Prerequisites

- Docker installed ([Get Docker](https://www.docker.com/products/docker-desktop))
- Docker Compose (comes with Docker Desktop)

## Quick Start

### 1. Run with Docker Compose (Recommended)

```bash
docker-compose up --build
```

**First time setup**: The application will automatically:
- Create and start PostgreSQL database
- Build the application
- Install all dependencies
- Start the backend API on port 5000
- Serve the frontend on port 5000 (static files)

**Access the application**:
- Frontend: http://localhost:5000
- API: http://localhost:5000/api

**Stop the application**:
```bash
docker-compose down
```

**Stop and remove all data** (reset database):
```bash
docker-compose down -v
```

---

## Configuration

The application reads configuration from environment variables. You can customize them in:

1. **docker-compose.yml** - Direct editing (not recommended for production)
2. **.env file** - Create or edit `.env` file in the root directory

### Environment Variables

```env
# Database
DB_NAME=sleep_apnea_db
DB_USER=postgres
DB_PASSWORD=Damadafakar1999
DB_HOST=db
DB_PORT=5432

# JWT
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=production
CNP_ENCRYPTION_KEY=Qw8vB2rT5pLzX1sN6eYjK4uV0aHcS9dG
```

---

## Docker Commands Reference

### Build and Run
```bash
# Build image
docker-compose build

# Start containers
docker-compose up

# Start in background
docker-compose up -d

# Start and rebuild
docker-compose up --build
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f db
```

### Execute Commands in Container
```bash
# Run shell in app container
docker exec -it sleep_apnea_app sh

# Run a command
docker exec sleep_apnea_app npm run seed:bulk
```

### Clean Up
```bash
# Stop containers
docker-compose stop

# Remove containers
docker-compose rm

# Stop and remove everything (keeps volumes)
docker-compose down

# Stop, remove everything, and delete database
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a
```

---

## Troubleshooting

### Port Already in Use

If port 5000 or 5432 is already in use:

```yaml
# In docker-compose.yml, change ports:
services:
  app:
    ports:
      - "8000:5000"  # External:Internal
  db:
    ports:
      - "5433:5432"  # External:Internal
```

Then access at `http://localhost:8000`

### Database Connection Issues

```bash
# Check if database is healthy
docker-compose ps

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Application Not Starting

```bash
# Check application logs
docker-compose logs app

# Rebuild without cache
docker-compose build --no-cache

# Full reset
docker-compose down -v
docker-compose up --build
```

### Reset Everything

```bash
# Complete reset (delete containers, volumes, networks)
docker-compose down -v
rm -rf node_modules frontend/node_modules

# Rebuild from scratch
docker-compose up --build
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Docker Compose Network           │
├─────────────────────────────────────────┤
│                                         │
│  ┌────────────────────────────────┐   │
│  │   PostgreSQL Database          │   │
│  │   (sleep_apnea_db)             │   │
│  │   Port: 5432                   │   │
│  └────────────────────────────────┘   │
│                 ▲                      │
│                 │ (TCP)                │
│                 │                      │
│  ┌────────────────────────────────┐   │
│  │   Node.js Backend              │   │
│  │   + React Frontend (static)    │   │
│  │   Port: 5000                   │   │
│  │                                │   │
│  │  /api/* → Backend API          │   │
│  │  / → Frontend static files     │   │
│  └────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## For Testing by Doctors

Share these instructions with doctors/testers:

### Simple Start (One Command)

```bash
docker-compose up
```

Wait for the message: `Backend server listening on port 5000`

Then open: **http://localhost:5000**

### Stop the Application

```bash
docker-compose down
```

### View Logs (for troubleshooting)

```bash
docker-compose logs -f
```

---

## Production Notes

⚠️ **Before deploying to production**:

1. Change `JWT_SECRET` to a strong random value
2. Change `DB_PASSWORD` to a strong password
3. Set `NODE_ENV=production`
4. Use a reverse proxy (nginx) in front
5. Use proper SSL/TLS certificates
6. Store secrets in a secrets manager (not in .env)
7. Set up proper database backups
8. Configure proper resource limits for containers

---

## Support

For issues or questions, check the logs:

```bash
docker-compose logs app
docker-compose logs db
```
