import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, toBool } from "./db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "DIRECTOR" | "STAFF";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "DIRECTOR" | "STAFF";
  }
}

// NOTE: we intentionally do not augment "next-auth/jwt". next-auth v5's
// package exports are not resolvable by TypeScript's bundler moduleResolution
// (see https://github.com/nextauthjs/next-auth/issues/9950), which blocks the
// typecheck. The JWT is only touched inside the callbacks below, so we cast
// locally instead of relying on a global augmentation.

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await db
          .selectFrom("User")
          .selectAll()
          .where("email", "=", email.toLowerCase())
          .executeTakeFirst();
        if (!user || !toBool(user.active)) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as { uid?: string; role?: "DIRECTOR" | "STAFF" } & typeof token;
      if (user) {
        t.uid = user.id as string;
        t.role = (user as { role?: "DIRECTOR" | "STAFF" }).role;
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as { uid?: string; role?: "DIRECTOR" | "STAFF" };
      if (t.uid) session.user.id = t.uid;
      if (t.role) session.user.role = t.role;
      return session;
    },
  },
});

/**
 * Require a session in server components / actions. Redirects to /login
 * (locale-prefixed) if there is no session.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    // Redirect handled by middleware on next request.
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

/**
 * Require a DIRECTOR role.
 */
export async function requireDirector() {
  const session = await requireSession();
  if (session.user.role !== "DIRECTOR") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
