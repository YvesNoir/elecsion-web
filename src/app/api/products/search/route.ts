// src/app/api/products/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");
        const brandId = searchParams.get("brand");
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
        const offset = parseInt(searchParams.get("offset") || "0");

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ products: [] });
        }

        const searchTerm = query.trim();

        // Construir filtros base
        const whereConditions: any = {
            isActive: true,
            isDeleted: false,
            OR: [
                { sku: { contains: searchTerm, mode: 'insensitive' } },
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { brand: { name: { contains: searchTerm, mode: 'insensitive' } } }
            ]
        };

        // Agregar filtro por marca si se especifica
        if (brandId) {
            // Si es un UUID/cuid (contiene caracteres que no serían un slug normal), usar brandId directamente
            if (/^[a-z0-9]{25}$/.test(brandId) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brandId)) {
                whereConditions.brandId = brandId;
            } else {
                // Si no es UUID, asumir que es slug
                whereConditions.brand = { slug: brandId };
            }
        }

        // Buscar productos usando Prisma ORM para mejor compatibilidad
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where: whereConditions,
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
                },
                orderBy: [
                    { sku: 'asc' },
                    { name: 'asc' }
                ],
                take: limit,
                skip: offset
            }),
            prisma.product.count({ where: whereConditions })
        ]);

        // Transformar el resultado para serializarlo
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

        return NextResponse.json({ products: serializedProducts, total });

    } catch (error) {
        console.error("Error searching products:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}