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
        
        const body = await request.json();
        const { items, quoteMessage, quoteName, quotePhone, quoteEmail, quoteCompany, quoteCuit } = body;


        // Validaciones básicas
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
        }

        // Validaciones para usuarios no logueados
        if (!session?.user) {
            if (!quoteName || !quoteEmail) {
                return NextResponse.json({ error: "Nombre y email son obligatorios" }, { status: 400 });
            }
            // Validar formato de email
            const emailRegex = /\S+@\S+\.\S+/;
            if (!emailRegex.test(quoteEmail)) {
                return NextResponse.json({ error: "Email no válido" }, { status: 400 });
            }
        }

        // Obtener datos del usuario cliente si está logueado
        let clientUser = null;
        let sellerId = null;

        if (session?.user) {
            clientUser = await prisma.user.findUnique({
                where: { id: session.user.id },
                include: {
                    assignedSeller: true
                }
            });

            if (!clientUser) {
                return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
            }

            // Determinar vendedor asignado
            if (clientUser.role === "CLIENT" && clientUser.assignedSeller) {
                sellerId = clientUser.assignedSeller.id;
            }
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

        // Generar código único para la cotización
        let code: string;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
            // Generar código basado en timestamp y número aleatorio para evitar duplicados
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            code = `COT-${timestamp}${random}`;
            
            // Verificar si el código ya existe
            const existingOrder = await prisma.order.findUnique({
                where: { code },
                select: { id: true }
            });
            
            if (!existingOrder) {
                break; // Código único encontrado
            }
            
            attempts++;
        } while (attempts < maxAttempts);
        
        if (attempts >= maxAttempts) {
            // Fallback: usar UUID parcial si no se puede generar código único
            code = `COT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        }

        // Crear la orden como cotización
        const order = await prisma.order.create({
            data: {
                code: code,
                type: "QUOTE",
                status: "SUBMITTED",
                clientUserId: clientUser?.id || null,
                sellerUserId: sellerId,
                subtotal: subtotal,
                taxTotal: taxTotal,
                grandTotal: grandTotal,
                tax: taxTotal,
                total: grandTotal,
                currency: "ARS",
                submittedAt: new Date(),
                quoteEmail: quoteEmail || clientUser?.email || "",
                quoteName: quoteName || clientUser?.name || "",
                quotePhone: quotePhone || clientUser?.phone || "",
                quoteCompany: quoteCompany || "",
                quoteCuit: quoteCuit || "",
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
            message: clientUser && sellerId 
                ? "Cotización enviada exitosamente a tu vendedor asignado"
                : clientUser 
                    ? "Cotización creada exitosamente. Un vendedor la revisará pronto"
                    : "Cotización recibida exitosamente. Te contactaremos pronto con los precios"
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating quote:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" }, 
            { status: 500 }
        );
    }
}