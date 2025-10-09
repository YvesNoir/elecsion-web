import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { sendEmail, emailTemplates } from "@/lib/email";
import { generateQuoteCode } from "@/lib/counter";

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

        // Calcular totales - optimización: una sola consulta para todos los productos
        const productIds = items.map(item => item.id).filter(Boolean);
        const productSkus = items.map(item => item.sku).filter(Boolean);

        // Buscar todos los productos de una vez
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { id: { in: productIds } },
                    { sku: { in: productSkus } }
                ]
            }
        });

        // Crear mapa para búsqueda rápida
        const productMap = new Map();
        products.forEach(product => {
            productMap.set(product.id, product);
            productMap.set(product.sku, product);
        });

        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            // Buscar producto en el mapa (primero por ID, luego por SKU)
            let product = item.id ? productMap.get(item.id) : null;
            if (!product && item.sku) {
                product = productMap.get(item.sku);
            }

            if (!product) {
                return NextResponse.json(
                    { error: `Producto no encontrado: ${item.name}` },
                    { status: 404 }
                );
            }

            // IMPORTANTE: Usar el precio que viene del carrito (ya convertido a ARS)
            // en lugar del precio original de la base de datos
            const unitPrice = item.price || Number(product.priceBase);
            const itemSubtotal = unitPrice * item.quantity;
            subtotal += itemSubtotal;

            orderItems.push({
                productId: product.id,
                sku: product.sku,
                name: product.name,
                quantity: item.quantity,
                unit: product.unit || "unidad",
                unitPrice: unitPrice, // Precio ya convertido del carrito
                subtotal: itemSubtotal,
                total: itemSubtotal // Sin impuestos por ahora
            });
        }

        // Calcular impuestos y total (puedes ajustar la lógica según necesites)
        const taxRate = 0.21; // 21% IVA
        const taxTotal = subtotal * taxRate;
        const grandTotal = subtotal + taxTotal;

        // Generar código secuencial para la cotización
        const code = await generateQuoteCode();

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

        // Enviar notificaciones por email
        const emailResults = [];
        try {
            const clientName = quoteName || clientUser?.name || 'Cliente';
            const clientEmail = quoteEmail || clientUser?.email;
            const orderNumber = order.code || order.id;


            // Ejecutar consultas de usuarios en paralelo
            const [seller, admins] = await Promise.all([
                sellerId
                    ? prisma.user.findUnique({
                        where: { id: sellerId },
                        select: { email: true }
                    })
                    : Promise.resolve(null),
                prisma.user.findMany({
                    where: { role: 'ADMIN' },
                    select: { email: true }
                })
            ]);

            // Preparar templates
            const clientTemplate = clientEmail
                ? emailTemplates.quoteCreatedForClient(orderNumber, clientName)
                : null;

            // Preparar lista de destinatarios para vendedores/admins
            const recipients = [];
            if (seller?.email) {
                recipients.push(seller.email);
            }
            admins.forEach(admin => {
                if (admin.email) {
                    recipients.push(admin.email);
                }
            });

            const sellerTemplate = recipients.length > 0 && clientEmail
                ? emailTemplates.quoteCreatedForSellers(orderNumber, clientName, clientEmail)
                : null;

            // Enviar emails en paralelo
            const emailPromises = [];

            // 1. Email al cliente
            if (clientTemplate && clientEmail) {
                emailPromises.push(
                    sendEmail({
                        to: clientEmail,
                        subject: clientTemplate.subject,
                        html: clientTemplate.html
                    }).then(result => ({ type: 'client', email: clientEmail, success: result.success, error: result.error }))
                );
            }

            // 2. Email a vendedores y administradores
            if (sellerTemplate && recipients.length > 0) {
                emailPromises.push(
                    sendEmail({
                        to: recipients,
                        subject: sellerTemplate.subject,
                        html: sellerTemplate.html
                    }).then(result => ({ type: 'sellers', emails: recipients, success: result.success, error: result.error }))
                );
            }

            // Esperar todos los emails
            if (emailPromises.length > 0) {
                const results = await Promise.all(emailPromises);
                emailResults.push(...results);
            }
        } catch (emailError) {
            console.error('Error sending quote email notifications:', emailError);
            emailResults.push({ type: 'error', error: emailError });
            // No interrumpimos el flujo por errores de email
        }

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