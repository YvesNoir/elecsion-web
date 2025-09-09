// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic"; // evita cache

export async function GET() {
    const session = await getSession();

    if (!session?.user?.id) {
        return NextResponse.json({ ok: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
        ok: true,
        user: {
            id: session.user.id,
            email: session.user.email ?? null,
            name: session.user.name ?? null,
            // role lo inyectamos en callbacks de NextAuth
            // @ts-expect-error - extendemos el tipo en runtime
            role: session.user.role ?? null,
        },
    });
}