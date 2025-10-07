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

            const skuLower = product.sku.toLowerCase();
            const hasPNG = existingImages.includes(`${skuLower}.png`);
            const hasJPG = existingImages.includes(`${skuLower}.jpg`);

            return !hasPNG && !hasJPG;
        });

        return NextResponse.json({
            success: true,
            totalProducts: products.length,
            productsWithImages: products.length - productsWithoutImages.length,
            productsWithoutImages: productsWithoutImages.length,
            products: productsWithoutImages
        });

    } catch (error) {
        console.error("Error fetching products without images:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}