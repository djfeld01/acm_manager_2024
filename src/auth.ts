import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import GOOGLE from "next-auth/providers/google";
import NextAuth from "next-auth";
import {
  accounts,
  users,
  verificationTokens,
  sessions,
  userDetails,
} from "./db/schema";
import { eq } from "drizzle-orm";
import { userDetailsRelations } from "./db/schema";
import { getUserFacilities } from "@/lib/controllers/userController/getUserFacilities";

declare module "next-auth" {
  interface User {
    role?: string | null;
    userDetailId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
      userDetailId?: string | null;
      facilities?: Array<{
        sitelinkId: string;
        facilityName: string;
        facilityAbbreviation: string;
        position: string | null;
        primarySite: boolean | null;
        rentsUnits: boolean | null;
      }>;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // debug: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GOOGLE,
    // GOOGLE({
    //   profile(profile) {
    //     console.log(profile.role);
    //     return {
    //       id: profile.sub,
    //       name: profile.name,
    //       email: profile.email,
    //       image: profile.picture,
    //       role: profile.role ?? "USER",
    //     };
    //   },
    // }),
  ],
  callbacks: {
    async signIn({ user, email }) {
      try {
        const userDetail = await db.query.userDetails.findFirst({
          where: (userDetails, { eq }) =>
            eq(userDetails.email, user?.email || ""),
          with: {
            usersToFacilities: true,
          },
        });

        // If user is not in userDetails table, deny sign in
        if (!userDetail) {
          return false; // This will redirect to error page
        }

        // Determine user's highest role from their facility positions
        const positions =
          userDetail.usersToFacilities
            ?.map((utf) => utf.position)
            .filter(Boolean) || [];
        let highestRole = "USER";

        // Role hierarchy (highest to lowest)
        if (positions.includes("STORE_OWNER")) highestRole = "ADMIN";
        else if (positions.includes("AREA_MANAGER")) highestRole = "SUPERVISOR";
        else if (positions.includes("MANAGER")) highestRole = "MANAGER";
        else if (positions.includes("ASSISTANT")) highestRole = "ASSISTANT";
        else if (positions.includes("ACM_OFFICE")) highestRole = "ADMIN";

        // Update user record with userDetailId and role if not already set
        if (!user?.userDetailId) {
          await db
            .update(users)
            .set({
              userDetailId: userDetail.id,
              role: highestRole as any,
            })
            .where(eq(users.email, userDetail?.email));
        }

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.role = user.role;
        session.user.userDetailId = user.userDetailId;
        session.user.id = user.id;

        // Fetch user facilities if userDetailId exists
        if (user.userDetailId) {
          const facilities = await getUserFacilities(user.userDetailId);
          session.user.facilities = facilities;
        }
      }
      return session;
    },
  },
  pages: {
    error: "/unauthorized", // Redirect here when signIn returns false
  },
});
