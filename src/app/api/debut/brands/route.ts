// src/app/api/debug/brands/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    const count = await prisma.brand.count();
    const first = await prisma.brand.findFirst({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
    });
    return NextResponse.json({ count, first });
}