"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings,
  Users,
  TrendingUp,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";
import { FeatureFlagAdmin } from "@/lib/feature-flags/admin";
import { FeatureFlag } from "@/lib/feature-flags/types";
import { useFeatureFlagManager } from "@/lib/feature-flags/hooks";

interface FeatureFlagAdminProps {
  userRole: string;
  userId: string;
}

export function FeatureFlagAdminPanel({
  userRole,
  userId,
}: FeatureFlagAdminProps) {
  const manager = useFeatureFlagManager();
  const [admin, setAdmin] = useState<FeatureFlagAdmin | null>(null);
  const [flags, setFlags] = useState<
    Array<FeatureFlag & { currentlyEnabled: boolean }>
  >([]);
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFlags = useCallback(
    (adminInstance: FeatureFlagAdmin) => {
      try {
        const flagsWithStatus = adminInstance.getAllFlagsWithStatus(userId);
        setFlags(flagsWithStatus);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load flags");
      }
    },
    [userId]
  );

  useEffect(() => {
    if (manager) {
      const adminInstance = new FeatureFlagAdmin({
        manager,
        allowedRoles: ["admin", "super_admin"],
      });
      setAdmin(adminInstance);
      loadFlags(adminInstance);
    }
  }, [manager, loadFlags]);

  const updateFlag = async (flagKey: string, updates: Partial<FeatureFlag>) => {
    if (!admin) return;

    setLoading(true);
    setError(null);

    try {
      const result = await admin.updateFlag(flagKey, updates, userId);
      if (result.success) {
        loadFlags(admin);
      } else {
        setError(result.error || "Failed to update flag");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update flag");
    } finally {
      setLoading(false);
    }
  };

  const emergencyDisable = async (flagKey: string, reason: string) => {
    if (!admin) return;

    setLoading(true);
    try {
      const result = await admin.emergencyDisable(flagKey, reason, userId);
      if (result.success) {
        loadFlags(admin);
      } else {
        setError(result.error || "Failed to disable flag");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable flag");
    } finally {
      setLoading(false);
    }
  };

  if (!admin || !admin.hasAdminAccess(userRole)) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don&apos;t have permission to access the feature flag admin panel.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Flag Administration</h1>
          <p className="text-muted-foreground">
            Manage feature rollouts and monitor usage
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => loadFlags(admin)}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <ExportImportButtons admin={admin} userId={userId} />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="flags" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="rollout">Rollout Management</TabsTrigger>
        </TabsList>

        <TabsContent value="flags" className="space-y-4">
          <div className="grid gap-4">
            {flags.map((flag) => (
              <FlagCard
                key={flag.key}
                flag={flag}
                onUpdate={(updates) => updateFlag(flag.key, updates)}
                onEmergencyDisable={(reason) =>
                  emergencyDisable(flag.key, reason)
                }
                loading={loading}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsPanel admin={admin} />
        </TabsContent>

        <TabsContent value="rollout" className="space-y-4">
          <RolloutManagement admin={admin} userId={userId} flags={flags} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface FlagCardProps {
  flag: FeatureFlag & { currentlyEnabled: boolean };
  onUpdate: (updates: Partial<FeatureFlag>) => void;
  onEmergencyDisable: (reason: string) => void;
  loading: boolean;
}

function FlagCard({
  flag,
  onUpdate,
  onEmergencyDisable,
  loading,
}: FlagCardProps) {
  const [rolloutPercentage, setRolloutPercentage] = useState(
    flag.rolloutPercentage
  );
  const [emergencyReason, setEmergencyReason] = useState("");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {flag.name}
              <Badge variant={flag.enabled ? "default" : "secondary"}>
                {flag.enabled ? "Enabled" : "Disabled"}
              </Badge>
              {flag.currentlyEnabled && (
                <Badge variant="outline" className="text-green-600">
                  <Eye className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{flag.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={flag.enabled}
              onCheckedChange={(enabled) => onUpdate({ enabled })}
              disabled={loading}
            />
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Zap className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Emergency Disable</DialogTitle>
                  <DialogDescription>
                    This will immediately disable the feature flag for all
                    users.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reason">Reason for emergency disable</Label>
                    <Textarea
                      id="reason"
                      value={emergencyReason}
                      onChange={(e) => setEmergencyReason(e.target.value)}
                      placeholder="Describe the issue that requires emergency disable..."
                    />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => onEmergencyDisable(emergencyReason)}
                    disabled={!emergencyReason.trim() || loading}
                    className="w-full"
                  >
                    Emergency Disable
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Rollout Percentage: {rolloutPercentage}%</Label>
            <Slider
              value={[rolloutPercentage]}
              onValueChange={([value]) => setRolloutPercentage(value)}
              onValueCommit={([value]) =>
                onUpdate({ rolloutPercentage: value })
              }
              max={100}
              step={1}
              className="mt-2"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Target Roles</Label>
            <div className="flex flex-wrap gap-1">
              {flag.targetRoles?.map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              )) || (
                <span className="text-sm text-muted-foreground">All roles</span>
              )}
            </div>
          </div>
        </div>

        {flag.metadata && (
          <div className="space-y-2">
            <Label>Metadata</Label>
            <div className="text-sm text-muted-foreground">
              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(flag.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsPanel({ admin }: { admin: FeatureFlagAdmin }) {
  const [analytics, setAnalytics] = useState<any[]>([]);

  useEffect(() => {
    const data = admin.getAnalytics();
    setAnalytics(data);
  }, [admin]);

  const flagUsage = analytics.reduce((acc, entry) => {
    if (!acc[entry.flagKey]) {
      acc[entry.flagKey] = { total: 0, enabled: 0 };
    }
    acc[entry.flagKey].total++;
    if (entry.enabled) {
      acc[entry.flagKey].enabled++;
    }
    return acc;
  }, {} as Record<string, { total: number; enabled: number }>);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(
              Object.entries(flagUsage) as Array<
                [string, { total: number; enabled: number }]
              >
            ).map(([flagKey, stats]) => (
              <div key={flagKey} className="flex items-center justify-between">
                <span className="font-medium">{flagKey}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {stats.enabled}/{stats.total} users
                  </span>
                  <Badge variant="outline">
                    {stats.total > 0
                      ? Math.round((stats.enabled / stats.total) * 100)
                      : 0}
                    %
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RolloutManagement({
  admin,
  userId,
  flags,
}: {
  admin: FeatureFlagAdmin;
  userId: string;
  flags: Array<FeatureFlag & { currentlyEnabled: boolean }>;
}) {
  const [selectedFlag, setSelectedFlag] = useState<string>("");
  const [targetPercentage, setTargetPercentage] = useState(100);
  const [incrementPercentage, setIncrementPercentage] = useState(10);
  const [intervalMinutes, setIntervalMinutes] = useState(30);

  const startGradualRollout = async () => {
    if (!selectedFlag) return;

    try {
      await admin.gradualRollout(
        selectedFlag,
        targetPercentage,
        incrementPercentage,
        intervalMinutes,
        userId
      );
    } catch (error) {
      console.error("Failed to start gradual rollout:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gradual Rollout Management</CardTitle>
        <p className="text-sm text-muted-foreground">
          Safely increase feature flag rollout over time
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Feature Flag</Label>
            <select
              value={selectedFlag}
              onChange={(e) => setSelectedFlag(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a flag...</option>
              {flags.map((flag) => (
                <option key={flag.key} value={flag.key}>
                  {flag.name} (Current: {flag.rolloutPercentage}%)
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Target Percentage</Label>
            <Input
              type="number"
              value={targetPercentage}
              onChange={(e) => setTargetPercentage(Number(e.target.value))}
              min={0}
              max={100}
            />
          </div>
          <div>
            <Label>Increment Percentage</Label>
            <Input
              type="number"
              value={incrementPercentage}
              onChange={(e) => setIncrementPercentage(Number(e.target.value))}
              min={1}
              max={50}
            />
          </div>
          <div>
            <Label>Interval (minutes)</Label>
            <Input
              type="number"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              min={5}
              max={1440}
            />
          </div>
        </div>
        <Button
          onClick={startGradualRollout}
          disabled={!selectedFlag}
          className="w-full"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Start Gradual Rollout
        </Button>
      </CardContent>
    </Card>
  );
}

function ExportImportButtons({
  admin,
  userId,
}: {
  admin: FeatureFlagAdmin;
  userId: string;
}) {
  const [importData, setImportData] = useState("");

  const exportConfig = () => {
    const config = admin.exportConfig();
    const blob = new Blob([config], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feature-flags-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = async () => {
    try {
      const result = await admin.importConfig(importData, userId);
      if (result.success) {
        alert(`Successfully imported ${result.imported} feature flags`);
        setImportData("");
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      alert("Import failed: Invalid JSON");
    }
  };

  return (
    <>
      <Button variant="outline" onClick={exportConfig}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Feature Flag Configuration</DialogTitle>
            <DialogDescription>
              Paste the JSON configuration to import feature flags.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste JSON configuration here..."
              rows={10}
            />
            <Button
              onClick={importConfig}
              disabled={!importData.trim()}
              className="w-full"
            >
              Import Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
