// src/app/api/catalogo/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("brand");

        if (!slug) {
            return NextResponse.json({ products: [] }, { status: 200 });
        }

        const brand = await prisma.brand.findFirst({
            where: { slug },
            select: { id: true, name: true },
        });

        if (!brand) {
            return NextResponse.json({ products: [] }, { status: 200 });
        }

        const rows = await prisma.product.findMany({
            where: { brandId: brand.id },
            orderBy: { name: "asc" },
            select: {
                id: true,
                sku: true,
                name: true,
                unit: true,
                priceBase: true,
                currency: true,
            },
            take: 200, // por las dudas
        });

        const products = rows.map((r) => ({
            id: r.id,
            sku: r.sku,
            name: r.name,
            unit: r.unit,
            price: Number(r.priceBase ?? 0),
            currency: r.currency || "ARS",
        }));

        return NextResponse.json({ products }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ products: [] }, { status: 200 });
    }
}