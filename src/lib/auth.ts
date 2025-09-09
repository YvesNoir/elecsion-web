// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt" },
    pages: { signIn: "/login" },

    providers: [
        Credentials({
            name: "Email y contraseña",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Contraseña", type: "password" },
            },
            async authorize(credentials) {
                const email = (credentials?.email ?? "").toString().toLowerCase().trim();
                const password = (credentials?.password ?? "").toString();

                if (!email) return null;

                const user = await prisma.user.findUnique({ where: { email } });
                if (!user || !user.isActive) return null;

                // Usuarios seed sin password: aceptamos password vacío
                if (!user.passwordHash) {
                    if (password.length === 0) {
                        return {
                            id: user.id,
                            name: user.name ?? "",
                            email: user.email,
                            // @ts-expect-error - extendemos el usuario con role
                            role: user.role,
                        };
                    }
                    return null;
                }

                const ok = await bcrypt.compare(password, user.passwordHash);
                if (!ok) return null;

                return {
                    id: user.id,
                    name: user.name ?? "",
                    email: user.email,
                    // @ts-expect-error - extendemos el usuario con role
                    role: user.role,
                };
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                // @ts-expect-error - user.role viene desde authorize
                token.role = user.role;
                // @ts-expect-error - user.id viene desde authorize
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                // @ts-expect-error - ampliamos el tipo en runtime
                session.user.id = token.id as string | undefined;
                // @ts-expect-error - ampliamos el tipo en runtime
                session.user.role = token.role as string | undefined;
            }
            return session;
        },
    },
};