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
        const { stockQty } = await request.json();

        // Validar que stockQty sea un número válido
        if (typeof stockQty !== 'number' || stockQty < 0) {
            return NextResponse.json({ 
                error: "La cantidad de stock debe ser un número mayor o igual a 0" 
            }, { status: 400 });
        }

        // Buscar el producto
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }

        // Actualizar el stock del producto
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                stockQty: stockQty,
                updatedAt: new Date()
            },
            select: {
                id: true,
                sku: true,
                name: true,
                stockQty: true
            }
        });

        return NextResponse.json({
            success: true,
            product: {
                ...updatedProduct,
                stockQty: Number(updatedProduct.stockQty)
            },
            message: "Stock actualizado exitosamente"
        });

    } catch (error) {
        console.error("Error updating product stock:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}