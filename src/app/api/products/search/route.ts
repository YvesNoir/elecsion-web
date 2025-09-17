// src/app/api/products/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query || query.trim().length < 2) {
            return NextResponse.json([]);
        }

        const searchTerm = query.trim().toLowerCase();

        // Buscar productos que coincidan con:
        // 1. SKU (exacto o que contenga el término)
        // 2. Nombre del producto (que contenga el término)
        // 3. Nombre de la marca (que contenga el término)
        // Nota: Para búsqueda case-insensitive en SQLite, uso prisma.$queryRaw
        const products = await prisma.$queryRaw`
            SELECT 
                p.id,
                p.sku,
                p.name,
                p.price_base as priceBase,
                p.currency,
                b.name as brandName,
                b.slug as brandSlug
            FROM Product p
            INNER JOIN Brand b ON p.brand_id = b.id
            WHERE 
                p.is_active = 1 
                AND (
                    LOWER(p.sku) LIKE ${'%' + searchTerm + '%'}
                    OR LOWER(p.name) LIKE ${'%' + searchTerm + '%'}
                    OR LOWER(b.name) LIKE ${'%' + searchTerm + '%'}
                )
            ORDER BY p.sku, p.name
            LIMIT 20
        `;

        // Transformar el resultado para que coincida con la estructura esperada
        const serializedProducts = products.map(product => ({
            id: product.id,
            sku: product.sku,
            name: product.name,
            priceBase: Number(product.priceBase || 0),
            currency: product.currency || "ARS",
            brand: {
                name: product.brandName,
                slug: product.brandSlug
            }
        }));

        return NextResponse.json(serializedProducts);

    } catch (error) {
        console.error("Error searching products:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}