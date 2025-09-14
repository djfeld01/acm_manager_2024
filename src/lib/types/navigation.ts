import { LucideIcon } from "lucide-react";
import { Role } from "@/db/schema/user";

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  children?: NavigationItem[];
  badge?: {
    text: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  };
}

export interface NavigationState {
  currentPath: string;
  isCollapsed: boolean;
  isMobile: boolean;
  activeSection: string;
}

export interface NavigationProps {
  items: NavigationItem[];
  currentPath: string;
  userRole: Role;
  isMobile: boolean;
  onNavigate?: (path: string) => void;
}

export interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  description?: string;
}
