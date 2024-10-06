import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcrypt";
import prisma from "./prisma";
import { User as PrismaUser } from "@prisma/client";

// Extend the built-in types
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    fullname: string;
    role: PrismaUser['role'];
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: PrismaUser['role'];
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        if (!user) {
          return null;
        }
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          return null;
        }
        return {
          id: user.id.toString(),
          email: user.email,
          fullname: user.fullname,
          role: user.role
        };
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.fullname
      }
      return token;
    },
    async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id;
          session.user.name = token.name;
          session.user.role = token.role as 'ADMIN' | 'USER';
        }
        return session;
    },
    async redirect({ url, baseUrl }) {
        // If the url is just the base URL or "/", go to home
        if (url === baseUrl || url === `${baseUrl}/`) return baseUrl;
        // If it's a relative URL, prefix it with the base URL
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        // If it's the same origin, allow it
        if (new URL(url).origin === baseUrl) return url;
        // Otherwise, go to home
        return baseUrl;
      },
  },
};