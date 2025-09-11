// src/components/catalog/ProductCardRow.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useCart } from "@/store/cart";

type Props = {
    sku: string | null;
    name: string;
    unit?: string | null;
    priceBase: number;
    currency: string;
    taxRate?: number | null;
    stockQty?: number | null;
};

function formatMoney(value: number, currency: string) {
    const n = Number(value ?? 0);
    const cur = currency?.toUpperCase() === "USD" ? "USD" : "ARS";
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: cur,
        minimumFractionDigits: 2,
    }).format(n);
}

export default function ProductCardRow({
                                           sku,
                                           name,
                                           unit,
                                           priceBase,
                                           currency,
                                           taxRate,
                                           stockQty,
                                       }: Props) {
    // carrito tolerante a distintas implementaciones
    const cart = useCart() as any;
    const addItem = cart?.addItem as
        | ((p: { sku: string; name: string; price: number; currency: string; unit?: string }, qty: number) => void)
        | undefined;
    const cartLines: Array<{ sku: string; qty: number }> = Array.isArray(cart?.lines)
        ? cart.lines
        : Array.isArray(cart?.items)
            ? cart.items
            : [];
    const inCartQty = useMemo(
        () => (sku ? (cartLines.find((l) => l.sku === sku)?.qty ?? 0) : 0),
        [cartLines, sku]
    );

    const [qty, setQty] = useState(0);

    const stockNumber = Number(stockQty ?? 0);
    const hayStock = Number.isFinite(stockNumber) && stockNumber > 0;

    const ivaPct = Number(taxRate ?? 0) * 100;
    const total = useMemo(() => Number(priceBase ?? 0) * qty, [priceBase, qty]);

    const normalizedSku = (sku ?? "").trim();
    const imgSrc = normalizedSku
        ? `/product-images/${normalizedSku}.jpg`
        : "/product-images/placeholder.jpg";

    const dec = () => setQty((q) => Math.max(0, q - 1));
    const inc = () => setQty((q) => Math.min(9999, q + 1));

    const add = () => {
        if (!normalizedSku || qty < 1) return;
        if (typeof addItem === "function") {
            addItem(
                { sku: normalizedSku, name, price: Number(priceBase), currency, unit: unit ?? undefined },
                qty
            );
            if (typeof cart?.open === "function") cart.open(true);
            else if (typeof cart?.setOpen === "function") cart.setOpen(true);
            else window.dispatchEvent(new CustomEvent("cart:open"));
        }
        setQty(0);
    };

    return (
        <li className="rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 sm:px-5 sm:py-4 shadow-sm hover:shadow transition">
            {/* GRID 10 -> 40/20/10/10/20 */}
            <div className="grid grid-cols-10 items-center gap-4">
                {/* 40%: imagen + datos */}
                <div className="col-span-10 md:col-span-4 overflow-hidden">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-14 w-14 flex-none overflow-hidden rounded-md ring-1 ring-gray-200 bg-gray-50">
                            <img
                                src={imgSrc}
                                alt={normalizedSku || "Producto"}
                                width={56}
                                height={56}
                                loading="lazy"
                                className="h-14 w-14 object-cover"
                                onError={(e) => {
                                    const el = e.currentTarget as HTMLImageElement;
                                    el.onerror = null;
                                    el.src = "/product-images/placeholder.jpg";
                                }}
                            />
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm text-[#646464] leading-none truncate">
                                {normalizedSku ? (
                                    <span className="font-medium text-[#1C1C1C]">{normalizedSku}</span>
                                ) : (
                                    <span className="text-[#9a9a9a]">Sin SKU</span>
                                )}
                            </div>
                            <div className="mt-1 truncate text-[15px] text-[#1C1C1C]">{name}</div>
                            {!!unit && <div className="mt-0.5 text-xs text-[#7a7a7a]">U.M.: {unit}</div>}
                        </div>
                    </div>
                </div>

                {/* 20%: Stock */}
                <div className="col-span-5 md:col-span-2">
                    <div className="text-[11px] uppercase tracking-wide text-[#7a7a7a]">Stock</div>
                    <div
                        className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                            hayStock ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}
                        title={hayStock ? "Con stock" : "Sin stock"}
                    >
                        <span className={`inline-block size-2 rounded-sm ${hayStock ? "bg-green-600" : "bg-gray-400"}`} />
                        {hayStock ? "Disponible" : "Sin stock"}
                    </div>
                </div>

                {/* 10%: Precio */}
                <div className="col-span-5 md:col-span-1">
                    <div className="text-[11px] uppercase tracking-wide text-[#7a7a7a]">Precio</div>
                    <div className="mt-1 font-medium text-[#1C1C1C]">{formatMoney(priceBase, currency)}</div>
                </div>

                {/* 10%: IVA */}
                <div className="col-span-5 md:col-span-1">
                    <div className="text-[11px] uppercase tracking-wide text-[#7a7a7a]">IVA</div>
                    <div className="mt-1 text-[#1C1C1C]">
                        {Number.isFinite(ivaPct) && ivaPct > 0 ? `${ivaPct.toFixed(1)}%` : "—"}
                    </div>
                </div>

                {/* 20%: Controles */}
                <div className="col-span-10 md:col-span-2 flex flex-col items-end">
                    <div className="self-end text-[11px] uppercase tracking-wide text-[#7a7a7a]">Carrito</div>
                    <div className="mt-1 inline-flex items-center rounded-md border border-[#E5E5E5] overflow-hidden">
                        <button type="button" onClick={dec} className="h-7 w-7 text-sm text-[#1C1C1C] hover:bg-gray-50" aria-label="Restar">–</button>
                        <div className="h-7 min-w-[2.25rem] px-1 text-center text-sm leading-7 text-[#1C1C1C]">{qty}</div>
                        <button type="button" onClick={inc} className="h-7 w-7 text-sm text-[#1C1C1C] hover:bg-gray-50" aria-label="Sumar">+</button>
                    </div>
                    {inCartQty > 0 && (
                        <div className="mt-1 text-[11px] text-[#7a7a7a]">En carrito: {inCartQty} u.</div>
                    )}
                </div>
            </div>

            {/* Bloque secundario */}
            {qty >= 1 && (
                <div className="mt-3 rounded-md border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-sm text-[#646464]">
                        Valor total:{" "}
                        <span className="font-medium text-[#1C1C1C]">{formatMoney(total, currency)}</span>{" "}
                        <span className="text-xs">+ IVA</span>
                    </div>
                    <button
                        type="button"
                        onClick={add}
                        className="inline-flex items-center justify-center rounded-md bg-[#1C1C1C] px-3 py-1.5 text-sm font-medium text-white hover:bg-black/90"
                    >
                        Añadir al carrito
                    </button>
                </div>
            )}
        </li>
    );
}