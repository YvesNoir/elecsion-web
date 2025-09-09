import { prisma } from "@/lib/db";
import { json } from "@/lib/json";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "20"), 100);
    const offset = (page - 1) * pageSize;
    const brand = searchParams.get("brand");
    const category = searchParams.get("category");

    const where: any = { isActive: true };
    if (brand) where.brand = { slug: brand };
    if (category) where.category = { slug: category };

    try {
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