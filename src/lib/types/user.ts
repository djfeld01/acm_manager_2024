import { Role } from "@/db/schema/user";

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  image?: string | null;
  userDetailId?: string | null;
  facilities: Facility[];
}

export interface Facility {
  id: string;
  sitelinkId: string;
  facilityName: string;
  facilityAbbreviation: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface UserSession {
  user: User;
  expires: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  defaultView: "dashboard" | "payroll" | "locations";
  notifications: {
    email: boolean;
    push: boolean;
    alerts: boolean;
  };
}
