import { auth } from "@/auth";
import AddEmployeeDetails from "@/components/AddEmployeeDetails";
import UpdateEmployeeFacilitiesForm from "@/components/UpdateEmployeeFacilities2";
import { db } from "@/db";
import { Role } from "@/db/schema/user";
import {
  getAllFacilities,
  getConnectedFacilities,
} from "@/lib/controllers/facilityController";
import {
  getUsers,
  getUsersWithConnectedFacilities,
  UserToFacility,
} from "@/lib/controllers/userController";
import { useState } from "react";

interface Facility {
  sitelinkId: string;
  facilityAbbreviation: string;
}
interface User {
  id?: string;
  fullName?: string | null;
  usersToFacilities?: { storageFacility: Facility }[];
}

// Fetch users, facilities, and user-facility associations
const fetchUsers = async (): Promise<User[]> => {
  const users = (await getUsersWithConnectedFacilities()) || [];
  return users;
};

const fetchFacilities = async (): Promise<Facility[]> => {
  const facilities = await getAllFacilities();
  return facilities;
};

async function updatePage() {
  const users = await fetchUsers();
  const facilities = await fetchFacilities();
  return { users, facilities };
}

export default async function Page() {
  const session = await auth();
  const { users, facilities } = await updatePage();

  if (session?.user?.role === "ADMIN" || session?.user?.role === "SUPERVISOR") {
    // const users = await getUsersWithConnectedFacilities();
    // const facilities = await db.query.storageFacilities.findMany({
    //   columns: { sitelinkId: true, facilityAbbreviation: true },
    // });

    return (
      <div className="flex min-h-screen w-full flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-4 md:p-4">
          <div className="grid gap-2 md:grid-cols-2 md:gap-2 lg:grid-cols-3">
            <AddEmployeeDetails />
            <UpdateEmployeeFacilitiesForm
              users={users}
              facilities={facilities}
            />
          </div>
        </main>
      </div>
    );
  }

  if (session?.user?.role === "USER") {
    return <p>You do not have access to this page</p>;
  }
  return <p>You are not authorized to view this page!</p>;
}
