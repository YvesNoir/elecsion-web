import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await getSession();
        
        // Verificar que el usuario esté logueado y sea SELLER o ADMIN
        if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role as string)) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Obtener TODOS los productos activos para pedido rápido
        const productos = await prisma.product.findMany({
            where: {
                isActive: true,
                isDeleted: false
            },
            select: {
                id: true,
                sku: true,
                name: true,
                priceBase: true,
                stockQty: true,
                unit: true,
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

        return NextResponse.json({
            productos
        });

    } catch (error) {
        console.error("Error fetching all products:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}