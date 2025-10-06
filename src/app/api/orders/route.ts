import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OrderType, OrderStatus, Prisma } from "@prisma/client";
import { getSession } from "@/lib/session";
import { sendEmail, emailTemplates } from "@/lib/email";
import { generateQuoteCode, generateOrderCode } from "@/lib/counter";

type Body = {
    items: Array<{ productId: string; qty: number }>;
    contact?: { name?: string; email?: string; phone?: string; message?: string };
    clientId?: string; // Para pedidos rápidos desde admin/vendedor
};

export async function POST(req: Request) {
    try {
        const session = await getSession();
        const body = (await req.json()) as Body;

        if (!Array.isArray(body.items) || body.items.length === 0) {
            return NextResponse.json({ error: "Sin items" }, { status: 400 });
        }

        // Invitado => QUOTE
        if (!session?.user) {
            const code = await generateQuoteCode();
            const order = await prisma.order.create({
                data: {
                    code,
                    type: OrderType.QUOTE,
                    status: OrderStatus.DRAFT,
                    currency: "ARS",
                    quoteName: body.contact?.name ?? null,
                    quoteEmail: body.contact?.email ?? null,
                    quotePhone: body.contact?.phone ?? null,
                    quoteMessage: body.contact?.message ?? null,
                    items: {
                        create: body.items.map((it) => ({
                            productId: it.productId,
                            name: "(producto)",
                            quantity: new Prisma.Decimal(it.qty ?? 0),
                            unitPrice: null,
                            taxRate: null,
                            subtotal: null,
                            total: null,
                        })),
                    },
                },
                select: { id: true, code: true },
            });

            return NextResponse.json({ ok: true, orderId: order.id, orderCode: order.code, type: "QUOTE" });
        }

        // Determinar el cliente para el pedido
        const currentUserId = session.user.id;
        const currentUser = await prisma.user.findUnique({
            where: { id: currentUserId },
            select: { id: true, role: true, assignedSellerId: true },
        });

        if (!currentUser) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        let clientUserId: string;
        let clientUser: any;

        // Si es cliente regular, usar su propio ID
        if (currentUser.role === "CLIENT") {
            clientUserId = currentUser.id;
            clientUser = currentUser;
        }
        // Si es admin/vendedor y se especifica clientId, crear pedido para ese cliente
        else if ((currentUser.role === "ADMIN" || currentUser.role === "SELLER") && body.clientId) {
            const targetClient = await prisma.user.findUnique({
                where: { id: body.clientId },
                select: { id: true, role: true, assignedSellerId: true },
            });

            if (!targetClient || targetClient.role !== "CLIENT") {
                return NextResponse.json({ error: "Cliente no válido" }, { status: 400 });
            }

            // Verificar permisos: vendedores solo pueden crear pedidos para sus clientes asignados
            if (currentUser.role === "SELLER" && targetClient.assignedSellerId !== currentUser.id) {
                return NextResponse.json({ error: "No tienes permisos para crear pedidos para este cliente" }, { status: 403 });
            }

            clientUserId = targetClient.id;
            clientUser = targetClient;
        }
        else {
            return NextResponse.json({ error: "Debes especificar un cliente para el pedido" }, { status: 400 });
        }

        const ids = body.items.map((x) => x.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: ids }, isActive: true },
            select: { id: true, name: true, priceBase: true, taxRate: true, unit: true },
        });

        let subtotal = new Prisma.Decimal(0);
        let tax = new Prisma.Decimal(0);
        let total = new Prisma.Decimal(0);

        const itemsCreate = body.items.map((it) => {
            const p = products.find((pp) => pp.id === it.productId);
            const q = new Prisma.Decimal(it.qty ?? 0);

            if (!p) {
                const zero = new Prisma.Decimal(0);
                return {
                    productId: it.productId,
                    name: "(producto no encontrado)",
                    sku: null,
                    unit: null,
                    quantity: q,
                    unitPrice: zero,
                    taxRate: zero,
                    subtotal: zero,
                    total: zero,
                };
            }

            const base = new Prisma.Decimal(p.priceBase ?? 0);
            const rate = new Prisma.Decimal(p.taxRate ?? 0);

            const lineSubtotal = base.mul(q);
            const lineTax = lineSubtotal.mul(rate);
            const lineTotal = lineSubtotal.add(lineTax);

            subtotal = subtotal.add(lineSubtotal);
            tax = tax.add(lineTax);
            total = total.add(lineTotal);

            return {
                productId: p.id,
                name: p.name,
                sku: null,
                unit: p.unit ?? null,
                quantity: q,
                unitPrice: base,
                taxRate: rate,
                subtotal: lineSubtotal,
                total: lineTotal,
            };
        });

        // Determinar el estado del pedido según quien lo crea
        let orderStatus: OrderStatus;
        if (currentUser.role === "ADMIN" || currentUser.role === "SELLER") {
            // Admin/vendedor crea pedido para cliente - va directo como confirmado
            orderStatus = OrderStatus.APPROVED;
        } else {
            // Cliente crea su propio pedido - va como pendiente para revisión
            orderStatus = OrderStatus.SUBMITTED;
        }

        const code = await generateOrderCode();
        const order = await prisma.order.create({
            data: {
                code,
                type: OrderType.ORDER,
                status: orderStatus,
                currency: "ARS",
                clientUserId: clientUserId,
                sellerUserId: clientUser.assignedSellerId ?? null,
                subtotal,
                tax,
                total,
                items: { create: itemsCreate },
            },
            select: {
                id: true,
                code: true,
                clientUser: {
                    select: {
                        email: true,
                        name: true
                    }
                }
            },
        });

        // Enviar notificaciones por email
        try {
            const clientName = order.clientUser?.name || 'Cliente';
            const clientEmail = order.clientUser?.email;
            const orderNumber = order.code || order.id;

            // 1. Email al cliente según el estado del pedido
            if (clientEmail) {
                let clientTemplate;
                if (orderStatus === OrderStatus.APPROVED) {
                    // Pedido creado por admin/vendedor - ya está confirmado
                    clientTemplate = emailTemplates.orderApproved(orderNumber, clientName);
                } else {
                    // Pedido creado por cliente - está pendiente de revisión
                    clientTemplate = emailTemplates.orderCreatedForClient(orderNumber, clientName);
                }

                await sendEmail({
                    to: clientEmail,
                    subject: clientTemplate.subject,
                    html: clientTemplate.html
                });
            }

            // 2. Email a vendedores y administradores - pedido pendiente de revisión
            if (orderStatus === OrderStatus.SUBMITTED) {
                const recipients = [];

                // Obtener el vendedor asignado
                if (clientUser.assignedSellerId) {
                    const seller = await prisma.user.findUnique({
                        where: { id: clientUser.assignedSellerId },
                        select: { email: true }
                    });
                    if (seller?.email) {
                        recipients.push(seller.email);
                    }
                }

                // Obtener todos los administradores
                const admins = await prisma.user.findMany({
                    where: { role: 'ADMIN' },
                    select: { email: true }
                });

                admins.forEach(admin => {
                    if (admin.email) {
                        recipients.push(admin.email);
                    }
                });

                // Enviar notificación a vendedores y administradores
                if (recipients.length > 0 && clientEmail) {
                    const sellerTemplate = emailTemplates.orderCreatedForSellers(orderNumber, clientName, clientEmail);
                    await sendEmail({
                        to: recipients,
                        subject: sellerTemplate.subject,
                        html: sellerTemplate.html
                    });
                }
            }
        } catch (emailError) {
            console.error('Error sending email notifications:', emailError);
            // No interrumpimos el flujo por errores de email
        }

        return NextResponse.json({ ok: true, orderId: order.id, orderCode: order.code, type: "ORDER" });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Error creando pedido/cotización" }, { status: 500 });
    }
}