// src/app/api/products/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");
        const brandId = searchParams.get("brand");
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

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
            whereConditions.brandId = brandId;
        }

        // Buscar productos usando Prisma ORM para mejor compatibilidad
        const products = await prisma.product.findMany({
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
            take: limit
        });

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

        return NextResponse.json({ products: serializedProducts });

    } catch (error) {
        console.error("Error searching products:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}