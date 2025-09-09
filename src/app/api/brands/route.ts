// src/app/api/brands/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    const brands = await prisma.brand.findMany({
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            slug: true,
            _count: { select: { products: true } },
        },
    });

    return NextResponse.json(brands);
}