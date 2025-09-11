import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await getSession();
        
        // Verificar que el usuario esté logueado y sea admin
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Solo administradores pueden acceder a esta información" }, { status: 403 });
        }

        // Obtener todas las órdenes/cotizaciones
        const orders = await prisma.order.findMany({
            orderBy: [
                { submittedAt: "desc" },
                { createdAt: "desc" }
            ],
            include: {
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
                },
                items: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        quantity: true,
                        unitPrice: true,
                        subtotal: true
                    }
                },
                _count: {
                    select: {
                        items: true
                    }
                }
            }
        });

        return NextResponse.json(orders);

    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}