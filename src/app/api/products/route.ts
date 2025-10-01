import { prisma } from "@/lib/db";
import { json } from "@/lib/json";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "20"), 100);
    const limit = Math.min(Number(searchParams.get("limit") ?? pageSize), 100);
    const offset = (page - 1) * pageSize;
    const brand = searchParams.get("brand");
    const category = searchParams.get("category");

    const where: any = { isActive: true, isDeleted: false };

    // Filtro por marca - puede ser slug o ID
    if (brand) {
        // Si es un UUID, usar brandId directamente
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brand)) {
            where.brandId = brand;
        } else {
            // Si no es UUID, asumir que es slug
            where.brand = { slug: brand };
        }
    }

    if (category) where.category = { slug: category };

    try {
        // Si hay limit pero no page, usar limit directo (para pedido-rapido)
        if (searchParams.has("limit") && !searchParams.has("page")) {
            const products = await prisma.product.findMany({
                where,
                take: limit,
                orderBy: { updatedAt: "desc" },
                select: {
                    id: true,
                    sku: true,
                    name: true,
                    priceBase: true,
                    currency: true,
                    stockQty: true,
                    unit: true,
                    brand: {
                        select: {
                            name: true,
                            slug: true
                        }
                    }
                }
            });

            const serializedProducts = products.map(product => ({
                id: product.id,
                sku: product.sku,
                name: product.name,
                priceBase: Number(product.priceBase || 0),
                currency: product.currency || "ARS",
                stockQty: product.stockQty ? Number(product.stockQty) : 0,
                unit: product.unit,
                brand: product.brand
            }));

            return json({ products: serializedProducts }, { status: 200 });
        }

        // Paginación normal
        const [items, total] = await Promise.all([
            prisma.product.findMany({
                where,
                take: pageSize,
                skip: offset,
                orderBy: { updatedAt: "desc" },
                include: { brand: true, category: true, images: { orderBy: { position: "asc" }, take: 1 } },
            }),
            prisma.product.count({ where }),
        ]);
        return json({ items, total }, { status: 200 });
    } catch (err: any) {
        console.error("GET /api/products error:", err);
        return json({ error: "Internal error", detail: err?.message }, { status: 500 });
    }
}