"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNavigation } from "./NavigationContext";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  User,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@/components/auth/AuthButtons";
import Image from "next/image";
import acmLogo from "@/public/images/acm_logo.svg";
export default function DesktopNavigation() {
  const { navItems, userName, userImage, userRole } = useNavigation();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };
  const isActive = (href: string) => {
    if (href === "/dashboard" && pathname === "/") return true;
    return pathname.startsWith(href) && href !== "/";
  };
  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-50 h-full bg-background border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {" "}
      {/* Header */}{" "}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {" "}
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            {" "}
            <Image
              alt="ACM Logo"
              src={acmLogo}
              width={120}
              height={40}
              className="h-8 w-auto"
            />{" "}
          </Link>
        )}{" "}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {" "}
          <Menu className="h-4 w-4" />{" "}
        </Button>{" "}
      </div>{" "}
      {/* Navigation Items */}{" "}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {" "}
        <div className="space-y-1">
          {" "}
          {navItems.map((item) => (
            <div key={item.id}>
              {" "}
              {/* Main Nav Item */}{" "}
              <div className="flex items-center">
                {" "}
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                    isActive(item.href) && "bg-accent text-accent-foreground",
                    collapsed ? "justify-center" : "flex-1"
                  )}
                >
                  {" "}
                  <item.icon className="h-4 w-4 shrink-0" />{" "}
                  {!collapsed && (
                    <>
                      {" "}
                      <span className="truncate">{item.label}</span>{" "}
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          {" "}
                          {item.badge}{" "}
                        </span>
                      )}{" "}
                    </>
                  )}{" "}
                </Link>{" "}
                {/* Expand/Collapse for items with children */}{" "}
                {!collapsed && item.children && item.children.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => toggleExpanded(item.id)}
                  >
                    {" "}
                    {expandedItems.has(item.id) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}{" "}
                  </Button>
                )}{" "}
              </div>{" "}
              {/* Children/Submenu Items */}{" "}
              {!collapsed && item.children && expandedItems.has(item.id) && (
                <div className="ml-6 mt-1 space-y-1">
                  {" "}
                  {item.children.map((child) => (
                    <Link
                      key={child.id}
                      href={child.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                        isActive(child.href) &&
                          "bg-accent text-accent-foreground"
                      )}
                    >
                      {" "}
                      <child.icon className="h-3 w-3 shrink-0" />{" "}
                      <span className="truncate">{child.label}</span>{" "}
                    </Link>
                  ))}{" "}
                </div>
              )}{" "}
            </div>
          ))}{" "}
        </div>{" "}
      </nav>{" "}
      {/* User Section */}{" "}
      <div className="border-t p-3">
        {" "}
        {collapsed ? (
          <DropdownMenu>
            {" "}
            <DropdownMenuTrigger asChild>
              {" "}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                {" "}
                {userImage ? (
                  <Image
                    src={userImage}
                    alt="User Avatar"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}{" "}
              </Button>{" "}
            </DropdownMenuTrigger>{" "}
            <DropdownMenuContent align="start" side="right">
              {" "}
              <DropdownMenuLabel>
                {" "}
                {userName || "User"}{" "}
                {userRole && (
                  <div className="text-xs text-muted-foreground">
                    {userRole}
                  </div>
                )}{" "}
              </DropdownMenuLabel>{" "}
              <DropdownMenuSeparator />{" "}
              <DropdownMenuItem>
                {" "}
                <SettingsIcon className="mr-2 h-4 w-4" /> Settings{" "}
              </DropdownMenuItem>{" "}
              <DropdownMenuSeparator />{" "}
              <DropdownMenuItem>
                {" "}
                <SignOutButton />{" "}
              </DropdownMenuItem>{" "}
            </DropdownMenuContent>{" "}
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            {" "}
            <DropdownMenuTrigger asChild>
              {" "}
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3 py-2"
              >
                {" "}
                {userImage ? (
                  <Image
                    src={userImage}
                    alt="User Avatar"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}{" "}
                <div className="flex flex-col items-start text-left">
                  {" "}
                  <span className="text-sm font-medium truncate">
                    {userName || "User"}
                  </span>{" "}
                  {userRole && (
                    <span className="text-xs text-muted-foreground">
                      {userRole}
                    </span>
                  )}{" "}
                </div>{" "}
              </Button>{" "}
            </DropdownMenuTrigger>{" "}
            <DropdownMenuContent align="start" side="top">
              {" "}
              <DropdownMenuItem>
                {" "}
                <SettingsIcon className="mr-2 h-4 w-4" /> Settings{" "}
              </DropdownMenuItem>{" "}
              <DropdownMenuSeparator />{" "}
              <DropdownMenuItem>
                {" "}
                <SignOutButton />{" "}
              </DropdownMenuItem>{" "}
            </DropdownMenuContent>{" "}
          </DropdownMenu>
        )}{" "}
      </div>{" "}
    </div>
  );
}
