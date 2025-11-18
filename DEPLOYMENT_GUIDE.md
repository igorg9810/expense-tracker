# Backend Deployment Guide - ExpenseTracker API

## Overview

This guide provides comprehensive instructions for deploying the ExpenseTracker backend API to production using the automated CI/CD pipeline.

## Deployment Architecture

The deployment process supports multiple strategies:

1. **Custom Server via SSH** - Deploy to your own VPS/dedicated server using Docker (Primary method)
2. **Docker Compose** - Orchestrated multi-container deployment with optional services (Prometheus, Grafana)

## Prerequisites

### Server Requirements

**Minimum:**

- OS: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- CPU: 1 core (2+ recommended)
- RAM: 1GB (2GB+ recommended)
- Storage: 20GB+ available
- Docker 20.10+
- Docker Compose 2.0+ (if using Docker Compose deployment)

**Network:**

- Open ports: 22 (SSH), 3000 (API), 80/443 (if using nginx)
- Static IP or domain name configured

### Local Requirements

- Git configured with SSH access to repository
- GitHub account with repository permissions
- SSH key pair for deployment access

---

## Automated Deployment Pipeline

### Pipeline Overview

```
Push to master
    ↓
CI Checks Pass (lint, test, type-check, build)
    ↓
Docker Image Built & Pushed to GHCR
    ↓
Deploy to Production Server
    ↓
Health Check & Verification
```

### Pipeline Jobs

1. **Code Quality** - ESLint, Prettier checks
2. **Type Checking** - TypeScript compilation
3. **Tests** - Unit and integration tests with coverage
4. **Build** - Compile TypeScript, verify artifacts
5. **Docker Build** - Build and test Docker image
6. **Security Audit** - npm audit, Trivy scan
7. **CI Success** - All checks passed
8. **Docker Push** - Push image to GitHub Container Registry
9. **Deploy** - Deploy to production server

### Deployment Triggers

Automatic deployment occurs when:

- Code is pushed to `master` branch
- All CI checks pass
- Docker image is successfully built and pushed

---

## Setup Instructions

### Step 1: Prepare Production Server

#### 1.1 Connect to Your Server

```bash
ssh user@your-server.com
```

#### 1.2 Install Docker

```bash
# Update package list
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Logout and login for group changes to take effect
exit
ssh user@your-server.com

# Verify Docker installation
docker --version
```

#### 1.3 Install Docker Compose (if using Docker Compose deployment)

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

#### 1.4 Create Deployment Directory

```bash
# Create directory for application
sudo mkdir -p /opt/expensetracker
sudo chown $USER:$USER /opt/expensetracker
cd /opt/expensetracker

# Create subdirectories
mkdir -p data logs
```

#### 1.5 Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow API port
sudo ufw allow 3000/tcp

# If using nginx reverse proxy
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 2: Generate SSH Keys for Deployment

#### 2.1 Generate Deployment Key

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/expensetracker_deploy -N ""

# This creates:
# - ~/.ssh/expensetracker_deploy (private key - for GitHub Secrets)
# - ~/.ssh/expensetracker_deploy.pub (public key - for server)
```

#### 2.2 Add Public Key to Server

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/expensetracker_deploy.pub user@your-server.com

# Or manually:
cat ~/.ssh/expensetracker_deploy.pub
# Copy output and add to ~/.ssh/authorized_keys on server
```

#### 2.3 Test SSH Connection

```bash
ssh -i ~/.ssh/expensetracker_deploy user@your-server.com
# Should connect without password
```

### Step 3: Configure GitHub Secrets

#### 3.1 Navigate to Repository Settings

```
GitHub Repository → Settings → Secrets and variables → Actions → New repository secret
```

#### 3.2 Add Required Secrets

**Deployment Secrets:**

| Secret Name             | Description             | Example Value                              |
| ----------------------- | ----------------------- | ------------------------------------------ |
| `DEPLOY_HOST`           | Server IP or hostname   | `192.168.1.100` or `api.example.com`       |
| `DEPLOY_USER`           | SSH username            | `ubuntu` or `deploy`                       |
| `DEPLOY_SSH_KEY`        | Private SSH key content | Contents of `~/.ssh/expensetracker_deploy` |
| `DEPLOY_PORT`           | SSH port (optional)     | `22`                                       |
| `DEPLOY_PATH`           | Deployment directory    | `/opt/expensetracker`                      |
| `DEPLOY_CONTAINER_PORT` | Port to expose API      | `3000`                                     |

