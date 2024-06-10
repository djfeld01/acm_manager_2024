import { auth } from "@/auth";

async function page() {
  const session = await auth();
  return (
    <>
      <div>{JSON.stringify(session?.user?.id, null, 2)}</div>
    </>
  );
}

export default page;
