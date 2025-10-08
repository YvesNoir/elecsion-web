import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

type StockUpdateRow = {
    codigo: string | number;
    descripcion: string;
    stock: number;
};

type UpdateResult = {
    sku: string;
    descripcion: string;
    oldStock: number;
    newStock: number;
    status: 'updated' | 'not_found' | 'error';
    error?: string;
};

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticación y permisos
        const session = await getSession();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { products }: { products: StockUpdateRow[] } = await request.json();

        if (!products || !Array.isArray(products)) {
            return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
        }

        let updated = 0;
        let notFound = 0;
        let errors = 0;
        const results: UpdateResult[] = [];

        // Procesar cada producto en lotes para mejor performance
        const batchSize = 50;

        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);

            // Obtener todos los SKUs del lote de una vez
            const skus = batch.map(row => String(row.codigo).trim()).filter(sku => sku);

            if (skus.length === 0) continue;

            // Buscar productos existentes en lote
            const existingProducts = await prisma.product.findMany({
                where: {
                    sku: { in: skus },
                    isDeleted: false
                },
                select: {
                    id: true,
                    sku: true,
                    name: true,
                    stockQty: true
                }
            });

            // Crear un mapa para acceso rápido
            const productMap = new Map(existingProducts.map(p => [p.sku, p]));

            // Procesar cada item del lote
            for (const row of batch) {
                const sku = String(row.codigo).trim();

                if (!sku) {
                    errors++;
                    results.push({
                        sku: sku,
                        descripcion: row.descripcion || '',
                        oldStock: 0,
                        newStock: 0,
                        status: 'error',
                        error: 'SKU vacío'
                    });
                    continue;
                }

                // Validar que el stock sea un número válido
                const newStock = Number(row.stock);
                if (isNaN(newStock) || newStock < 0) {
                    errors++;
                    results.push({
                        sku: sku,
                        descripcion: row.descripcion || '',
                        oldStock: 0,
                        newStock: row.stock,
                        status: 'error',
                        error: 'Stock inválido (debe ser un número mayor o igual a 0)'
                    });
                    continue;
                }

                const existingProduct = productMap.get(sku);

                if (!existingProduct) {
                    notFound++;
                    results.push({
                        sku: sku,
                        descripcion: row.descripcion || '',
                        oldStock: 0,
                        newStock: newStock,
                        status: 'not_found',
                        error: 'Producto no encontrado en la base de datos'
                    });
                    continue;
                }

                try {
                    // Actualizar el stock
                    await prisma.product.update({
                        where: { id: existingProduct.id },
                        data: {
                            stockQty: new Decimal(newStock),
                            updatedAt: new Date(),
                        }
                    });

                    updated++;
                    results.push({
                        sku: sku,
                        descripcion: row.descripcion || existingProduct.name,
                        oldStock: Number(existingProduct.stockQty || 0),
                        newStock: newStock,
                        status: 'updated'
                    });

                } catch (error) {
                    errors++;
                    results.push({
                        sku: sku,
                        descripcion: row.descripcion || existingProduct.name,
                        oldStock: Number(existingProduct.stockQty || 0),
                        newStock: newStock,
                        status: 'error',
                        error: error instanceof Error ? error.message : 'Error desconocido'
                    });
                    console.error(`Error actualizando stock para SKU ${sku}:`, error);
                }
            }
        }

        return NextResponse.json({
            success: true,
            results: {
                total: products.length,
                updated,
                notFound,
                errors,
                details: results
            }
        });

    } catch (error) {
        console.error('Error en actualización de stock:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}