**Application Secrets:**

| Secret Name               | Description              | Required | Example                                  |
| ------------------------- | ------------------------ | -------- | ---------------------------------------- |
| `JWT_SECRET`              | JWT signing secret       | ✅ Yes   | `your-super-secret-jwt-key-min-32-chars` |
| `JWT_REFRESH_SECRET`      | JWT refresh token secret | ✅ Yes   | `your-refresh-token-secret-min-32-chars` |
| `GMAIL_USER`              | Gmail account for emails | ✅ Yes   | `your-email@gmail.com`                   |
| `GMAIL_APP_PASSWORD`      | Gmail app password       | ✅ Yes   | `abcd efgh ijkl mnop`                    |
| `DB_PATH`                 | Database file path       | ❌ No    | `file:./data/expense-tracker.db`         |
| `LOG_ENABLED`             | Enable logging           | ❌ No    | `true`                                   |
| `LOG_LEVEL`               | Logging level            | ❌ No    | `info`                                   |
| `CORS_ORIGIN`             | CORS allowed origins     | ❌ No    | `https://yourdomain.com`                 |
| `RATE_LIMIT_WINDOW_MS`    | Rate limit window        | ❌ No    | `900000`                                 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window  | ❌ No    | `100`                                    |
| `JWT_EXPIRES_IN`          | JWT expiration           | ❌ No    | `15m`                                    |
| `JWT_REFRESH_EXPIRES_IN`  | Refresh token expiration | ❌ No    | `7d`                                     |

**Optional Secrets (for Docker Compose):**

| Secret Name          | Description                      | Value                     |
| -------------------- | -------------------------------- | ------------------------- |
| `USE_DOCKER_COMPOSE` | Enable Docker Compose deployment | `true`                    |
| `DEPLOYMENT_URL`     | Application URL                  | `https://api.example.com` |

#### 3.3 Add Private SSH Key

```bash
# Display private key
cat ~/.ssh/expensetracker_deploy

# Copy the ENTIRE output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----

# Paste into DEPLOY_SSH_KEY secret in GitHub
```

### Step 4: Configure GitHub Environment

#### 4.1 Create Production Environment

```
Repository → Settings → Environments → New environment
```

**Name:** `production`

#### 4.2 Configure Protection Rules (Optional but Recommended)

- ✅ **Required reviewers**: Add 1-6 team members for approval
- ✅ **Wait timer**: Add delay before deployment (e.g., 5 minutes)
- ✅ **Deployment branches**: Restrict to `master` only

#### 4.3 Add Environment URL

```
Environment URL: https://api.yourdomain.com
```

This creates a link to your deployed application in GitHub.

### Step 5: Set Up Docker Compose (Optional)

If using Docker Compose deployment:

#### 5.1 Copy docker-compose.production.yml to Server

```bash
# On your local machine
scp docker-compose.production.yml user@your-server.com:/opt/expensetracker/

# Or manually create on server
ssh user@your-server.com
cd /opt/expensetracker
nano docker-compose.production.yml
# Paste content from repository file
```

#### 5.2 Create .env File

```bash
# On server
cd /opt/expensetracker
nano .env
```

Add environment variables:

```bash
GITHUB_REPOSITORY_OWNER=your-github-username
DEPLOY_CONTAINER_PORT=3000
DB_PATH=file:./data/expense-tracker.db
LOG_ENABLED=true
LOG_LEVEL=info
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

#### 5.3 Enable Docker Compose in GitHub

Add secret: `USE_DOCKER_COMPOSE=true`

### Step 6: Set Up Reverse Proxy (Optional but Recommended)

#### 6.1 Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

#### 6.2 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/expensetracker
```

Paste configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

