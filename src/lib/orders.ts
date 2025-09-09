// src/lib/orders.ts
import { Prisma, Product } from "@prisma/client";

export function toDec(n: number | string | Prisma.Decimal | null | undefined) {
    const x = typeof n === "string" ? Number(n.replace(/\./g, "").replace(",", ".")) : Number(n);
    return new Prisma.Decimal(Number.isFinite(x) ? x : 0);
}

export function computeLine(p: Pick<Product, "priceBase" | "taxRate">, qty: number) {
    const base = new Prisma.Decimal(p.priceBase ?? 0);
    const rate = new Prisma.Decimal(p.taxRate ?? 0);
    const q = new Prisma.Decimal(qty || 0);

    const subtotal = base.mul(q);
    const tax = subtotal.mul(rate);
    const total = subtotal.add(tax);

    return { base, rate, subtotal, tax, total, qty: q };
}