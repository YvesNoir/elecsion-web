import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
    getTangoBrandNameBySlug,
    mapTangoProduct,
    TANGO_WEB_PRICE_LIST_CODE,
} from "@/lib/products-tango";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get("page") ?? "1");
        const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "20"), 100);
        const limit = Math.min(Number(searchParams.get("limit") ?? pageSize), 100);
        const offset = searchParams.has("limit") && !searchParams.has("page")
            ? Number(searchParams.get("offset") ?? "0")
            : (page - 1) * pageSize;
        const brandSlug = searchParams.get("brand");

        const brandName = brandSlug ? await getTangoBrandNameBySlug(brandSlug) : null;
        if (brandSlug && !brandName) {
            return NextResponse.json({ products: [], total: 0 });
        }

        const where = {
            priceListCode: TANGO_WEB_PRICE_LIST_CODE,
            isActive: true,
            ...(brandName ? { brandName } : {}),
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
                    currency: true,
                    stockQty: true,
                    taxRate: true,
                    brandName: true,
                },
            }),
            prisma.productsTango.count({ where }),
        ]);

        const products = rows.map(mapTangoProduct);
        return NextResponse.json({ products, total });
    } catch (error) {
        console.error("GET /api/products error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
