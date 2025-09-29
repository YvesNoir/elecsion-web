import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { OrderType, OrderStatus, Prisma } from "@prisma/client";

type QuickOrderBody = {
    clientUserId: string;
    type: "ORDER";
    items: Array<{
        productId: string;
        sku: string;
        name: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        subtotal: number;
        total: number;
    }>;
    subtotal: number;
    total: number;
};

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        
        // Verificar que el usuario esté logueado y sea SELLER o ADMIN
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        
        if (!["SELLER", "ADMIN"].includes(session.user.role as string)) {
            return NextResponse.json({ error: "Solo vendedores y administradores pueden crear pedidos rápidos" }, { status: 403 });
        }

        const body: QuickOrderBody = await request.json();

        // Validaciones
        if (!body.clientUserId) {
            return NextResponse.json({ error: "Cliente requerido" }, { status: 400 });
        }

        if (!Array.isArray(body.items) || body.items.length === 0) {
            return NextResponse.json({ error: "Items requeridos" }, { status: 400 });
        }

        // Verificar que el cliente existe y es activo
        const client = await prisma.user.findUnique({
            where: { 
                id: body.clientUserId,
                role: "CLIENT",
                isActive: true,
                deleted: false
            },
            select: {
                id: true,
                assignedSellerId: true
            }
        });

        if (!client) {
            return NextResponse.json({ error: "Cliente no encontrado o inactivo" }, { status: 400 });
        }

        // Crear el código de la orden
        const orderCode = await generateOrderCode();

        // Crear la orden
        const order = await prisma.order.create({
            data: {
                code: orderCode,
                type: OrderType.ORDER,
                status: OrderStatus.SUBMITTED,
                currency: "ARS",
                clientUserId: client.id,
                sellerUserId: session.user.id, // El usuario que está creando el pedido
                submittedAt: new Date(),
                subtotal: new Prisma.Decimal(body.subtotal),
                tax: new Prisma.Decimal(0), // Por ahora sin impuestos adicionales
                total: new Prisma.Decimal(body.total),
                items: {
                    create: body.items.map(item => ({
                        productId: item.productId,
                        name: item.name,
                        sku: item.sku,
                        unit: item.unit,
                        quantity: new Prisma.Decimal(item.quantity),
                        unitPrice: new Prisma.Decimal(item.unitPrice),
                        taxRate: new Prisma.Decimal(0),
                        subtotal: new Prisma.Decimal(item.subtotal),
                        total: new Prisma.Decimal(item.total),
                    }))
                },
            },
            include: {
                items: true,
                clientUser: {
                    select: {
                        name: true,
                        email: true,
                        company: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                code: order.code,
                type: order.type,
                status: order.status,
                total: Number(order.total),
                client: order.clientUser
            }
        });

    } catch (error) {
        console.error("Error creating quick order:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}

// Función auxiliar para generar código de orden
async function generateOrderCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    const datePrefix = `ORD-${year}${month}${day}`;
    
    // Buscar el último número del día
    const lastOrder = await prisma.order.findFirst({
        where: {
            code: {
                startsWith: datePrefix
            }
        },
        orderBy: {
            code: 'desc'
        },
        select: {
            code: true
        }
    });

    let nextNumber = 1;
    if (lastOrder) {
        const lastNumber = parseInt(lastOrder.code.split('-').pop() || '0');
        nextNumber = lastNumber + 1;
    }

    return `${datePrefix}-${nextNumber.toString().padStart(3, '0')}`;
}