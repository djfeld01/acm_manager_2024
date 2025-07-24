import { auth } from "@/auth";
import AddEmployeeDetails from "@/components/AddEmployeeDetails";
import UpdateEmployeeFacilitiesForm from "@/components/UpdateEmployeeFacilities2";
import UpdateUserPositionsForm from "@/components/UpdateUserPositionsForm";
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
import { Protected, ROLES } from "@/contexts/AuthContext";

export type Position =
  | "MANAGER"
  | "ASSISTANT"
  | "STORE_OWNER"
  | "ACM_OFFICE"
  | "AREA_MANAGER"
  | "TERMINATED"
  | null;

export interface Facility {
  sitelinkId: string;
  facilityAbbreviation: string;
}

export interface User {
  id?: string;
  fullName?: string | null;
  usersToFacilities?: { position?: Position; storageFacility: Facility }[];
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
  // Server-side auth check - middleware will handle most cases, but this is extra protection
  const session = await auth();

  if (!session?.user?.userDetailId) {
    return <div>Access denied. Please contact an administrator.</div>;
  }

  const { users, facilities } = await updatePage();

  return (
    <Protected
      roles={[ROLES.ADMIN, ROLES.SUPERVISOR]}
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-lg">
            You do not have permission to view this page.
          </p>
        </div>
      }
    >
      <div className="flex min-h-screen w-full flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-4 md:p-4">
          <div className="grid gap-2 md:grid-cols-2 md:gap-2 lg:grid-cols-3">
            <AddEmployeeDetails />
            <UpdateEmployeeFacilitiesForm
              users={users}
              facilities={facilities}
            />
            <UpdateUserPositionsForm />
          </div>
        </main>
      </div>
    </Protected>
  );
}
