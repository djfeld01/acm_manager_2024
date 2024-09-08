import { auth } from "@/auth";
import AddEmployeeDetails from "@/components/AddEmployeeDetails";
import { db } from "@/db";

export default async function Page() {
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-4 md:p-4">
          <div className="grid gap-2 md:grid-cols-2 md:gap-2 lg:grid-cols-3">
            <AddEmployeeDetails />
          </div>
        </main>
      </div>
    );
  }

  if (session?.user?.role === "USER") {
    return <p>You are an USER, welcome!</p>;
  }
  return <p>You are not authorized to view this page!</p>;
}
