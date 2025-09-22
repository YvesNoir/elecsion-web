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

        // Buscar el producto
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }

        // Marcar el producto como eliminado
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                isDeleted: true,
                updatedAt: new Date()
            },
            select: {
                id: true,
                sku: true,
                name: true,
                isDeleted: true
            }
        });

        return NextResponse.json({
            success: true,
            product: updatedProduct,
            message: "Producto eliminado exitosamente"
        });

    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}