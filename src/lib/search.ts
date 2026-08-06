import { prisma } from "@/lib/db";
import { mapTangoProduct, TANGO_WEB_PRICE_LIST_CODE } from "@/lib/products-tango";

function normalizeQuery(q: string) {
    return q.trim().replace(/\s+/g, " ");
}

export async function searchProducts(q: string, limit = 20, offset = 0) {
    const query = normalizeQuery(q);
    const where = {
        priceListCode: TANGO_WEB_PRICE_LIST_CODE,
        isActive: true,
        ...(query ? {
            OR: [
                { articleCode: { contains: query, mode: "insensitive" as const } },
                { synonym: { contains: query, mode: "insensitive" as const } },
                { description: { contains: query, mode: "insensitive" as const } },
                { brandName: { contains: query, mode: "insensitive" as const } },
            ],
        } : {}),
    };

    const [rows, total] = await Promise.all([
        prisma.productsTango.findMany({
            where,
            orderBy: { articleCode: "asc" },
            take: limit,
            skip: offset,
            select: {
                articleCode: true,
                synonym: true,
                description: true,
                price: true,
                currency: true,
                stockQty: true,
                taxRate: true,
                brandName: true,
            },
        }),
        prisma.productsTango.count({ where }),
    ]);

    return { items: rows.map(mapTangoProduct), total };
}
