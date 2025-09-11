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

function money(n: number, cur: string) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: cur?.toUpperCase() === "USD" ? "USD" : "ARS",
        minimumFractionDigits: 2,
    }).format(Number(n || 0));
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
    const { lines, addItem } = useCart();       // ✅ usamos campos del hook
    const [qty, setQty] = useState(0);

    const normalizedSku = (sku ?? "").trim();
    const imgSrc = normalizedSku
        ? `/product-images/${normalizedSku}.jpg`
        : "/product-images/placeholder.jpg";

    const hayStock = Number(stockQty ?? 0) > 0;
    const ivaPct = Number(taxRate ?? 0) * 100;
    const total = useMemo(() => Number(priceBase ?? 0) * qty, [priceBase, qty]);

    // ✅ SOLO extraemos la cantidad de este producto en el carrito
    const inCartQty = useMemo(
        () => (lines.find(l => l.sku === normalizedSku)?.qty ?? 0),
        [lines, normalizedSku]
    );

    const dec = () => setQty(q => Math.max(0, q - 1));
    const inc = () => setQty(q => Math.min(9999, q + 1));

    const add = () => {
        if (!normalizedSku || qty < 1) return;
        addItem(
            {
                sku: normalizedSku,
                name,
                price: Number(priceBase),
                currency,
                unit: unit ?? undefined,
            },
            qty
        );
        setQty(0);
    };

    return (
        <li className="rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 sm:px-5 sm:py-4 shadow-sm hover:shadow transition">
            <div className="flex items-center gap-4">
                <div className="size-12 flex-none overflow-hidden rounded-md ring-1 ring-gray-200 bg-gray-50">
                    <img
                        src={imgSrc}
                        alt={normalizedSku || "Producto"}
                        width={48}
                        height={48}
                        loading="lazy"
                        className="h-12 w-12 object-cover"
                        onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            el.onerror = null;
                            el.src = "/product-images/placeholder.jpg";
                        }}
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="text-sm text-[#646464] leading-none">
                        {normalizedSku ? (
                            <span className="font-medium text-[#1C1C1C]">{normalizedSku}</span>
                        ) : (
                            <span className="text-[#9a9a9a]">Sin SKU</span>
                        )}
                    </div>
                    <div className="mt-1 truncate text-[15px] text-[#1C1C1C]">{name}</div>
                    {!!unit && (
                        <div className="mt-0.5 text-xs text-[#7a7a7a]">U.M.: {unit}</div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-4 w-full sm:w-[520px] md:w-[600px]">
                    <div className="flex flex-col items-start sm:items-center">
                        <div className="text-[11px] uppercase tracking-wide text-[#7a7a7a]">
                            Stock
                        </div>
                        <div
                            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                                hayStock ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                            }`}
                            title={hayStock ? "Con stock" : "Sin stock"}
                        >
              <span
                  className={`inline-block size-2 rounded-sm ${
                      hayStock ? "bg-green-600" : "bg-gray-400"
                  }`}
              />
                            {hayStock ? "Disponible" : "Sin stock"}
                        </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-center">
                        <div className="text-[11px] uppercase tracking-wide text-[#7a7a7a]">
                            Precio
                        </div>
                        <div className="mt-1 font-medium text-[#1C1C1C]">
                            {money(priceBase, currency)}
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="self-start sm:self-center text-[11px] uppercase tracking-wide text-[#7a7a7a]">
                            IVA
                        </div>
                        <div className="mt-1 self-start sm:self-center text-[#1C1C1C]">
                            {ivaPct > 0 ? `${ivaPct.toFixed(1)}%` : "—"}
                        </div>

                        {/* Controles */}
                        <div className="mt-2 inline-flex items-center rounded-md border border-[#E5E5E5] overflow-hidden">
                            <button type="button" onClick={dec} className="h-7 w-7 text-sm hover:bg-gray-50">–</button>
                            <div className="h-7 min-w-[2.25rem] px-1 text-center text-sm leading-7">{qty}</div>
                            <button type="button" onClick={inc} className="h-7 w-7 text-sm hover:bg-gray-50">+</button>
                        </div>

                        {/* Info pequeña de lo que ya hay en carrito */}
                        {inCartQty > 0 && (
                            <div className="mt-1 text-[11px] text-[#7a7a7a]">
                                En carrito: <span className="font-medium">{inCartQty}</span> u.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bloque secundario bajo la fila */}
            {qty >= 1 && (
                <div className="mt-3 rounded-md border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-sm text-[#646464]">
                        Valor total:{" "}
                        <span className="font-medium text-[#1C1C1C]">
              {money(total, currency)}
            </span>{" "}
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