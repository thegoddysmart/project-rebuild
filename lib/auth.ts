import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "./db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "SUPER_ADMIN" | "ADMIN" | "ORGANIZER";
      avatar?: string;
      organizerId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: "SUPER_ADMIN" | "ADMIN" | "ORGANIZER";
    avatar?: string;
    organizerId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "SUPER_ADMIN" | "ADMIN" | "ORGANIZER";
    organizerId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { organizerProfile: true },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        if (user.status !== "ACTIVE") {
          throw new Error("Account is not active. Please contact support.");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entityType: "User",
            entityId: user.id,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar || undefined,
          organizerId: user.organizerProfile?.id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizerId = user.organizerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.organizerId = token.organizerId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || "easevote-secret-key-change-in-production",
};

export function getRoleRedirectPath(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin";
    case "ADMIN":
      return "/admin";
    case "ORGANIZER":
      return "/organizer";
    default:
      return "/";
  }
}

export function canAccessRoute(
  userRole: string,
  pathname: string
): boolean {
  if (pathname.startsWith("/admin/super")) {
    return userRole === "SUPER_ADMIN";
  }
  if (pathname.startsWith("/admin")) {
    return userRole === "SUPER_ADMIN" || userRole === "ADMIN";
  }
  if (pathname.startsWith("/organizer")) {
    return userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "ORGANIZER";
  }
  return true;
}
