// src/app/api/catalogo/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTangoBrandNameBySlug, mapTangoProduct, TANGO_WEB_PRICE_LIST_CODE } from "@/lib/products-tango";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("brand");

        if (!slug) {
            return NextResponse.json({ products: [] }, { status: 200 });
        }

        const brandName = await getTangoBrandNameBySlug(slug);
        if (!brandName) {
            return NextResponse.json({ products: [] }, { status: 200 });
        }

        const rows = await prisma.productsTango.findMany({
            where: {
                brandName,
                priceListCode: TANGO_WEB_PRICE_LIST_CODE,
                isActive: true,
            },
            orderBy: { articleCode: "asc" },
            take: 200, // por las dudas
        });

        const products = rows.map(mapTangoProduct).map((product) => ({
            ...product,
            price: product.priceBase,
        }));

        return NextResponse.json({ products }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ products: [] }, { status: 200 });
    }
}
