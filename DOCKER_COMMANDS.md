# Docker Quick Reference for ExpenseTracker Backend

## Quick Start Commands

### Local Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Manual Docker Commands

```bash
# Build image
docker build -t expensetracker-backend:latest .

# Run container
docker run -d \
  --name expensetracker-api \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  expensetracker-backend:latest

# Stop container
docker stop expensetracker-api

# Remove container
docker rm expensetracker-api

# View logs
docker logs -f expensetracker-api

# Execute command in container
docker exec -it expensetracker-api sh

# Inspect container
docker inspect expensetracker-api
```

## Testing

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test with httpie (if installed)
http GET :3000/health

# Load test with autocannon (if installed)
npx autocannon -c 10 -d 30 http://localhost:3000/health
```

## Troubleshooting

```bash
# Check container status
docker ps -a

# Check resource usage
docker stats expensetracker-api

# View container logs
docker logs --tail 100 expensetracker-api

# Enter container shell
docker exec -it expensetracker-api sh

# Check environment variables
docker exec expensetracker-api env

# Restart container
docker restart expensetracker-api
```

## Cleanup

```bash
# Remove container
docker rm -f expensetracker-api

# Remove image
docker rmi expensetracker-backend:latest

# Clean up unused resources
docker system prune -a

# Remove volumes
docker volume prune
```

## Production Deployment

### Push to Docker Hub

```bash
# Tag image
docker tag expensetracker-backend:latest yourusername/expensetracker-backend:latest
docker tag expensetracker-backend:latest yourusername/expensetracker-backend:1.0.0

# Push to Docker Hub
docker push yourusername/expensetracker-backend:latest
docker push yourusername/expensetracker-backend:1.0.0
```

### Push to AWS ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag expensetracker-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/expensetracker:latest

# Push to ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/expensetracker:latest
```

### Pull and Run from Registry

```bash
# Pull image
docker pull yourusername/expensetracker-backend:latest

# Run from registry
docker run -d \
  --name expensetracker-api \
  -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -e JWT_REFRESH_SECRET=your-refresh-secret \
  -e DB_PATH=file:/app/data/expense-tracker.db \
  -v expensetracker-data:/app/data \
  -v expensetracker-logs:/app/logs \
  --restart unless-stopped \
  yourusername/expensetracker-backend:latest
```

## Environment Setup

### Generate Secrets

```bash
# Linux/Mac - Generate random 64-character string
openssl rand -base64 48

# Windows PowerShell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

### Create .env file

```bash
# Copy template
cp .env.docker .env

# Edit with your values
nano .env  # or use your preferred editor
```

## Health Checks

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' expensetracker-api

# View health check logs
docker inspect --format='{{json .State.Health}}' expensetracker-api | jq

# Manual health check
curl -f http://localhost:3000/health || echo "Health check failed"
```

## Database Management

```bash
# Backup database
docker cp expensetracker-api:/app/data/expense-tracker.db ./backup-$(date +%Y%m%d).db

# Restore database
docker cp ./backup-20251117.db expensetracker-api:/app/data/expense-tracker.db
docker restart expensetracker-api

# Run migrations manually
docker exec expensetracker-api npx prisma migrate deploy

# View database
docker exec -it expensetracker-api sh
cd /app/data
sqlite3 expense-tracker.db
```

## Monitoring

```bash
# Real-time logs with timestamps
docker logs -f --timestamps expensetracker-api

# Filter logs by keyword
docker logs expensetracker-api 2>&1 | grep ERROR

# Export logs to file
docker logs expensetracker-api > app.log 2>&1

# Monitor resource usage
docker stats --no-stream expensetracker-api
```

## Security Scan

```bash
# Scan with Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image expensetracker-backend:latest

# Scan with Docker Scout (if available)
docker scout cves expensetracker-backend:latest

# Check for vulnerabilities
docker scan expensetracker-backend:latest
```

## Multi-Platform Build

```bash
# Build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 \
  -t expensetracker-backend:latest \
  --push \
  .
```

## Notes

- Always use environment variables for secrets
- Never commit .env files to version control
- Regularly update base image for security patches
- Monitor container resource usage
- Implement backup strategy for production
- Use secrets management tools for production deployments
