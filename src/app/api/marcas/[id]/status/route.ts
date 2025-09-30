import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { isActive } = body;

        if (typeof isActive !== 'boolean') {
            return NextResponse.json(
                { error: 'isActive debe ser un valor booleano' },
                { status: 400 }
            );
        }

        const updatedBrand = await prisma.brand.update({
            where: { id },
            data: { isActive },
            select: {
                id: true,
                name: true,
                isActive: true,
            }
        });

        return NextResponse.json({
            success: true,
            brand: updatedBrand
        });

    } catch (error) {
        console.error('Error actualizando estado de marca:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}