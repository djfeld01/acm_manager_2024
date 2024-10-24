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
  const firstLocation = await db.query.storageFacilities.findFirst();
  const session = await auth();

  const results = await getActivitiesByMonth2(
    session?.user?.id || "",
    new Date(new Date().getFullYear(), 0, 1),
    new Date()
  );

  return (
    <div className="flex min-h-screen w-full flex-col">
      <LocationCards locationsNumbers={results} />
    </div>
  );
}
function getactivitiesByMonth2(
  arg0: string,
  arg1: Date,
  arg2: Date,
  arg3: string
) {
  throw new Error("Function not implemented.");
}
