# 🚀 Deployment Guide: Refactored Server

**Status:** Ready for Production  
**Last Updated:** 2024-11-24  
**Tested:** ✅ All tests passing

---

## 📋 Pre-Deployment Checklist

- [ ] Reviewed testing results in `TESTING_RESULTS.md`
- [ ] Approved architectural changes
- [ ] All tests passing: `npm test`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Team notified of deployment

---

## 🔧 Local Development

### Switch to Refactored Server

```bash
# Edit package.json
"scripts": {
  "dev": "tsx src/server-refactored.ts"  ← Change this
}

# Start local development
npm run dev

# Server will be available at http://localhost:3001
```

### Verify It Works

```bash
# Health check
curl http://localhost:3001/health

# Get rankings
curl http://localhost:3001/api/elo/rankings?limit=5

# Test with data
npm test
```

---

## 📦 Build for Production

### Standard Deployment

```bash
# Install dependencies
npm install

# Verify no errors
npx tsc --noEmit

# Build TypeScript to JavaScript
npm run build

# Verify build succeeded
ls dist/server-refactored.js

# Start production server
NODE_ENV=production node dist/server-refactored.js
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy built code
COPY dist ./dist

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start server
CMD ["node", "dist/server-refactored.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
```

### Vercel Deployment

Vercel automatically detects and uses the entry point. No changes needed if using `server-refactored.ts`.

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database_url",
    "CRON_SECRET": "@cron_secret"
  }
}
```

---

## 🌍 Environment Variables

Required for both staging and production:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/clubelo
# OR (for Vercel Postgres)
POSTGRES_URL=postgresql://user:password@host:5432/clubelo

# API Server
PORT=3001
NODE_ENV=production

# Cron Security
CRON_SECRET=your-secret-key-here

# Optional: ClubElo API (defaults work)
CLUBELO_API_BASE=http://api.clubelo.com

# Logging
LOG_LEVEL=info
```

### Secure Environment Variables

**DO NOT hardcode credentials!**

For Vercel:
1. Go to Project Settings → Environment Variables
2. Add `DATABASE_URL`, `CRON_SECRET`, etc.
3. Mark sensitive variables as "Sensitive"

For Docker/K8s:
```bash
# Use .env.production (git-ignored)
# Or pass via docker run
docker run -e DATABASE_URL="..." -e CRON_SECRET="..." ...

# Or use secrets in K8s
kubectl create secret generic clubelo-secrets \
  --from-literal=DATABASE_URL="..." \
  --from-literal=CRON_SECRET="..."
```

---

## 🧪 Staging Deployment

### Deploy to Staging

```bash
# Build
npm run build

# Copy to staging server
scp -r dist/ user@staging.example.com:/app/

# Connect to staging
ssh user@staging.example.com

# Install dependencies
cd /app
npm ci --only=production

# Start server
NODE_ENV=production node dist/server-refactored.js
```

### Test Staging

```bash
# Health check
curl https://staging.example.com/health

# Test endpoints
curl https://staging.example.com/api/elo/rankings?limit=10

# Check logs
tail -f /var/log/app.log

# Run smoke tests
npm run test:smoke  # If you have smoke tests defined
```

### Verify No Errors

```bash
# Check for errors in logs
grep ERROR /var/log/app.log

# Check response times
curl -w "Time: %{time_total}s\n" https://staging.example.com/api/elo/rankings

# Monitor resource usage
top  # CPU, memory
df -h  # Disk space
```

---

## 🚀 Production Deployment

### Zero-Downtime Deployment (Recommended)

Using blue-green deployment or rolling update:

```bash
# 1. Start new server on different port/container
NODE_ENV=production node dist/server-refactored.js

# 2. Run health checks
curl http://localhost:3001/health

# 3. Switch load balancer/reverse proxy to new server
# (This is handled by your deployment tool)

# 4. Gradually shift traffic
# - 10% to new server
# - 50% to new server
# - 100% to new server

# 5. Stop old server when stable
kill <old-process-pid>
```

### Simple Deployment (With Brief Downtime)

```bash
# 1. Stop old server
systemctl stop clubelo

# 2. Deploy new version
npm run build
cp dist/server-refactored.js /opt/clubelo/

# 3. Update systemd service
systemctl edit clubelo
# Change: ExecStart=/usr/bin/node /opt/clubelo/dist/server-refactored.js

# 4. Start new server
systemctl start clubelo
systemctl status clubelo

# 5. Verify
curl http://localhost:3001/health
```

### PM2 Deployment (Recommended)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'clubelo',
    script: './dist/server-refactored.js',
    instances: 4,  // CPU count
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
  }]
};
```

```bash
# Deploy with PM2
npm run build
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit
pm2 logs clubelo

# Update
pm2 delete clubelo
npm run build
pm2 start ecosystem.config.js --env production

# Save startup script
pm2 startup
pm2 save
```

---

## 🔍 Post-Deployment Verification

### Health Checks

```bash
#!/bin/bash
set -e

