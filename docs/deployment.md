# Production Deployment Guide

## Overview

This guide covers the complete production deployment process for the ACM Manager frontend rebuild, including monitoring, error tracking, and rollback procedures.

## Prerequisites

### Required Tools

- Node.js 18+ and npm
- Git
- Vercel CLI (for Vercel deployments)
- curl (for health checks)

### Environment Setup

1. **Copy environment variables**:

   ```bash
   cp .env.example .env.production
   ```

2. **Configure production variables**:
   - Database connection strings
   - API keys and secrets
   - Monitoring service credentials
   - Feature flag configurations

### Required Environment Variables

```bash
# Core Application
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"
SLACK_WEBHOOK_URL="https://hooks.slack.com/..."

# External Services
SITELINK_API_URL="https://api.sitelink.com"
SITELINK_API_KEY="your-production-api-key"
```

## Deployment Process

### Automated Deployment

Use the provided deployment script for a complete automated deployment:

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

### Manual Deployment Steps

1. **Pre-deployment checks**:

   ```bash
   npm run type-check
   npm run lint
   npm run test:ci
   ```

2. **Build the application**:

   ```bash
   npm run build
   ```

3. **Run health checks**:

   ```bash
   npm run health-check
   ```

4. **Deploy to platform**:
   ```bash
   vercel --prod
   ```

### Deployment Script Features

The deployment script (`scripts/deploy.sh`) includes:

- ✅ Pre-deployment validation
- ✅ Automated testing
- ✅ Build optimization
- ✅ Health checks
- ✅ Rollback tagging
- ✅ Slack notifications
- ✅ Post-deployment verification

## Monitoring and Observability

### Error Tracking

The application includes comprehensive error tracking:

- **Automatic Error Capture**: Global error handlers for unhandled exceptions
- **React Error Boundaries**: Catches component-level errors
- **Feature Flag Integration**: Tracks which features were enabled during errors
- **User Context**: Associates errors with specific users and roles

### Performance Monitoring

Real-time performance metrics collection:

- **Core Web Vitals**: FCP, LCP, FID, CLS
- **Load Times**: Page load and navigation timing
- **Device Detection**: Mobile vs desktop performance
- **Connection Awareness**: Network condition tracking

### Health Checks

Comprehensive health monitoring at `/api/health`:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": { "status": "healthy" },
    "externalServices": { "status": "healthy" },
    "featureFlags": { "status": "healthy" }
  }
}
```

### Monitoring Dashboard

Access the monitoring dashboard at `/monitoring-demo` (admin only):

- **System Health**: Real-time status of all services
- **Performance Metrics**: Charts and trends
- **Error Tracking**: Recent errors and patterns
- **System Information**: Memory usage, uptime, version info

## Rollback Procedures

### Automated Rollback

Use the rollback script for quick recovery:

```bash
# Rollback production to a specific tag
npm run rollback:production deploy-production-20241201-143022