#### 6.3 Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/expensetracker /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Enable on boot
sudo systemctl enable nginx
```

#### 6.4 Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to Terms of Service
# - Choose redirect HTTP to HTTPS (recommended)

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Deployment Process

### First Deployment

#### 1. Trigger Deployment

```bash
# On your local machine, push to master
git push origin master
```

#### 2. Monitor Pipeline

1. Go to GitHub repository
2. Click `Actions` tab
3. Click on the latest workflow run
4. Watch jobs execute:
   - ✅ Code Quality
   - ✅ Type Checking
   - ✅ Tests
   - ✅ Build
   - ✅ Docker Build
   - ✅ Security Audit
   - ✅ Docker Push
   - 🚀 Deploy

#### 3. Deployment Process

The deployment job will:

1. SSH to your server
2. Pull latest Docker image from GitHub Container Registry
3. Run database migrations
4. Stop old container (if exists)
5. Start new container with environment variables
6. Wait for application to be healthy
7. Run health checks
8. Clean up old images

#### 4. Verify Deployment

**Check Application:**

```bash
# Direct access
curl http://your-server:3000/health

# Via nginx
curl https://api.yourdomain.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-18T14:30:45.123Z",
  "uptime": 12345,
  "environment": "production"
}
```

**Check Container:**

```bash
ssh user@your-server.com
docker ps
# Should see: expensetracker-api (healthy)

docker logs expensetracker-api
# Should show startup logs without errors
```

### Subsequent Deployments

Every push to `master` triggers automatic deployment:

1. Make changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin master
   ```
3. Pipeline runs automatically
4. Deployment happens after all checks pass
5. Zero-downtime update with health checks

---

## Monitoring and Maintenance

### Accessing Logs

**Container Logs:**

```bash
# SSH to server
ssh user@your-server.com

# Real-time logs
docker logs -f expensetracker-api

# Last 100 lines
docker logs --tail 100 expensetracker-api

# Logs since 2 hours ago
docker logs --since 2h expensetracker-api
```

**Log Files:**

```bash
cd /opt/expensetracker/logs

# View error logs
tail -f error.log

# View all logs
tail -f combined.log

# Search logs
grep "ERROR" combined.log
```

### Health Checks

**Application Health:**

```bash
curl https://api.yourdomain.com/health
```

**Container Health:**

```bash
docker ps
# Check STATUS column for (healthy)

docker inspect expensetracker-api | grep -A 10 Health
```

### Resource Monitoring

**Container Stats:**

```bash
# Real-time resource usage
docker stats expensetracker-api

# Disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

**Server Resources:**

```bash
# CPU and memory
htop

# Disk space
df -h

# Network connections
netstat -tulpn | grep 3000
```

### Log Rotation

Set up automatic log rotation:

```bash
sudo nano /etc/logrotate.d/expensetracker
```

Add configuration:

```
/opt/expensetracker/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0644 nodejs nodejs
    sharedscripts
    postrotate
        docker kill -s USR1 expensetracker-api 2>/dev/null || true
    endscript
}
```

Test rotation:

```bash
sudo logrotate -f /etc/logrotate.d/expensetracker
```

---

## Rollback Procedures

### Quick Rollback via Git

```bash
# Revert last commit
git revert HEAD
git push origin master

# CI/CD will automatically deploy the reverted version
```

### Manual Rollback

```bash
# SSH to server
ssh user@your-server.com

# View available images
docker images | grep expensetracker-api

# Example output:
# ghcr.io/username/expensetracker-api  master-abc123  ...
# ghcr.io/username/expensetracker-api  master-def456  ...

# Stop current container
docker stop expensetracker-api
docker rm expensetracker-api

# Start previous version
docker run -d \
  --name expensetracker-api \
  --restart unless-stopped \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DB_PATH=file:./data/expense-tracker.db \
  -e JWT_SECRET=your-secret \
  -e JWT_REFRESH_SECRET=your-refresh-secret \
  -e GMAIL_USER=your-email \
  -e GMAIL_APP_PASSWORD=your-password \
  ghcr.io/username/expensetracker-api:master-def456

# Verify
curl http://localhost:3000/health
```

---

## Troubleshooting

### Issue: SSH Connection Fails

**Symptoms:**

```
Permission denied (publickey)
```

**Solutions:**

```bash
# Verify SSH key is correct
cat ~/.ssh/expensetracker_deploy