echo "🔍 Verifying deployment..."

# 1. Health endpoint
echo "✓ Health check..."
curl -f http://localhost:3001/health || exit 1

# 2. API endpoints
echo "✓ Rankings endpoint..."
curl -f http://localhost:3001/api/elo/rankings?limit=5 || exit 1

echo "✓ Clubs endpoint..."
curl -f http://localhost:3001/api/elo/clubs?limit=5 || exit 1

echo "✓ Fixtures endpoint..."
curl -f http://localhost:3001/api/elo/fixtures?limit=5 || exit 1

# 3. Error handling
echo "✓ Error handling..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/non-existent)
if [ $STATUS = "404" ]; then echo "✓ 404 handling works"; else exit 1; fi

# 4. Response time
echo "✓ Response time..."
TIME=$(curl -w "%{time_total}" -o /dev/null -s http://localhost:3001/api/elo/rankings)
echo "  Response time: ${TIME}s"

echo "✅ All checks passed!"
```

### Monitor Logs

```bash
# Real-time logs
tail -f /var/log/clubelo.log

# Search for errors
grep ERROR /var/log/clubelo.log

# Check for slow queries
grep "Slow query" /var/log/clubelo.log

# Database connections
grep "database" /var/log/clubelo.log | tail -20
```

### Performance Monitoring

```bash
# CPU and memory
top -p $(pgrep -f 'node.*server-refactored.js')

# Network connections
netstat -anp | grep node

# Disk space
df -h /var/log

# Load average
uptime
```

---

## 🔄 Rollback Plan

### If Something Goes Wrong

```bash
# 1. Immediate: Switch back to old server
git checkout src/server.ts
npm run build

# 2. Kill new server
pkill -f 'node.*server-refactored.js'

# 3. Start old server
NODE_ENV=production node dist/server.js

# 4. Verify
curl http://localhost:3001/health

# 5. Investigate what went wrong
tail -100 /var/log/clubelo.log
```

### Rollback with PM2

```bash
# Keep old version running
pm2 start dist/server.js --name "clubelo-old"

# Switch traffic back to old version
# (Update your load balancer/proxy)

# Once verified working, delete new version
pm2 delete clubelo
```

---

## 📊 Monitoring After Deployment

### Set Up Alerts

Monitor these metrics:

```
✓ Response time > 1 second (alert)
✓ Error rate > 1% (alert)
✓ CPU usage > 80% (warning)
✓ Memory usage > 1GB (warning)
✓ Database connections > 80% of pool (warning)
✓ Disk space < 10% available (alert)
```

### Key Metrics to Track

1. **Request Volume**
   ```
   Requests per second
   Requests by endpoint
   ```

2. **Performance**
   ```
   P50/P95/P99 response times
   Error rates
   ```

3. **Resources**
   ```
   CPU usage
   Memory usage
   Database connections
   ```

4. **Business**
   ```
   Failed imports
   Cron job success rate
   Data freshness
   ```

---

## 📝 Deployment Checklist

### Before Deployment
- [ ] All tests pass locally
- [ ] Code compiles without errors
- [ ] Database backups created
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Staging deployment tested

### During Deployment
- [ ] Stop old server gracefully
- [ ] Deploy new code
- [ ] Start new server
- [ ] Verify health checks pass
- [ ] Check error logs
- [ ] Monitor resource usage

### After Deployment
- [ ] Test all endpoints manually
- [ ] Monitor logs for errors
- [ ] Check response times
- [ ] Verify cron jobs run
- [ ] Confirm no data loss
- [ ] Document deployment

---

## 🎯 Success Criteria

Deployment is successful when:

- ✅ Server starts without errors
- ✅ Health endpoint returns 200
- ✅ All API endpoints work
- ✅ Error handling works correctly
- ✅ No errors in logs
- ✅ Response times are acceptable
- ✅ No increase in error rate
- ✅ Cron jobs run successfully
- ✅ Database connectivity verified
- ✅ All team members notified

---

## 📞 Troubleshooting

### Server Won't Start

```bash
# Check for port conflicts
lsof -i :3001

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"

# Check environment variables
env | grep -E "DATABASE|CRON|NODE_ENV"

# Check logs
journalctl -u clubelo -n 50
```

### High Memory Usage

```bash
# Check for memory leaks
node --inspect dist/server-refactored.js

# Reduce max pool size
DATABASE_URL="..." NODE_ENV=production node dist/server-refactored.js
```

### Slow Response Times

```bash
# Check slow queries
grep "Slow query" /var/log/clubelo.log

# Check database load
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10"
```

---

## 📚 Related Documentation

- `TESTING_COMPLETE.md` - Deployment approval
- `QUICK_START_REFACTORED.md` - Development guide
- `TESTING_GUIDE.md` - Testing procedures
- `ARCHITECTURE_COMPARISON.md` - Architecture details

---

## ✅ Deployment Complete

Once all steps are followed and verified, your refactored server is successfully deployed! 🎉

---

**Questions? Check the documentation or review the testing results.**
