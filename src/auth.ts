import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import GOOGLE from "next-auth/providers/google";
import NextAuth from "next-auth";
import {
  accounts,
  users,
  verificationTokens,
  sessions,
} from "./db/schema";
import { eq } from "drizzle-orm";
import { getUserFacilities } from "@/lib/controllers/userController/getUserFacilities";
import { authConfig } from "./auth.config";

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
  ...authConfig,
  // JWT strategy so the Edge-compatible middleware can verify sessions
  // without a database connection
  session: { strategy: "jwt" },
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      try {
        const userDetail = await db.query.userDetails.findFirst({
          where: (userDetails, { eq }) =>
            eq(userDetails.email, user?.email || ""),
          with: {
            usersToFacilities: true,
          },
        });

        if (!userDetail) {
          return false;
        }

        const positions =
          userDetail.usersToFacilities
            ?.map((utf) => utf.position)
            .filter(Boolean) || [];
        let highestRole = "USER";

        if (positions.includes("STORE_OWNER")) highestRole = "ADMIN";
        else if (positions.includes("AREA_MANAGER")) highestRole = "SUPERVISOR";
        else if (positions.includes("MANAGER")) highestRole = "MANAGER";
        else if (positions.includes("ASSISTANT")) highestRole = "ASSISTANT";
        else if (positions.includes("ACM_OFFICE")) highestRole = "ADMIN";

        if (!user?.userDetailId) {
          await db
            .update(users)
            .set({
              userDetailId: userDetail.id,
              role: highestRole as any,
            })
            .where(eq(users.email, userDetail?.email));
        }

        // Attach to user object so jwt callback can pick it up
        user.userDetailId = userDetail.id;
        user.role = highestRole;

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      // `user` is only present on the initial sign-in
      if (user) {
        (token as any).role = user.role;
        (token as any).userDetailId = user.userDetailId;
        token.sub = user.id;

        if (user.userDetailId) {
          (token as any).facilities = await getUserFacilities(user.userDetailId);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = (token as any).role ?? null;
        session.user.userDetailId = (token as any).userDetailId ?? null;
        session.user.facilities = (token as any).facilities ?? undefined;
      }
      return session;
    },
  },
  pages: {
    error: "/unauthorized",
  },
});
