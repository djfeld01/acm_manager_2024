import { auth } from "@/auth";

export default async function Page() {
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    return <p>You are an ADMIN, welcome!</p>;
  }

  if (session?.user?.role === "USER") {
    return <p>You are an USER, welcome!</p>;
  }
  return <p>You are not authorized to view this page!</p>;
}