# Ensure key is added to server
ssh-copy-id -i ~/.ssh/expensetracker_deploy.pub user@server

# Check GitHub Secret
# Verify DEPLOY_SSH_KEY contains complete private key including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----

# Test connection manually
ssh -i ~/.ssh/expensetracker_deploy user@server
```

### Issue: Container Won't Start

**Symptoms:**

```
Container exits immediately
```

**Solutions:**

```bash
# Check logs
docker logs expensetracker-api

# Common causes:
# 1. Missing environment variables
docker inspect expensetracker-api | grep Env

# 2. Database migration failed
docker run --rm -v $(pwd)/data:/app/data \
  ghcr.io/username/expensetracker-api:latest \
  npx prisma migrate deploy

# 3. Port already in use
netstat -tulpn | grep 3000
# Kill process or change port
```

### Issue: Health Check Fails

**Symptoms:**

```
Health check failed after 12 attempts
```

**Solutions:**

```bash
# Check if application started
docker logs expensetracker-api | grep "Server is running"

# Test health endpoint manually
curl http://localhost:3000/health

# Check if port is accessible
telnet localhost 3000

# Verify firewall rules
sudo ufw status

# Check nginx configuration (if used)
sudo nginx -t
sudo systemctl status nginx
```

### Issue: Database Errors

**Symptoms:**

```
PrismaClientInitializationError
```

**Solutions:**

```bash
# Check database file permissions
ls -la /opt/expensetracker/data/

# Fix permissions
sudo chown -R 1001:1001 /opt/expensetracker/data/

# Run migrations manually
docker run --rm \
  -v $(pwd)/data:/app/data \
  -e DB_PATH=file:./data/expense-tracker.db \
  ghcr.io/username/expensetracker-api:latest \
  npx prisma migrate deploy

# Check database integrity
docker run --rm \
  -v $(pwd)/data:/app/data \
  -e DB_PATH=file:./data/expense-tracker.db \
  ghcr.io/username/expensetracker-api:latest \
  npx prisma db execute --stdin < "PRAGMA integrity_check;"
```

### Issue: High Memory Usage

**Symptoms:**

```
Container using excessive memory
```

**Solutions:**

```bash
# Check container stats
docker stats expensetracker-api

# Set memory limits
docker update --memory 512m --memory-swap 1g expensetracker-api

# Or in docker-compose.production.yml:
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
```

### Issue: Deployment Fails

**Symptoms:**

```
GitHub Actions deployment job fails
```

**Solutions:**

```bash
# Check GitHub Actions logs
# Repository → Actions → Failed workflow → Deploy job

# Verify all secrets are set
# Settings → Secrets and variables → Actions

# Test deployment manually
ssh user@server
cd /opt/expensetracker
docker pull ghcr.io/username/expensetracker-api:latest
```

---

## Security Best Practices

### SSH Security

1. **Disable password authentication:**

   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   sudo systemctl restart sshd
   ```

2. **Use non-root user for deployment**
3. **Rotate SSH keys regularly** (every 90 days)
4. **Use fail2ban to prevent brute force:**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

### Application Security

