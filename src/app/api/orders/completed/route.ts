import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        
        // Verificar que el usuario esté logueado
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Buscar al usuario en la BD para obtener su ID real
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! }
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Traer órdenes completadas desde la base de datos (tipo ORDER, no QUOTE)
        const completedOrders = await prisma.order.findMany({
            where: {
                clientUserId: user.id,
                type: 'ORDER', // Solo órdenes confirmadas (ex-cotizaciones)
                status: { in: ['APPROVED', 'FULFILLED', 'SHIPPED', 'DELIVERED'] }
            },
            include: {
                items: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        quantity: true,
                        unitPrice: true
                    }
                },
                clientUser: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                sellerUser: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Formatear las órdenes con los campos necesarios para la facturación
        const formattedOrders = completedOrders.map(order => ({
            ...order,
            // Calcular subtotales para cada item
            items: order.items.map(item => ({
                ...item,
                subtotal: Number(item.unitPrice || 0) * Number(item.quantity)
            })),
            // Calcular subtotal y tax total si no existen
            subtotal: order.subtotal || (Number(order.total) / 1.21),
            taxTotal: order.taxTotal || (Number(order.total) - (Number(order.total) / 1.21)),
            // Asegurar que submittedAt esté disponible
            submittedAt: order.submittedAt || order.createdAt
        }));

        return NextResponse.json(formattedOrders);

    } catch (error) {
        console.error("Error getting completed orders:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}