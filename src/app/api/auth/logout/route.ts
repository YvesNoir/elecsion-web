import { NextResponse } from "next/server";

export async function POST() {
    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    return NextResponse.redirect(new URL("/api/auth/signout", base));
}