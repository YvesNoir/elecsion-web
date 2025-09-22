import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

type ImportRow = {
    codigo: string | number;
    descripcion: string;
    familia: string;
    price: number;
    stock: number;
    iva: number;
    currency: string;
};

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticación y permisos
        const session = await getSession();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { products }: { products: ImportRow[] } = await request.json();

        if (!products || !Array.isArray(products)) {
            return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
        }

        let created = 0;
        let updated = 0;
        let errors = 0;
        const errorDetails: string[] = [];

        // Procesar cada producto
        for (const row of products) {
            try {
                const sku = String(row.codigo).trim();
                
                if (!sku || !row.descripcion) {
                    errors++;
                    errorDetails.push(`SKU '${sku}': Falta SKU o descripción`);
                    continue;
                }

                // Buscar o crear la marca
                let brand = null;
                if (row.familia && row.familia.trim()) {
                    const brandName = row.familia.trim();
                    const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    
                    brand = await prisma.brand.upsert({
                        where: { slug: brandSlug },
                        update: {},
                        create: {
                            name: brandName,
                            slug: brandSlug
                        }
                    });
                }

                // Generar slug para el producto
                const slug = `${sku}-${row.descripcion}`
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .substring(0, 200);

                // Intentar actualizar producto existente por SKU
                const existingProduct = await prisma.product.findFirst({
                    where: { sku: sku }
                });

                if (existingProduct) {
                    // Actualizar producto existente
                    await prisma.product.update({
                        where: { id: existingProduct.id },
                        data: {
                            name: row.descripcion.trim(),
                            priceBase: new Decimal(row.price),
                            currency: row.currency || 'ARS',
                            stockQty: new Decimal(row.stock),
                            taxRate: new Decimal(row.iva),
                            brandId: brand?.id || null,
                            updatedAt: new Date(),
                        }
                    });
                    updated++;
                } else {
                    // Crear nuevo producto
                    await prisma.product.create({
                        data: {
                            sku: sku,
                            name: row.descripcion.trim(),
                            slug: slug,
                            priceBase: new Decimal(row.price),
                            currency: row.currency || 'ARS',
                            stockQty: new Decimal(row.stock),
                            taxRate: new Decimal(row.iva),
                            brandId: brand?.id || null,
                            isActive: true,
                        }
                    });
                    created++;
                }

            } catch (error) {
                errors++;
                const sku = String(row.codigo).trim();
                errorDetails.push(`SKU '${sku}': ${error instanceof Error ? error.message : 'Error desconocido'}`);
                console.error(`Error procesando producto ${sku}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            results: {
                total: products.length,
                created,
                updated,
                errors,
                errorDetails: errorDetails.slice(0, 10) // Solo los primeros 10 errores
            }
        });

    } catch (error) {
        console.error('Error en importación:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}