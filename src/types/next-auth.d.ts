// src/types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user?: DefaultSession["user"] & {
            id: string;
            role?: "ADMIN" | "SELLER" | "CLIENT";
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        uid?: string;
        role?: "ADMIN" | "SELLER" | "CLIENT";
    }
}