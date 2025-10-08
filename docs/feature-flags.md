# Feature Flag System Documentation

## Overview

The feature flag system enables safe, gradual rollout of new features and A/B testing capabilities. It supports percentage-based rollouts, role-based targeting, user-specific targeting, and comprehensive analytics.

## Key Features

- **Gradual Rollout**: Roll out features to a percentage of users
- **Role-Based Targeting**: Enable features for specific user roles
- **User-Specific Targeting**: Enable features for specific users
- **Environment Support**: Different configurations per environment
- **Analytics**: Track feature usage and rollout effectiveness
- **Admin Interface**: Web-based management of feature flags
- **Emergency Controls**: Quickly disable features if issues arise
- **Dependencies**: Ensure prerequisite features are enabled

## Quick Start

### 1. Basic Usage

```tsx
import { useFeatureFlag, FeatureFlagGate } from "@/lib/feature-flags";

function MyComponent() {
  const isNewFeatureEnabled = useFeatureFlag("NEW_FEATURE");

  return (
    <div>
      {isNewFeatureEnabled ? <NewFeatureComponent /> : <OldFeatureComponent />}
    </div>
  );
}

// Or using the gate component
function MyComponentWithGate() {
  return (
    <FeatureFlagGate flag="NEW_FEATURE" fallback={<OldFeatureComponent />}>
      <NewFeatureComponent />
    </FeatureFlagGate>
  );
}
```

### 2. Provider Setup

```tsx
import { FeatureFlagProvider } from "@/lib/feature-flags";

function App() {
  return (
    <FeatureFlagProvider userId="user-123" userRole="admin">
      <MyApp />
    </FeatureFlagProvider>
  );
}
```

## Configuration

### Flag Definition

```typescript
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  NEW_FEATURE: {
    key: "NEW_FEATURE",
    name: "New Feature",
    description: "Description of the new feature",
    enabled: true,
    rolloutPercentage: 25, // 25% of users
    targetRoles: ["admin", "beta_user"], // Optional: specific roles
    targetUsers: ["user-123"], // Optional: specific users
    environment: "all", // 'development', 'staging', 'production', or 'all'
    startDate: new Date("2024-01-01"), // Optional: start date
    endDate: new Date("2024-12-31"), // Optional: end date
    metadata: {
      team: "frontend",
      priority: "high",
    },
  },
};
```

### Environment Overrides

```typescript
export const ENVIRONMENT_OVERRIDES = {
  development: {
    NEW_FEATURE: { rolloutPercentage: 100 }, // Always enabled in dev
  },
  staging: {
    NEW_FEATURE: { rolloutPercentage: 50 }, // 50% in staging
  },
  production: {
    // Use default configuration
  },
};
```

## API Reference

### Hooks

#### `useFeatureFlag(flagKey: string): boolean`

Check if a feature flag is enabled for the current user.

```tsx
const isEnabled = useFeatureFlag("NEW_FEATURE");
```

#### `useFeatureFlagDetails(flagKey: string): FeatureFlag | null`

Get detailed information about a feature flag.

```tsx
const flagDetails = useFeatureFlagDetails("NEW_FEATURE");
console.log(flagDetails?.rolloutPercentage);
```

#### `useAllFeatureFlags(): Record<string, FeatureFlag>`

Get all feature flags and their configurations.

```tsx
const allFlags = useAllFeatureFlags();
```

#### `useFeatureFlags(flagKeys: string[]): Record<string, boolean>`

Check multiple feature flags at once.

```tsx
const flags = useFeatureFlags(["NEW_FEATURE", "BETA_FEATURE"]);
```

### Components

#### `FeatureFlagGate`

Conditionally render content based on a feature flag.

```tsx
<FeatureFlagGate flag="NEW_FEATURE" fallback={<OldComponent />}>
  <NewComponent />
</FeatureFlagGate>
```

#### `MultiFeatureFlagGate`

Render different content based on multiple feature flags.

```tsx
<MultiFeatureFlagGate
  flags={{
    NEW_FEATURE: <NewComponent />,
    BETA_FEATURE: <BetaComponent />,
  }}
  fallback={<DefaultComponent />}
  mode="any" // or "all"
/>
```

#### `withFeatureFlag`

Higher-order component for feature flag gating.

```tsx
const ConditionalComponent = withFeatureFlag("NEW_FEATURE")(MyComponent);
```

### Core Classes

#### `FeatureFlagManager`

Core class for feature flag evaluation.

```typescript
const manager = new FeatureFlagManager({
  flags: FEATURE_FLAGS,
  userId: "user-123",
  userRole: "admin",
  environment: "production",
});

const isEnabled = manager.isEnabled("NEW_FEATURE");
```

#### `FeatureFlagAdmin`

Administrative interface for managing feature flags.

```typescript
const admin = new FeatureFlagAdmin({
  manager,
  allowedRoles: ["admin"],
});

// Update a flag
await admin.updateFlag("NEW_FEATURE", { rolloutPercentage: 50 }, "admin-123");

// Emergency disable
await admin.emergencyDisable("NEW_FEATURE", "Critical bug", "admin-123");

// Gradual rollout
await admin.gradualRollout("NEW_FEATURE", 100, 10, 30, "admin-123");
```

## Admin Interface

The system includes a comprehensive admin interface for managing feature flags:

### Features

