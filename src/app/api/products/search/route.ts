import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTangoBrandNameBySlug, mapTangoProduct, TANGO_OFFERS_SLUG, TANGO_WEB_PRICE_LIST_CODE } from "@/lib/products-tango";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q")?.trim() || "";
        const brandSlug = searchParams.get("brand");
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
        const offset = parseInt(searchParams.get("offset") || "0");

        if (query.length < 2) return NextResponse.json({ products: [], total: 0 });

        const isOffersFilter = brandSlug === TANGO_OFFERS_SLUG;
        const brandName = brandSlug && !isOffersFilter ? await getTangoBrandNameBySlug(brandSlug) : null;
        if (brandSlug && !brandName && !isOffersFilter) return NextResponse.json({ products: [], total: 0 });

        const where = {
            priceListCode: TANGO_WEB_PRICE_LIST_CODE,
            isActive: true,
            ...(isOffersFilter ? { offerPrice: { not: null } } : {}),
            ...(brandName ? { brandName } : {}),
            OR: [
                { articleCode: { contains: query, mode: "insensitive" as const } },
                { synonym: { contains: query, mode: "insensitive" as const } },
                { description: { contains: query, mode: "insensitive" as const } },
                { brandName: { contains: query, mode: "insensitive" as const } },
            ],
        };

        const [rows, total] = await Promise.all([
            prisma.productsTango.findMany({
                where,
                orderBy: [{ articleCode: "asc" }],
                take: limit,
                skip: offset,
                select: {
                    articleCode: true,
                    synonym: true,
                    description: true,
                price: true,
                offerPrice: true,
                    currency: true,
                    stockQty: true,
                    taxRate: true,
                    brandName: true,
                },
            }),
            prisma.productsTango.count({ where }),
        ]);

        return NextResponse.json({ products: rows.map(mapTangoProduct), total });
    } catch (error) {
        console.error("Error searching Tango products:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
