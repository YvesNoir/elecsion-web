// src/app/api/quotes/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { OrderStatus, OrderType } from "@prisma/client";

const QuoteSchema = z.object({
    contact: z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        message: z.string().optional(),
    }),
    // items del LS (sin precios)
    items: z.array(
        z.object({
            productId: z.string().optional(), // opcional por si solo guardás sku/nombre
            sku: z.string().optional(),
            name: z.string().min(1),
            qty: z.number().min(1).max(999),
            unit: z.string().optional(),
        })
    ).min(1),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = QuoteSchema.parse(body);

        const order = await prisma.order.create({
            data: {
                type: OrderType.QUOTE,
                status: OrderStatus.SUBMITTED,
                submittedAt: new Date(),
                // contacto invitado
                quoteName: data.contact.name,
                quoteEmail: data.contact.email,
                quotePhone: data.contact.phone,
                quoteMessage: data.contact.message,
                items: {
                    create: data.items.map((it) => ({
                        productId: it.productId,
                        sku: it.sku,
                        name: it.name,
                        quantity: it.qty,
                        unit: it.unit ?? "unidad",
                        // precios nulos: cotización
                        unitPrice: null,
                        taxRate: null,
                        subtotal: null,
                        total: null,
                    })),
                },
            },
            include: { items: true },
        });

        // (opcional) notificar por email/slack
        return NextResponse.json({ ok: true, orderId: order.id });
    } catch (e: any) {
        console.error("POST /api/quotes", e);
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}