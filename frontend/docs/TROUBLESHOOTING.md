# SmartShip Frontend - Troubleshooting Guide

## Console Errors You're Seeing

Based on the screenshot, you're experiencing these errors:

### 1. HTTP Connection Errors
```
GET http://localhost:5279/gateway/auth/login net::ERR_CONNECTION_REFUSED
```

### 2. CORS Errors
```
Access to XMLHttpRequest at 'http://localhost:5279/gateway/auth/login' from origin 'http://localhost:4200' has been blocked by CORS policy
```

## Root Cause

**The backend services are not running!**

The frontend is trying to connect to:
- Gateway: `http://localhost:5279`
- Identity Service: `http://localhost:5028`
- Other microservices on their respective ports

But these services are not started, causing connection refused errors.

## Solution: Start the Backend Services

### Step 1: Start Infrastructure Services

First, start the required infrastructure (databases, message queues, etc.):

```bash
cd Backend/infrastructure
docker-compose up -d
```

This will start:
- PostgreSQL databases
- RabbitMQ
- Redis (if configured)

### Step 2: Start the Gateway

```bash
cd Backend/gateway/SmartShip.Gateway
dotnet run
```

The gateway should start on `http://localhost:5279`

### Step 3: Start Identity Service

```bash
cd Backend/services/SmartShip.IdentityService
dotnet run
```

The identity service should start on `http://localhost:5028`

### Step 4: Start Other Services (Optional)

If you need full functionality, start these services:

**Shipment Service:**
```bash
cd Backend/services/SmartShip.ShipmentService
dotnet run
```

**Tracking Service:**
```bash
cd Backend/services/SmartShip.TrackingService
dotnet run
```

**Document Service:**
```bash
cd Backend/services/SmartShip.DocumentService
dotnet run
```

**Admin Service:**
```bash
cd Backend/services/SmartShip.AdminService
dotnet run
```

### Step 5: Verify Services Are Running

Open your browser and check:
- Gateway: http://localhost:5279/swagger
- Identity: http://localhost:5028/swagger

You should see the Swagger documentation pages.

### Step 6: Start Frontend

Now start the frontend:

```bash
cd frontend/smartship-ui
npm start
```

Open http://localhost:4200 - the errors should be gone!

## Quick Start Script (Windows)

Create a file `start-all.bat` in the Backend folder:

```batch
@echo off
echo Starting SmartShip Backend Services...

echo Starting Infrastructure...
cd infrastructure
start cmd /k docker-compose up

timeout /t 10

echo Starting Gateway...
cd ../gateway/SmartShip.Gateway
start cmd /k dotnet run

timeout /t 5

echo Starting Identity Service...
cd ../../services/SmartShip.IdentityService
start cmd /k dotnet run

echo All services starting...
echo Check each window for startup status
pause
```

Run this script to start all services at once.

## Quick Start Script (Linux/Mac)

Create a file `start-all.sh` in the Backend folder:

```bash
#!/bin/bash

echo "Starting SmartShip Backend Services..."

# Start infrastructure
cd infrastructure
docker-compose up -d

sleep 10

# Start Gateway
cd ../gateway/SmartShip.Gateway
dotnet run &

sleep 5

# Start Identity Service
cd ../../services/SmartShip.IdentityService
dotnet run &

echo "All services starting..."
echo "Check logs for startup status"
```

Make it executable and run:
```bash
chmod +x start-all.sh
./start-all.sh
```

## Verifying Everything Works

1. **Check Backend Services:**
   - Gateway Swagger: http://localhost:5279/swagger
   - Identity Swagger: http://localhost:5028/swagger

2. **Check Frontend:**
   - Open: http://localhost:4200
   - You should see the SmartShip landing page
   - No console errors

3. **Test Login:**
   - Click "Login" or "Sign In"
   - Try to login (you may need to create an account first)
   - No connection errors should appear

## Common Issues

### Issue: "Port already in use"

**Solution:**
```bash
# Windows
netstat -ano | findstr :5279
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5279 | xargs kill -9
```

### Issue: "Database connection failed"

**Solution:**
- Ensure Docker is running
- Check infrastructure services: `docker-compose ps`
- Restart infrastructure: `docker-compose restart`

### Issue: "CORS errors persist"

**Solution:**
- Verify the gateway is running on port 5279
- Check the frontend proxy.conf.json is correct
- Restart the frontend: `npm start`

### Issue: "Cannot connect to database"

**Solution:**
- Check connection strings in appsettings.json
- Ensure PostgreSQL is running in Docker
- Run migrations: `dotnet ef database update`

## Development Workflow

**Recommended order:**

1. Start infrastructure (Docker)
2. Wait 10 seconds for databases to initialize
3. Start Gateway
4. Start Identity Service
5. Start other services as needed
6. Start Frontend
7. Open browser to http://localhost:4200

## Production Deployment

For production, you would:

1. Build all services: `dotnet publish -c Release`
2. Build frontend: `npm run build`
3. Deploy to hosting (Azure, AWS, etc.)
4. Configure environment variables
5. Set up proper CORS policies
6. Use production database connections

## Need Help?

If you're still seeing errors:

1. Check all services are running: `netstat -an | findstr "5279 5028"`
2. Check Docker containers: `docker ps`
3. Check service logs for errors
4. Verify database migrations are applied
5. Clear browser cache and restart

---

**Remember:** The frontend cannot work without the backend services running!
