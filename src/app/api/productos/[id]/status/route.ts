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
        const { isActive } = await request.json();

        // Validar el parámetro isActive
        if (typeof isActive !== 'boolean') {
            return NextResponse.json({ 
                error: "El parámetro isActive debe ser un valor booleano" 
            }, { status: 400 });
        }

        // Buscar el producto
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }

        // Actualizar el estado del producto
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                isActive: isActive,
                updatedAt: new Date()
            },
            select: {
                id: true,
                sku: true,
                name: true,
                isActive: true
            }
        });

        return NextResponse.json({
            success: true,
            product: updatedProduct,
            message: `Producto ${isActive ? 'activado' : 'desactivado'} exitosamente`
        });

    } catch (error) {
        console.error("Error updating product status:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}