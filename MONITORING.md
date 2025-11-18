# Monitoring Configuration for ExpenseTracker API

## Overview

This document outlines the monitoring and logging setup for the ExpenseTracker backend application in production.

## Logging

### Winston Logger Implementation

The application uses **Winston** for comprehensive logging with the following features:

#### Log Levels

- `error` (0) - Error messages only
- `warn` (1) - Warnings and errors
- `info` (2) - Informational messages (default for production)
- `http` (3) - HTTP request logs
- `debug` (4) - Detailed debug information (development)

#### Log Configuration

**Environment Variables:**

```bash
LOG_ENABLED=true          # Enable/disable logging
LOG_LEVEL=info            # Set log level (error, warn, info, http, debug)
```

**Log Locations:**

- **Console**: Real-time logs with color coding
- **Files** (Production):
  - `logs/error.log` - Error-level logs only
  - `logs/combined.log` - All log levels
  - `logs/http.log` - HTTP request logs

#### Structured Logging

Logs include:

- Timestamp (YYYY-MM-DD HH:mm:ss)
- Log level
- Message
- Metadata (request ID, user ID, etc.)
- Stack traces (for errors)

**Example Log Entry:**

```json
{
  "timestamp": "2025-01-18 14:30:45",
  "level": "info",
  "message": "User logged in successfully",
  "userId": "123",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

#### HTTP Request Logging

All API requests are logged with:

- HTTP method and URL
- Status code
- Response time
- User information (if authenticated)
- Request body (sanitized)

### Log Management in Production

#### Docker Volume Mounting

Logs are persisted outside the container:

```bash
docker run -v $(pwd)/logs:/app/logs expensetracker-api
```

#### Log Rotation (Recommended)

**Using logrotate (Linux):**

```bash
# /etc/logrotate.d/expensetracker
/opt/expensetracker/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0644 nodejs nodejs
}
```

#### Centralized Logging Options

**1. ELK Stack (Elasticsearch, Logstash, Kibana)**

```yaml
# docker-compose.yml addition
logstash:
  image: logstash:8.11.0
  volumes:
    - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    - ./logs:/logs:ro
```

**2. Loki + Grafana**

```yaml
loki:
  image: grafana/loki:latest
  ports:
    - '3100:3100'
```

**3. Cloud Solutions**

- AWS CloudWatch
- Google Cloud Logging
- Azure Monitor
- Datadog

## Health Checks

### Application Health Endpoint

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-18T14:30:45.123Z",
  "uptime": 12345,
  "environment": "production",
  "version": "1.0.0"
}
```

### Docker Health Check

Built into Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

**Check container health:**

```bash
docker ps                    # See health status
docker inspect expensetracker-api | grep -A 10 Health
```

### External Monitoring

**Uptime Monitoring Services:**

1. **UptimeRobot** (Free)

   - Configure HTTP(s) monitor
   - Check interval: 5 minutes
   - Alert via email/SMS

2. **Pingdom**

   - Advanced monitoring
   - Performance metrics
   - Status pages

3. **StatusCake**
   - Website monitoring
   - Page speed tests
   - SSL monitoring

**Setup Example (UptimeRobot):**

```
Monitor Type: HTTP(s)
URL: https://api.yourdomain.com/health
Interval: 5 minutes
Alert Contact: your-email@example.com
```

## Performance Monitoring

### Application Metrics

#### Built-in Metrics

The application exposes metrics for:

- Request count
- Response times
- Error rates
- Active connections
- Cache hit rates

#### Metrics Endpoint (Optional)

Add to your application:

```typescript
// src/routes/metrics.routes.ts
import promClient from 'prom-client';

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Prometheus + Grafana Setup

**1. Prometheus Configuration**

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'expensetracker-api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/metrics'
```

**2. Enable in docker-compose.production.yml**

Uncomment the Prometheus and Grafana sections:

```yaml
prometheus:
  image: prom/prometheus:latest
  ports:
    - '9090:9090'
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro

grafana:
  image: grafana/grafana:latest
  ports:
    - '3001:3000'
```

**3. Access Dashboards**

- Prometheus: http://your-server:9090
- Grafana: http://your-server:3001 (default: admin/admin)

### Key Metrics to Monitor

**Application Performance:**

- Request rate (requests/second)
- Average response time
- 95th/99th percentile response time
- Error rate (4xx, 5xx errors)

