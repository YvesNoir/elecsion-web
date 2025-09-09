// src/app/api/contact/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json(); // {name, email, phone, message}
        // TODO: enviar email / guardar en DB / Slack, etc.
        console.log("CONTACTO:", body);
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ ok: false }, { status: 400 });
    }
}