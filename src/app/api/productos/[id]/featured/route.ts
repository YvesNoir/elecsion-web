import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();

        // Verificar que el usuario esté logueado y sea admin
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const productId = (await params).id;
        const { isFeatured } = await request.json();

        // Validar el parámetro isFeatured
        if (typeof isFeatured !== 'boolean') {
            return NextResponse.json({
                error: "El parámetro isFeatured debe ser un valor booleano"
            }, { status: 400 });
        }

        // Buscar el producto
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }

        // Actualizar el estado destacado del producto
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                isFeatured: isFeatured,
                updatedAt: new Date()
            },
            select: {
                id: true,
                sku: true,
                name: true,
                isFeatured: true
            }
        });

        return NextResponse.json({
            success: true,
            product: updatedProduct,
            message: `Producto ${isFeatured ? 'marcado como destacado' : 'desmarcado como destacado'} exitosamente`
        });

    } catch (error) {
        console.error("Error updating product featured status:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}