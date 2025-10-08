#!/bin/bash

# Rollback script for production deployments
set -e

echo "🔄 Starting rollback process..."

# Configuration
ENVIRONMENT=${1:-production}
TARGET_TAG=${2}

if [ -z "$TARGET_TAG" ]; then
  echo "❌ Error: Please specify a target tag to rollback to"
  echo "Usage: ./scripts/rollback.sh [environment] [tag]"
  echo "Example: ./scripts/rollback.sh production deploy-production-20241201-143022"
  exit 1
fi

echo "📋 Rollback Configuration:"
echo "  Environment: $ENVIRONMENT"
echo "  Target Tag: $TARGET_TAG"

# Verify the tag exists
if ! git tag -l | grep -q "^$TARGET_TAG$"; then
  echo "❌ Error: Tag '$TARGET_TAG' not found"
  echo "Available tags:"
  git tag -l | grep "deploy-$ENVIRONMENT" | tail -10
  exit 1
fi

# Confirmation prompt
echo "⚠️ WARNING: This will rollback $ENVIRONMENT to $TARGET_TAG"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Rollback cancelled"
  exit 1
fi

# Create rollback branch
ROLLBACK_BRANCH="rollback-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S)"
echo "🌿 Creating rollback branch: $ROLLBACK_BRANCH"

# Checkout the target tag
git checkout $TARGET_TAG
git checkout -b $ROLLBACK_BRANCH

# Install dependencies for the rollback version
echo "📦 Installing dependencies..."
npm ci --production=false

# Build the rollback version
echo "🏗️ Building rollback version..."
npm run build || {
  echo "❌ Build failed for rollback version. Aborting."
  git checkout main
  git branch -D $ROLLBACK_BRANCH
  exit 1
}

# Deploy the rollback
case $ENVIRONMENT in
  "production")
    echo "🔄 Rolling back production..."
    if command -v vercel &> /dev/null; then
      vercel --prod --yes
    else
      echo "⚠️ Vercel CLI not found. Please rollback manually."
    fi
    ;;
  "staging")
    echo "🔄 Rolling back staging..."
    if command -v vercel &> /dev/null; then
      vercel --yes
    else
      echo "⚠️ Vercel CLI not found. Please rollback manually."
    fi
    ;;
  *)
    echo "❌ Unknown environment: $ENVIRONMENT"
    exit 1
    ;;
esac

# Wait for rollback to be ready
echo "⏳ Waiting for rollback to be ready..."
sleep 30

# Health check on rolled back application
HEALTH_URL="https://your-app.vercel.app/api/health"
if command -v curl &> /dev/null; then
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Rollback health check passed"
  else
    echo "❌ Rollback health check failed (HTTP $HTTP_STATUS)"
    echo "⚠️ Manual intervention may be required"
  fi
else
  echo "⚠️ curl not found. Skipping health check."
fi

# Send rollback notification
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🔄 Rollback completed!\n*Environment:* $ENVIRONMENT\n*Rolled back to:* $TARGET_TAG\n*Rollback branch:* $ROLLBACK_BRANCH\"}" \
    $SLACK_WEBHOOK_URL
fi

# Clean up
git checkout main
echo "🧹 Rollback branch '$ROLLBACK_BRANCH' created for reference"

echo "✅ Rollback completed successfully!"
echo "📊 Rollback Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Rolled back to: $TARGET_TAG"
echo "  Rollback branch: $ROLLBACK_BRANCH"
echo "  Timestamp: $(date)"

echo ""
echo "📝 Next steps:"
echo "1. Monitor the application for stability"
echo "2. Investigate the issue that caused the rollback"
echo "3. Fix the issue and prepare a new deployment"
echo "4. Clean up the rollback branch when no longer needed:"
echo "   git branch -D $ROLLBACK_BRANCH"