import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        
        // Verificar que el usuario esté logueado y sea admin
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'No autorizado' }, 
                { status: 401 }
            );
        }

        const { featured } = await request.json();

        if (typeof featured !== 'boolean') {
            return NextResponse.json(
                { error: 'El valor de featured debe ser un booleano' }, 
                { status: 400 }
            );
        }

        // Actualizar el estado destacado del producto
        const updatedProduct = await prisma.product.update({
            where: { id: params.id },
            data: { featured },
            select: { 
                id: true, 
                name: true, 
                featured: true 
            }
        });

        return NextResponse.json({
            success: true,
            product: updatedProduct
        });

    } catch (error) {
        console.error('Error updating product featured status:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' }, 
            { status: 500 }
        );
    }
}