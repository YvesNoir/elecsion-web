// src/lib/search.ts
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

/** Normaliza el query del usuario (espacios, etc.) */
function normalizeQuery(q: string) {
    return q.trim().replace(/\s+/g, " ");
}

/**
 * Busca productos con Full-Text Search en español.
 * - Si q está vacío: lista últimos activos (paginado)
 * - Si FTS trae resultados: ordena por rank y devuelve productos completos
 * - Si FTS no trae nada: fallback por ILIKE (name / sku)
 */
export async function searchProducts(q: string, limit = 20, offset = 0) {
    const query = normalizeQuery(q);

    // 1) Sin query => listado reciente
    if (!query) {
        const [items, total] = await Promise.all([
            prisma.product.findMany({
                where: { isActive: true },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
                include: {
                    brand: true,
                    category: true,
                    images: { orderBy: { position: "asc" }, take: 1 },
                },
            }),
            prisma.product.count({ where: { isActive: true } }),
        ]);
        return { items, total };
    }

    // 2) FTS: primero traemos SOLO ids + rank (no seleccionamos tsvector)
    const idRows = await prisma.$queryRaw<{ id: string; rank: number }[]>(
        Prisma.sql`
      SELECT
        p."id",
        ts_rank(p.search_vector, plainto_tsquery('spanish', ${query})) AS rank
      FROM "Product" AS p
      WHERE p."is_active" = true
        AND p.search_vector @@ plainto_tsquery('spanish', ${query})
      ORDER BY rank DESC, p."updated_at" DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `
    );

    if (idRows.length > 0) {
        const ids = idRows.map((r) => r.id);

        const [products, totalRows] = await Promise.all([
            prisma.product.findMany({
                where: { id: { in: ids } },
                include: {
                    brand: true,
                    category: true,
                    images: { orderBy: { position: "asc" }, take: 1 },
                },
            }),
            prisma.$queryRaw<{ count: bigint }[]>(
                Prisma.sql`
          SELECT COUNT(*)::bigint AS count
          FROM "Product" p
          WHERE p."is_active" = true
            AND p.search_vector @@ plainto_tsquery('spanish', ${query})
        `
            ),
        ]);

        // Re-ordenamos según ids (rank)
        const map = new Map(products.map((p) => [p.id, p]));
        const items = ids.map((id) => map.get(id)).filter(Boolean) as typeof products;

        const total = Number(totalRows[0]?.count ?? 0);
        return { items, total };
    }

    // 3) Fallback: ILIKE por nombre o SKU
    const [fallbackItems, total] = await Promise.all([
        prisma.product.findMany({
            where: {
                isActive: true,
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { sku: { contains: query, mode: "insensitive" } },
                ],
            },
            orderBy: { updatedAt: "desc" },
            take: limit,
            skip: offset,
            include: {
                brand: true,
                category: true,
                images: { orderBy: { position: "asc" }, take: 1 },
            },
        }),
        prisma.product.count({
            where: {
                isActive: true,
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { sku: { contains: query, mode: "insensitive" } },
                ],
            },
        }),
    ]);

    return { items: fallbackItems, total };
}