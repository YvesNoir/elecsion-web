// src/app/api/products/missing-images/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { listObjects, generateProductImageKey } from "@/lib/aws-s3";

export async function GET() {
    try {
        const session = await getSession();

        // Solo permitir a administradores y vendedores
        if (!session?.user || !["ADMIN", "SELLER"].includes(session.user.role)) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        // Obtener todos los productos activos
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                isDeleted: false,
                sku: {
                    not: null
                }
            },
            select: {
                id: true,
                sku: true,
                name: true,
                brand: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: [
                { sku: "asc" },
                { name: "asc" }
            ]
        });

        // Obtener lista de imágenes existentes en S3
        let existingImages: string[] = [];

        try {
            // Listar todos los objetos en la carpeta 'products/'
            const s3Objects = await listObjects('products/');
            existingImages = s3Objects.map(key => key.replace('products/', '').toLowerCase());
            console.log(`Found ${existingImages.length} images in S3`);
        } catch (error) {
            console.error("Error listing S3 objects:", error);
            existingImages = [];
        }

        // Filtrar productos sin imágenes
        const productsWithoutImages = products.filter(product => {
            if (!product.sku) return true; // Si no tiene SKU, no puede tener imagen

            // Probar ambas variantes de limpieza de SKU

            // Variante 1: generateProductImageKey (sin guiones)
            const cleanSkuNoHyphens = product.sku.toLowerCase().replace(/[^a-z0-9]/g, '');

            // Variante 2: sanitizeSkuForFilename (con guiones)
            const cleanSkuWithHyphens = product.sku
                .trim()
                .toLowerCase()
                .replace(/\//g, '')
                .replace(/[\\:*?"<>|\s]/g, '')
                .replace(/[^a-z0-9-]/g, '');

            // Buscar con ambas variantes
            const hasPNG_NoHyphens = existingImages.includes(`${cleanSkuNoHyphens}.png`);
            const hasJPG_NoHyphens = existingImages.includes(`${cleanSkuNoHyphens}.jpg`);

            const hasPNG_WithHyphens = existingImages.includes(`${cleanSkuWithHyphens}.png`);
            const hasJPG_WithHyphens = existingImages.includes(`${cleanSkuWithHyphens}.jpg`);

            const hasImage = hasPNG_NoHyphens || hasJPG_NoHyphens || hasPNG_WithHyphens || hasJPG_WithHyphens;


            return !hasImage;
        });

        // Agrupar productos sin imágenes por marca
        const brandCounts = productsWithoutImages.reduce((acc, product) => {
            const brandName = product.brand?.name || 'Sin marca';
            if (!acc[brandName]) {
                acc[brandName] = 0;
            }
            acc[brandName]++;
            return acc;
        }, {} as Record<string, number>);

        // Convertir a array y ordenar por cantidad descendente
        const brandStats = Object.entries(brandCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return NextResponse.json({
            success: true,
            totalProducts: products.length,
            productsWithImages: products.length - productsWithoutImages.length,
            productsWithoutImages: productsWithoutImages.length,
            products: productsWithoutImages,
            brandStats
        });

    } catch (error) {
        console.error("Error fetching products without images:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}