**System Resources:**

- CPU usage
- Memory usage
- Disk I/O
- Network I/O

**Database:**

- Connection pool size
- Query execution time
- Failed queries

**Cache:**

- Hit rate
- Miss rate
- Memory usage

## Error Tracking

### Current Implementation

**Winston Error Logging:**

- All errors logged to `logs/error.log`
- Stack traces included
- Contextual information preserved

### Integration Options

**1. Sentry**

```typescript
// src/app.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Environment Variables:**

```bash
SENTRY_DSN=https://...@sentry.io/...
```

**2. Rollbar**

```typescript
import Rollbar from 'rollbar';

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_TOKEN,
  environment: process.env.NODE_ENV,
});
```

## Alerting

### Alert Configuration

**Critical Alerts:**

- Application down (health check fails)
- Error rate > 5%
- Response time > 2s (95th percentile)
- CPU usage > 80%
- Memory usage > 85%
- Disk space < 10%

### Alert Channels

**1. Email Notifications**
Configure in monitoring service (UptimeRobot, Grafana, etc.)

**2. Slack Integration**

```bash
# Webhook URL
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

**3. PagerDuty**
For on-call rotations and incident management

**4. SMS Alerts**
Via Twilio or monitoring service

## Monitoring Checklist

### Daily

- [ ] Check error logs for critical issues
- [ ] Review application uptime
- [ ] Monitor response times

### Weekly

- [ ] Analyze error trends
- [ ] Review resource utilization
- [ ] Check disk space
- [ ] Verify backup status

### Monthly

- [ ] Review and rotate logs
- [ ] Update monitoring thresholds
- [ ] Security audit (failed login attempts)
- [ ] Performance optimization opportunities

## Accessing Logs in Production

### Docker Container Logs

```bash
# View real-time logs
docker logs -f expensetracker-api

# View last 100 lines
docker logs --tail 100 expensetracker-api

# View logs since specific time
docker logs --since 2h expensetracker-api

# View only error logs
docker logs expensetracker-api 2>&1 | grep ERROR
```

### Log Files on Server

```bash
# SSH to server
ssh user@your-server.com

# Navigate to logs directory
cd /opt/expensetracker/logs

# View error logs
tail -f error.log

# Search for specific errors
grep "database" error.log

# Count errors in last hour
grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')" error.log | wc -l
```

### Log Analysis Commands

```bash
# Most common errors
grep "ERROR" combined.log | cut -d' ' -f5- | sort | uniq -c | sort -rn | head -10

# Response time analysis
grep "http" combined.log | awk '{print $NF}' | sort -n | tail -20

# Error rate by hour
grep "ERROR" combined.log | cut -d' ' -f1-2 | cut -d':' -f1 | uniq -c
```

## Performance Optimization Based on Monitoring

### Identified Issues

**1. Slow Database Queries**

- Monitor: Query execution time in logs
- Fix: Add indexes, optimize queries, implement caching

**2. High Memory Usage**

- Monitor: Container memory stats
- Fix: Optimize data structures, implement pagination, fix memory leaks

**3. Slow Response Times**

- Monitor: HTTP request logs, response times
- Fix: Add caching, optimize algorithms, implement compression

### Monitoring Tools Already Implemented

✅ **Winston Logger** - Comprehensive logging
✅ **Health Endpoint** - Application health checks
✅ **Docker Health Check** - Container health monitoring
✅ **Request Logging** - HTTP request tracking
✅ **Error Logging** - Structured error tracking
✅ **Log Files** - Persistent log storage

### Recommended Additions

**Immediate:**

- [ ] UptimeRobot for uptime monitoring
- [ ] Log rotation with logrotate
- [ ] Slack alerts for critical errors

**Short-term:**

- [ ] Prometheus + Grafana for metrics
- [ ] Sentry for error tracking
- [ ] Automated alerting rules

**Long-term:**

- [ ] ELK Stack for centralized logging
- [ ] APM (Application Performance Monitoring)
- [ ] Distributed tracing

## Support

For monitoring issues or questions:

1. Check application logs: `docker logs expensetracker-api`
2. Review monitoring dashboards
3. Check health endpoint: `curl https://api.yourdomain.com/health`
4. Review this documentation

## References

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Docker Health Checks](https://docs.docker.com/engine/reference/builder/#healthcheck)
