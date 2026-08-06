import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await getSession();
        
        // Verificar que el usuario esté logueado y tenga permisos
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        
        if (session.user.role !== "ADMIN" && session.user.role !== "SELLER") {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        if (session.user.role === "SELLER" && !session.user.id) {
            return NextResponse.json({ error: "Sesión de vendedor inválida" }, { status: 401 });
        }

        // Los vendedores solo deben recibir pedidos asignados a ellos.
        // Los administradores pueden consultar todos los pedidos.
        const orders = await prisma.order.findMany({
            ...(session.user.role === "SELLER"
                ? { where: { sellerUserId: session.user.id } }
                : {}),
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
                        id: true,
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

        const normalizedOrders = orders.map((order) => ({
            ...order,
            // Pedidos rápidos antiguos pueden no tener submittedAt.
            submittedAt: order.submittedAt ?? order.createdAt,
        }));

        return NextResponse.json(normalizedOrders);

    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}
