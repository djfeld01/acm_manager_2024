#!/bin/bash

# Production deployment script
set -e

echo "🚀 Starting deployment process..."

# Configuration
ENVIRONMENT=${1:-production}
BRANCH=${2:-main}
BUILD_ID=$(date +%Y%m%d-%H%M%S)

echo "📋 Deployment Configuration:"
echo "  Environment: $ENVIRONMENT"
echo "  Branch: $BRANCH"
echo "  Build ID: $BUILD_ID"

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "❌ Error: Currently on branch '$CURRENT_BRANCH', expected '$BRANCH'"
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Error: Uncommitted changes detected. Please commit or stash changes."
  exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin $BRANCH

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Run tests
echo "🧪 Running tests..."
npm run test:ci || {
  echo "❌ Tests failed. Deployment aborted."
  exit 1
}

# Type checking
echo "🔍 Running type checks..."
npm run type-check || {
  echo "❌ Type checking failed. Deployment aborted."
  exit 1
}

# Linting
echo "🔍 Running linter..."
npm run lint || {
  echo "❌ Linting failed. Deployment aborted."
  exit 1
}

# Build application
echo "🏗️ Building application..."
npm run build || {
  echo "❌ Build failed. Deployment aborted."
  exit 1
}

# Run bundle analysis (optional)
if [ "$ANALYZE_BUNDLE" = "true" ]; then
  echo "📊 Analyzing bundle..."
  ANALYZE=true npm run build
fi

# Database migrations (if applicable)
if [ -f "prisma/schema.prisma" ]; then
  echo "🗄️ Running database migrations..."
  npx prisma migrate deploy
fi

# Health check before deployment
echo "🏥 Running health checks..."
npm run health-check || {
  echo "❌ Health check failed. Deployment aborted."
  exit 1
}

# Deploy based on environment
case $ENVIRONMENT in
  "production")
    echo "🚀 Deploying to production..."
    # Example: Deploy to Vercel
    if command -v vercel &> /dev/null; then
      vercel --prod --yes
    else
      echo "⚠️ Vercel CLI not found. Please deploy manually."
    fi
    ;;
  "staging")
    echo "🚀 Deploying to staging..."
    # Example: Deploy to staging environment
    if command -v vercel &> /dev/null; then
      vercel --yes
    else
      echo "⚠️ Vercel CLI not found. Please deploy manually."
    fi
    ;;
  *)
    echo "❌ Unknown environment: $ENVIRONMENT"
    exit 1
    ;;
esac

# Post-deployment verification
echo "✅ Running post-deployment verification..."

# Wait for deployment to be ready
sleep 30

# Health check on deployed application
HEALTH_URL="https://your-app.vercel.app/api/health"
if command -v curl &> /dev/null; then
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Health check passed"
  else
    echo "❌ Health check failed (HTTP $HTTP_STATUS)"
    exit 1
  fi
else
  echo "⚠️ curl not found. Skipping health check."
fi

# Send deployment notification
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚀 Deployment completed successfully!\n*Environment:* $ENVIRONMENT\n*Branch:* $BRANCH\n*Build ID:* $BUILD_ID\"}" \
    $SLACK_WEBHOOK_URL
fi

echo "🎉 Deployment completed successfully!"
echo "📊 Deployment Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Branch: $BRANCH"
echo "  Build ID: $BUILD_ID"
echo "  Timestamp: $(date)"

# Tag the deployment
git tag "deploy-$ENVIRONMENT-$BUILD_ID"
git push origin "deploy-$ENVIRONMENT-$BUILD_ID"

echo "🏷️ Tagged deployment: deploy-$ENVIRONMENT-$BUILD_ID"