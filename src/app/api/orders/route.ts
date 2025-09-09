import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OrderType, OrderStatus, Prisma } from "@prisma/client";
import { getSession } from "@/lib/session";

type Body = {
    items: Array<{ productId: string; qty: number }>;
    contact?: { name?: string; email?: string; phone?: string; message?: string };
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
            const order = await prisma.order.create({
                data: {
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
                select: { id: true },
            });

            return NextResponse.json({ ok: true, orderId: order.id, type: "QUOTE" });
        }

        // Cliente => ORDER
        const userId = session.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, assignedSellerId: true },
        });
        if (!user || user.role !== "CLIENT") {
            return NextResponse.json({ error: "Solo clientes pueden crear pedidos" }, { status: 403 });
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

        const order = await prisma.order.create({
            data: {
                type: OrderType.ORDER,
                status: OrderStatus.DRAFT,
                currency: "ARS",
                clientUserId: user.id,
                sellerUserId: user.assignedSellerId ?? null,
                subtotal,
                tax,
                total,
                items: { create: itemsCreate },
            },
            select: { id: true },
        });

        return NextResponse.json({ ok: true, orderId: order.id, type: "ORDER" });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Error creando pedido/cotización" }, { status: 500 });
    }
}