1. **Use strong secrets** (min 32 characters)
2. **Enable HTTPS** (Let's Encrypt)
3. **Configure CORS properly** (not `*` in production)
4. **Keep dependencies updated:**
   ```bash
   npm audit
   npm update
   ```
5. **Monitor security advisories** (GitHub Dependabot)

### Database Security

1. **Regular backups:**

   ```bash
   # Create backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   cp /opt/expensetracker/data/expense-tracker.db \
      /opt/expensetracker/backups/expense-tracker_$DATE.db

   # Delete backups older than 30 days
   find /opt/expensetracker/backups/ -name "*.db" -mtime +30 -delete
   ```

2. **Automated backups with cron:**
   ```bash
   crontab -e
   # Add: 0 2 * * * /opt/expensetracker/backup.sh
   ```

### Container Security

1. **Run as non-root user** (already configured in Dockerfile)
2. **Scan images for vulnerabilities** (Trivy in CI/CD)
3. **Keep base images updated**
4. **Limit container resources**

---

## Performance Optimization

### Caching

The application includes Redis-compatible caching:

```typescript
// Already implemented in src/services/cache.service.ts
```

### Database Optimization

```bash
# Add indexes for frequently queried fields
# Already implemented in prisma/schema.prisma
```

### Load Balancing (Advanced)

For high-traffic scenarios, use multiple containers:

```yaml
# docker-compose.production.yml
services:
  api-1:
    image: ghcr.io/username/expensetracker-api:latest
    # ...

  api-2:
    image: ghcr.io/username/expensetracker-api:latest
    # ...

  nginx:
    image: nginx:alpine
    # Configure load balancing
```

---

## Cost Estimation

### Server Costs (VPS)

| Provider      | Plan     | CPU | RAM | Storage | Bandwidth | Cost/Month |
| ------------- | -------- | --- | --- | ------- | --------- | ---------- |
| DigitalOcean  | Basic    | 1   | 1GB | 25GB    | 1TB       | $6         |
| DigitalOcean  | Standard | 2   | 2GB | 50GB    | 2TB       | $12        |
| Linode        | Nanode   | 1   | 1GB | 25GB    | 1TB       | $5         |
| Linode        | Standard | 2   | 2GB | 50GB    | 2TB       | $12        |
| Vultr         | Regular  | 1   | 1GB | 25GB    | 1TB       | $6         |
| AWS Lightsail | Small    | 1   | 1GB | 40GB    | 2TB       | $5         |

**Recommended:** 2GB RAM, 2 CPU cores = ~$12/month

### Additional Costs

- **Domain name**: $10-15/year
- **SSL certificate**: Free (Let's Encrypt)
- **Monitoring** (optional): $0-50/month
- **Backups**: Included in server cost

**Total estimated cost: $13-17/month**

---

## Summary

### What Was Implemented

✅ **Automated CI/CD Pipeline** - Full deployment automation via GitHub Actions  
✅ **Docker Image Registry** - GitHub Container Registry (GHCR) integration  
✅ **Multiple Deployment Strategies** - SSH Docker and Docker Compose  
✅ **Environment Variable Management** - Secure secrets via GitHub Secrets  
✅ **Health Checks** - Application and container health monitoring  
✅ **Logging System** - Winston logger with file and console output  
✅ **Database Migrations** - Automated Prisma migrations on deployment  
✅ **Zero-Downtime Deployment** - Graceful container updates  
✅ **Security Scanning** - Trivy vulnerability scanning in CI  
✅ **Rollback Capability** - Quick rollback via Git or manual Docker

### What Needs Manual Setup

1. **Server Preparation** (~30 minutes)

   - Install Docker and Docker Compose
   - Create deployment directory
   - Configure firewall

2. **SSH Keys** (~10 minutes)

   - Generate deployment SSH key pair
   - Add public key to server
   - Add private key to GitHub Secrets

3. **GitHub Secrets** (~15 minutes)

   - Add deployment secrets (host, user, SSH key, path)
   - Add application secrets (JWT, Gmail, etc.)

4. **GitHub Environment** (~5 minutes)

   - Create production environment
   - Configure protection rules

5. **Reverse Proxy Setup** (~20 minutes, optional)

   - Install and configure nginx
   - Set up SSL with Let's Encrypt

6. **Monitoring Setup** (~varies, optional)
   - Configure uptime monitoring (UptimeRobot)
   - Set up Prometheus + Grafana
   - Configure alerting

**Total setup time: 1-2 hours for first deployment**

### Next Steps

1. Follow setup instructions in this guide
2. Add required GitHub Secrets
3. Configure GitHub Environment
4. Push to master to trigger deployment
5. Verify deployment success
6. Set up monitoring and alerting
7. Configure automated backups

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Winston Logger Documentation](https://github.com/winstonjs/winston)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

## Support

For deployment issues:

1. Check GitHub Actions logs
2. Review server logs: `docker logs expensetracker-api`
3. Consult troubleshooting section
4. Check MONITORING.md for monitoring setup

---

**Last Updated:** January 2025  
**Version:** 1.0.0