# Rollback staging
npm run rollback:staging deploy-staging-20241201-120000
```

### Manual Rollback Steps

1. **Identify the target version**:

   ```bash
   git tag -l | grep deploy-production | tail -10
   ```

2. **Create rollback branch**:

   ```bash
   git checkout deploy-production-20241201-143022
   git checkout -b rollback-emergency-$(date +%Y%m%d-%H%M%S)
   ```

3. **Deploy the rollback**:

   ```bash
   npm ci
   npm run build
   vercel --prod
   ```

4. **Verify rollback**:
   ```bash
   curl -f https://your-app.com/api/health
   ```

### Rollback Decision Matrix

| Severity                | Response Time | Action                          |
| ----------------------- | ------------- | ------------------------------- |
| Critical Error          | Immediate     | Automated rollback              |
| High Error Rate         | < 5 minutes   | Manual rollback                 |
| Performance Degradation | < 15 minutes  | Investigate, rollback if needed |
| Minor Issues            | < 1 hour      | Fix forward or rollback         |

## Feature Flag Rollout Strategy

### Phase 1: Internal Testing (0-5%)

- Enable for admin users only
- Monitor error rates and performance
- Gather internal feedback

### Phase 2: Beta Testing (5-25%)

- Gradual rollout to beta users
- Monitor key metrics closely
- A/B test critical flows

### Phase 3: Broader Rollout (25-75%)

- Increase rollout percentage gradually
- Monitor business metrics
- Prepare for full rollout

### Phase 4: Full Rollout (75-100%)

- Complete feature deployment
- Monitor for 48 hours
- Plan feature flag cleanup

## Monitoring Alerts

### Critical Alerts (Immediate Response)

- Application down (health check fails)
- Error rate > 5%
- Response time > 5 seconds
- Database connection failures

### Warning Alerts (Response within 1 hour)

- Error rate > 1%
- Response time > 3 seconds
- Memory usage > 80%
- Feature flag failures

### Info Alerts (Response within 24 hours)

- Performance budget violations
- Unusual traffic patterns
- Feature flag rollout milestones

## Performance Budgets

### Core Web Vitals Targets

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Load Time Targets

- **Initial Page Load**: < 3s
- **Navigation**: < 1s
- **API Responses**: < 500ms

## Security Considerations

### Deployment Security

- Environment variables are encrypted
- Secrets rotation schedule
- Access control for deployment tools
- Audit logging for all deployments

### Runtime Security

- Security headers configured
- HTTPS enforcement
- Content Security Policy
- Rate limiting enabled

## Troubleshooting

### Common Issues

1. **Build Failures**:

   ```bash
   # Clear cache and rebuild
   rm -rf .next node_modules
   npm ci
   npm run build
   ```

2. **Health Check Failures**:

   ```bash
   # Check application logs
   vercel logs your-app-name

   # Test health endpoint locally
   curl -v http://localhost:3000/api/health
   ```

3. **Performance Issues**:

   ```bash
   # Analyze bundle size
   npm run analyze

   # Check for memory leaks
   node --inspect npm start
   ```

### Emergency Contacts

- **On-call Engineer**: [Contact Info]
- **DevOps Team**: [Contact Info]
- **Product Owner**: [Contact Info]

### Escalation Procedures

1. **Level 1**: Development team (0-30 minutes)
2. **Level 2**: Senior engineers (30-60 minutes)
3. **Level 3**: Management and stakeholders (60+ minutes)

## Post-Deployment Checklist

### Immediate (0-15 minutes)

- [ ] Health check passes
- [ ] Key user flows work
- [ ] Error rates normal
- [ ] Performance within budgets

### Short-term (15 minutes - 2 hours)

- [ ] Monitor error tracking
- [ ] Check performance metrics
- [ ] Verify feature flags
- [ ] Review user feedback

### Long-term (2-24 hours)

- [ ] Business metrics stable
- [ ] No performance regressions
- [ ] Feature adoption tracking
- [ ] Plan next iteration

## Maintenance Windows

### Scheduled Maintenance

- **Frequency**: Monthly
- **Duration**: 2 hours
- **Time**: Sunday 2-4 AM UTC
- **Notification**: 48 hours advance notice

### Emergency Maintenance

- **Authorization**: CTO approval required
- **Communication**: Immediate user notification
- **Documentation**: Post-incident review required

## Backup and Recovery

### Database Backups

- **Frequency**: Daily automated backups
- **Retention**: 30 days
- **Testing**: Monthly restore tests

### Application Backups

- **Git Tags**: All deployments tagged
- **Asset Backups**: CDN and static files
- **Configuration**: Environment variables backed up

### Recovery Procedures

1. **Data Recovery**: Restore from latest backup
2. **Application Recovery**: Deploy from git tag
3. **Configuration Recovery**: Restore environment variables
4. **Verification**: Full system health check

## Compliance and Auditing

### Audit Requirements

- All deployments logged
- Change approval process
- Security scan results
- Performance test results

### Compliance Checks

- [ ] Security headers configured
- [ ] Data encryption enabled
- [ ] Access controls verified
- [ ] Monitoring alerts configured

## Continuous Improvement

### Metrics to Track

- Deployment frequency
- Lead time for changes
- Mean time to recovery
- Change failure rate

### Regular Reviews

- **Weekly**: Performance and error review
- **Monthly**: Deployment process review
- **Quarterly**: Architecture and tooling review
- **Annually**: Complete process overhaul
