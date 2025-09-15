import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    sku?: string;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        
        // Verificar que el usuario esté logueado
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { items, quoteMessage, quoteName, quotePhone, quoteEmail } = body;


        // Validaciones básicas
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
        }

        // Obtener datos del usuario cliente
        const clientUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                assignedSeller: true
            }
        });

        if (!clientUser) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Determinar vendedor asignado
        let sellerId = null;
        if (clientUser.role === "CLIENT" && clientUser.assignedSeller) {
            sellerId = clientUser.assignedSeller.id;
        }

        // Calcular totales
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            // Intentar buscar por id primero, luego por sku
            let product = null;
            
            if (item.id) {
                product = await prisma.product.findUnique({
                    where: { id: item.id }
                });
            }
            
            if (!product && item.sku) {
                product = await prisma.product.findUnique({
                    where: { sku: item.sku }
                });
            }

            if (!product) {
                return NextResponse.json(
                    { error: `Producto no encontrado: ${item.name}` }, 
                    { status: 404 }
                );
            }

            const itemSubtotal = Number(product.priceBase) * item.quantity;
            subtotal += itemSubtotal;

            orderItems.push({
                productId: product.id,
                sku: product.sku,
                name: product.name,
                quantity: item.quantity,
                unit: product.unit || "unidad",
                unitPrice: Number(product.priceBase),
                subtotal: itemSubtotal,
                total: itemSubtotal // Sin impuestos por ahora
            });
        }

        // Calcular impuestos y total (puedes ajustar la lógica según necesites)
        const taxRate = 0.21; // 21% IVA
        const taxTotal = subtotal * taxRate;
        const grandTotal = subtotal + taxTotal;

        // Generar código secuencial para la cotización
        const lastOrder = await prisma.order.findFirst({
            where: { type: "QUOTE" },
            orderBy: { createdAt: "desc" },
            select: { code: true }
        });

        let nextNumber = 1;
        if (lastOrder?.code && lastOrder.code.startsWith("COT-")) {
            const lastNumber = parseInt(lastOrder.code.replace("COT-", ""));
            if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1;
            }
        }

        const code = `COT-${nextNumber}`;

        // Crear la orden como cotización
        const order = await prisma.order.create({
            data: {
                code: code,
                type: "QUOTE",
                status: "SUBMITTED",
                clientUserId: clientUser.id,
                sellerUserId: sellerId,
                subtotal: subtotal,
                taxTotal: taxTotal,
                grandTotal: grandTotal,
                tax: taxTotal,
                total: grandTotal,
                currency: "ARS",
                submittedAt: new Date(),
                quoteEmail: quoteEmail || clientUser.email,
                quoteName: quoteName || clientUser.name,
                quotePhone: quotePhone || clientUser.phone,
                quoteMessage: quoteMessage || "",
                items: {
                    create: orderItems
                }
            },
            include: {
                items: true,
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
            }
        });

        // Respuesta exitosa
        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                code: order.code,
                status: order.status,
                total: order.total,
                currency: order.currency,
                itemCount: order.items.length,
                submittedAt: order.submittedAt,
                assignedSeller: order.sellerUser ? {
                    name: order.sellerUser.name,
                    email: order.sellerUser.email
                } : null
            },
            message: sellerId 
                ? "Cotización enviada exitosamente a tu vendedor asignado"
                : "Cotización creada exitosamente. Un vendedor la revisará pronto"
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating quote:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}