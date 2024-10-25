import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CircleUser,
  CreditCard,
  DollarSign,
  Menu,
  Package2,
  Search,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/auth";
import ActivityCard from "@/components/ActivityCard";
import { getFacilities } from "@/lib/controllers/facilityController";
import {
  getActivitiesByDates,
  getActivitiesByEmployee,
  getActivitiesByMonth2,
} from "@/lib/controllers/activityController";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { getUsers } from "@/lib/controllers/userController";
import { totalmem } from "os";
import LocationCards from "@/components/LocationCards";

export default async function Dashboard() {
  const session = await auth();

  const results = await getActivitiesByMonth2(
    session?.user?.id || "",
    new Date(new Date().getFullYear(), 0, 1),
    new Date()
  );
  let midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const now = new Date();
  const todaysRentals = await getActivitiesByDates(
    session?.user?.id || "",
    midnight,
    now
  );
  console.log(todaysRentals);
  return (
    <div className="flex min-h-screen w-full flex-col">
      <LocationCards todaysRentals={2} locationsNumbers={results} />
    </div>
  );
}
