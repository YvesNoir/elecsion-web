// src/app/api/products/missing-images/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { listObjects, generateProductImageKey } from "@/lib/aws-s3";

export async function GET() {
    try {
        // Debug: verificar configuración AWS
        console.log('🔐 AWS Config:', {
            accessKey: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
            secretKey: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
            region: process.env.AWS_REGION,
            bucket: process.env.AWS_S3_BUCKET
        });

        const session = await getSession();

        // Solo permitir a administradores y vendedores
        if (!session?.user || !["ADMIN", "SELLER"].includes(session.user.role)) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        // Obtener todos los productos activos con marcas activas
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                isDeleted: false,
                sku: {
                    not: null
                },
                brand: {
                    isActive: true  // Solo marcas activas
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

        // Obtener lista de imágenes existentes SOLO en S3 (no local)
        let existingImages: string[] = [];

        try {
            // Listar todos los objetos en la carpeta 'products/' de S3
            const s3Objects = await listObjects('products/');
            existingImages = s3Objects.map(key => key.replace('products/', '').toLowerCase());
            console.log(`📦 Found ${existingImages.length} images in S3 storage`);

            // Log de las primeras 10 imágenes para debug
            if (existingImages.length > 0) {
                console.log(`📋 Sample images in S3:`, existingImages.slice(0, 10));
            }
        } catch (error) {
            console.error("❌ Error listing S3 objects:", error);
            existingImages = [];
        }

        // Filtrar productos sin imágenes SOLO basado en S3
        const productsWithoutImages = products.filter(product => {
            if (!product.sku) return true; // Si no tiene SKU, no puede tener imagen

            // SANITIZACIÓN AGRESIVA - Múltiples variantes para máximo matching
            const sku = product.sku;
            const skuVariants = [
                // Variante 1: Original (sin cambios)
                sku,

                // Variante 2: Solo minúsculas
                sku.toLowerCase(),

                // Variante 3: generateProductImageKey (sin guiones ni caracteres especiales)
                sku.toLowerCase().replace(/[^a-z0-9]/g, ''),

                // Variante 4: sanitizeSkuForFilename (con guiones)
                sku.trim().toLowerCase().replace(/\//g, '').replace(/[\\:*?"<>|\s]/g, '').replace(/[^a-z0-9-]/g, ''),

                // Variante 5: Solo remover espacios y barras
                sku.toLowerCase().replace(/[\s\/]/g, ''),

                // Variante 6: Convertir guiones a underscores
                sku.toLowerCase().replace(/[^a-z0-9-_]/g, '').replace(/-/g, '_'),

                // Variante 7: Convertir underscores a guiones
                sku.toLowerCase().replace(/[^a-z0-9-_]/g, '').replace(/_/g, '-'),

                // Variante 8: Solo alfanuméricos con guiones
                sku.toLowerCase().replace(/[^a-z0-9-]/g, ''),

                // Variante 9: Solo alfanuméricos con underscores
                sku.toLowerCase().replace(/[^a-z0-9_]/g, ''),

                // Variante 10: Remover solo caracteres especiales problemáticos
                sku.toLowerCase().replace(/[\/\\:*?"<>|\s]/g, ''),
            ];

            // Buscar cada variante en S3 con múltiples extensiones
            let hasImage = false;
            for (const variant of skuVariants) {
                if (!variant) continue; // Skip empty variants

                if (existingImages.includes(`${variant}.png`) ||
                    existingImages.includes(`${variant}.jpg`) ||
                    existingImages.includes(`${variant}.jpeg`)) {
                    hasImage = true;
                    break;
                }
            }

            // Si no encontramos match exacto, intentar matching parcial/fuzzy
            if (!hasImage && sku.length >= 3) {
                const cleanSku = sku.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (cleanSku.length >= 3) {
                    // Buscar imágenes que contengan el SKU limpio o viceversa
                    for (const imageName of existingImages) {
                        const cleanImageName = imageName.replace(/\.(png|jpg|jpeg)$/i, '');

                        // Match parcial: la imagen contiene el SKU o el SKU contiene la imagen
                        if ((cleanImageName.length >= 3 && cleanSku.includes(cleanImageName)) ||
                            (cleanSku.length >= 3 && cleanImageName.includes(cleanSku))) {
                            hasImage = true;
                            break;
                        }
                    }
                }
            }

            // Debug para productos específicos como 450141 o EVO115CO
            if (product.sku && (product.sku.includes('450141') || product.sku.includes('EVO115CO'))) {
                console.log(`🔍 Debug ${product.sku}:`, {
                    original: product.sku,
                    variants: skuVariants,
                    hasImage
                });
            }

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