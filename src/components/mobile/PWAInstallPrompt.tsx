"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePWAInstall } from "@/lib/mobile/pwa";
import { useDeviceInfo } from "@/lib/mobile/device-detection";
import { Download, X, Smartphone, Monitor } from "lucide-react";

export interface PWAInstallPromptProps {
  title?: string;
  description?: string;
  installText?: string;
  dismissText?: string;
  className?: string;
  onInstall?: () => void;
  onDismiss?: () => void;
  autoShow?: boolean;
  showDelay?: number;
}

export function PWAInstallPrompt({
  title = "Install ACM Manager",
  description = "Install our app for a better experience with offline access and push notifications.",
  installText = "Install App",
  dismissText = "Not Now",
  className,
  onInstall,
  onDismiss,
  autoShow = true,
  showDelay = 3000,
}: PWAInstallPromptProps) {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { isMobile, isIOS, isAndroid } = useDeviceInfo();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    if (autoShow && isInstallable && !isInstalled && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, showDelay);

      return () => clearTimeout(timer);
    }
  }, [autoShow, isInstallable, isInstalled, isDismissed, showDelay]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      onInstall?.();
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    onDismiss?.();
  };

  // Don't show if already installed or not installable
  if (isInstalled || (!isInstallable && !isIOS)) {
    return null;
  }

  // Don't show if dismissed and not forced to show
  if (isDismissed && !isVisible) {
    return null;
  }

  // iOS-specific install instructions
  if (isIOS && !isInstalled) {
    return (
      <Card className={cn("border-primary/20 bg-primary/5", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-sm">
            To install this app on your iPhone, tap the share button and then
            &quot;Add to Home Screen&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 border border-current rounded flex items-center justify-center">
                <div className="w-2 h-2 border-t border-current"></div>
              </div>
              <span>Share</span>
            </div>
            <span>→</span>
            <span>&quot;Add to Home Screen&quot;</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button onClick={handleInstall} size="sm" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            {installText}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="flex-1"
          >
            {dismissText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export interface PWAStatusIndicatorProps {
  className?: string;
}

export function PWAStatusIndicator({ className }: PWAStatusIndicatorProps) {
  const { isInstalled } = usePWAInstall();
  const { isStandalone } = useDeviceInfo();

  if (!isInstalled && !isStandalone) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground",
        className
      )}
    >
      <Monitor className="h-3 w-3" />
      <span>App Mode</span>
    </div>
  );
}

export interface PWAFeatureCardProps {
  features?: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
  }>;
  className?: string;
}

export function PWAFeatureCard({
  features = [
    {
      icon: <Download className="h-5 w-5" />,
      title: "Offline Access",
      description: "Access your data even without internet connection",
    },
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: "Native Experience",
      description: "App-like experience with smooth animations",
    },
    {
      icon: <Monitor className="h-5 w-5" />,
      title: "Quick Launch",
      description: "Launch directly from your home screen",
    },
  ],
  className,
}: PWAFeatureCardProps) {
  const { isInstallable, isInstalled } = usePWAInstall();

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Why Install Our App?</CardTitle>
        <CardDescription>
          Get the best experience with these features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="text-primary mt-0.5">{feature.icon}</div>
              <div>
                <h4 className="font-medium text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <PWAInstallPrompt className="mt-4" autoShow={false} />
      </CardContent>
    </Card>
  );
}
