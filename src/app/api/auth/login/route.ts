// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { signIn } from "next-auth"; // v5: usable también en handlers
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { email, password } = (await req.json()) as {
            email?: string;
            password?: string;
        };

        if (!email) {
            return NextResponse.json(
                { ok: false, error: "El email es requerido" },
                { status: 400 }
            );
        }

        // 🚪 Pedimos a NextAuth que haga el sign-in con el provider "credentials"
        // No redirigimos desde el handler: devolvemos JSON y el cliente decide qué hacer.
        const result = await signIn("credentials", {
            redirect: false,
            email,
            // en tu seed los usuarios pueden tener password vacío; por eso coalesce a ""
            password: password ?? "",
        });

        // `result` puede ser `undefined` si todo salió bien en v5
        if (result && "error" in result && result.error) {
            return NextResponse.json(
                { ok: false, error: result.error },
                { status: 401 }
            );
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("POST /api/auth/login", e);
        return NextResponse.json(
            { ok: false, error: "No pudimos iniciar sesión" },
            { status: 500 }
        );
    }
}