- **Real-time Flag Management**: Enable/disable flags and adjust rollout percentages
- **Emergency Controls**: Quickly disable problematic features
- **Gradual Rollout**: Automatically increase rollout over time
- **Analytics Dashboard**: View usage statistics and rollout effectiveness
- **Export/Import**: Backup and restore flag configurations
- **Audit Logging**: Track all changes with timestamps and user information

### Access Control

The admin interface is restricted to users with appropriate roles:

```typescript
const admin = new FeatureFlagAdmin({
  manager,
  allowedRoles: ["admin", "super_admin"],
});
```

## Best Practices

### 1. Flag Naming

Use descriptive, hierarchical names:

```typescript
// Good
NEW_DASHBOARD_METRICS;
MOBILE_TOUCH_OPTIMIZATIONS;
BETA_ADVANCED_SEARCH;

// Avoid
FLAG1;
TEST;
TEMP_FIX;
```

### 2. Gradual Rollout Strategy

Start with a small percentage and gradually increase:

1. **0-5%**: Internal testing and early adopters
2. **5-25%**: Beta users and power users
3. **25-50%**: Broader rollout with monitoring
4. **50-100%**: Full rollout after validation

### 3. Monitoring and Alerts

- Monitor error rates and performance metrics
- Set up alerts for unusual patterns
- Use emergency disable for critical issues

### 4. Cleanup

Remove feature flags after full rollout:

```typescript
// Before cleanup - remove the flag check
if (useFeatureFlag("NEW_FEATURE")) {
  return <NewComponent />;
}
return <OldComponent />;

// After cleanup - use new component directly
return <NewComponent />;
```

### 5. Testing

Test both enabled and disabled states:

```typescript
describe("MyComponent", () => {
  it("renders new feature when flag is enabled", () => {
    // Mock flag as enabled
    render(<MyComponent />);
    expect(screen.getByText("New Feature")).toBeInTheDocument();
  });

  it("renders old feature when flag is disabled", () => {
    // Mock flag as disabled
    render(<MyComponent />);
    expect(screen.getByText("Old Feature")).toBeInTheDocument();
  });
});
```

## Rollout Checklist

### Pre-Rollout

- [ ] Feature flag configured with 0% rollout
- [ ] Code deployed with feature flag checks
- [ ] Monitoring and alerts configured
- [ ] Rollback plan documented
- [ ] Team notified of rollout schedule

### During Rollout

- [ ] Monitor error rates and performance
- [ ] Check user feedback and support tickets
- [ ] Verify analytics and usage patterns
- [ ] Gradually increase percentage as planned
- [ ] Document any issues or observations

### Post-Rollout

- [ ] Feature fully rolled out (100%)
- [ ] Monitoring shows stable performance
- [ ] Old code paths removed
- [ ] Feature flag removed from codebase
- [ ] Documentation updated

## Troubleshooting

### Common Issues

1. **Flag not updating**: Check cache clearing and user context
2. **Inconsistent behavior**: Verify rollout percentage calculation
3. **Permission errors**: Check user roles and admin access
4. **Performance issues**: Monitor flag evaluation frequency

### Debug Tools

```typescript
// Get flag evaluation details
const manager = useFeatureFlagManager();
const flag = manager?.getFlag("NEW_FEATURE");
console.log("Flag details:", flag);

// Check analytics
const analytics = manager?.getAnalytics();
console.log("Usage analytics:", analytics);
```

## Migration Guide

### From Simple Boolean Flags

```typescript
// Before
const ENABLE_NEW_FEATURE = true;

if (ENABLE_NEW_FEATURE) {
  // New feature code
}

// After
const isEnabled = useFeatureFlag("NEW_FEATURE");

if (isEnabled) {
  // New feature code
}
```

### From Environment Variables

```typescript
// Before
const isEnabled = process.env.ENABLE_NEW_FEATURE === "true";

// After
const isEnabled = useFeatureFlag("NEW_FEATURE");
```

## Security Considerations

- **Admin Access**: Restrict admin interface to authorized users only
- **Audit Logging**: Log all flag changes for security auditing
- **Rate Limiting**: Implement rate limiting for flag updates
- **Validation**: Validate all flag updates and configurations
- **Encryption**: Consider encrypting sensitive flag metadata

## Performance Considerations

- **Caching**: Flags are cached to avoid repeated evaluations
- **Batch Operations**: Use batch APIs for multiple flag checks
- **Lazy Loading**: Admin interface loads only when needed
- **Memory Usage**: Analytics data is limited to prevent memory leaks

## Integration Examples

### With Next.js Middleware

```typescript
import { createFeatureFlagMiddleware } from "@/lib/feature-flags/middleware";

export const middleware = createFeatureFlagMiddleware({
  flags: [
    {
      key: "NEW_ADMIN_PANEL",
      allowedRoles: ["admin"],
      redirectTo: "/unauthorized",
    },
  ],
  getUserContext: async (request) => {
    // Extract user context from request
    return { userId: "user-123", userRole: "admin" };
  },
});
```

### With Server Actions

```typescript
import { updateFeatureFlagAction } from "@/lib/feature-flags/server-actions";

async function handleFlagUpdate() {
  const result = await updateFeatureFlagAction(
    "NEW_FEATURE",
    { rolloutPercentage: 50 },
    "admin-123",
    "admin"
  );

  if (result.success) {
    // Handle success
  } else {
    // Handle error
  }
}
```

## Support

For questions or issues with the feature flag system:

1. Check this documentation
2. Review the test files for examples
3. Check the admin interface for flag status
4. Contact the development team
