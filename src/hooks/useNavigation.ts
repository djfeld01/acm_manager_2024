"use client";

import { useSession } from "next-auth/react";
import {
  getNavigationForUser,
  getFlatNavigationItems,
  getPrimaryNavigationItems,
} from "@/lib/navigation";

export function useNavigation() {
  const { data: session } = useSession();

  const userRole = session?.user?.role || "USER";
  const hasLocations = true; // You might want to fetch this from a context or API

  return {
    userRole,
    hasLocations,
    navigationSections: getNavigationForUser(userRole, hasLocations),
    flatItems: getFlatNavigationItems(userRole, hasLocations),
    primaryItems: getPrimaryNavigationItems(userRole, hasLocations),
    userName: session?.user?.name,
    userImage: session?.user?.image,
    isAuthenticated: !!session?.user,
  };
}
