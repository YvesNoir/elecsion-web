// src/components/catalog/ProductCardRow.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useCart } from "@/store/cart";
import { getProductImageUrls } from "@/lib/utils/image";

type Props = {
    sku: string | null;
    articleCode?: string | null;
    imageCodes?: string[];
    name: string;
    unit?: string | null;
    priceBase: number;
    taxRate?: number | null;
    brand?: {
        name: string;
        slug: string;
    } | null;
    isLoggedIn: boolean;
};

function formatMoney(value: number) {
    const n = Number(value ?? 0);
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
    }).format(n);
}

export default function ProductCardRow({
                                           sku,
                                           articleCode,
                                           imageCodes,
                                           name,
                                           unit,
                                           priceBase,
                                           taxRate,
                                           brand,
                                           isLoggedIn,
                                       }: Props) {
    // carrito tolerante a distintas implementaciones
    const cart = useCart() as any;
    const addItem = cart?.addItem as
        | ((p: { id: string; sku: string; articleCode: string; imageCodes: string[]; name: string; price: number; currency: string; unit?: string }, qty: number) => void)
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
    const ivaPct = Number(taxRate ?? 0);
    const total = useMemo(() => Number(priceBase ?? 0) * qty, [priceBase, qty]);

    const normalizedSku = (sku ?? "").trim();
    const internalCode = (articleCode ?? normalizedSku).trim();
    const imageLookupCodes = imageCodes?.length ? imageCodes : [normalizedSku, internalCode];
    const imageUrls = getProductImageUrls(imageLookupCodes);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const dec = () => setQty((q) => Math.max(0, q - 1));
    const inc = () => setQty((q) => Math.min(9999, q + 1));

    const add = () => {
        if (!normalizedSku || qty < 1) return;
        if (typeof addItem === "function") {
            addItem(
                {
                    id: internalCode,
                    sku: normalizedSku,
                    articleCode: internalCode,
                    imageCodes: imageLookupCodes,
                    name,
                    price: Number(priceBase),
                    currency: "ARS",
                    unit: unit ?? undefined
                },
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
            {/* GRID 12 -> 4/2/2/2/2 */}
            <div className="grid grid-cols-12 items-center gap-4">
                {/* 33%: imagen + datos */}
                <div className="col-span-12 md:col-span-4 overflow-hidden">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-14 w-14 flex-none overflow-hidden rounded-md ring-1 ring-gray-200 bg-gray-50">
                            <img
                                src={imageUrls[currentImageIndex]}
                                alt={normalizedSku || "Producto"}
                                width={56}
                                height={56}
                                loading="lazy"
                                className="h-14 w-14 object-cover"
                                onError={() => {
                                    if (currentImageIndex < imageUrls.length - 1) {
                                        setCurrentImageIndex(prev => prev + 1);
                                    }
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

                {/* 17%: Marca */}
                <div className="col-span-4 md:col-span-2">
                    <div className="text-[11px] uppercase tracking-wide text-[#7a7a7a]">Marca</div>
                    <div className="mt-1 text-[#1C1C1C]">
                        {brand?.name || "—"}
                    </div>
                </div>


                {/* 25%: Precio */}
                <div className="col-span-4 md:col-span-3">
                    <div className="text-[11px] uppercase tracking-wide text-[#7a7a7a]">Precio</div>
                    <div className="mt-1">
                        {isLoggedIn ? (
                            <div>
                                <div className="font-medium text-[#1C1C1C]">
                                    {formatMoney(priceBase)}
                                </div>
                            </div>
                        ) : (
                            <span className="text-[#384A93] text-sm">Consultar</span>
                        )}
                    </div>
                </div>

                {/* 8%: IVA */}
                <div className="col-span-4 md:col-span-1">
                    <div className="text-[11px] uppercase tracking-wide text-[#7a7a7a]">IVA</div>
                    <div className="mt-1 text-[#1C1C1C]">
                        {Number.isFinite(ivaPct) && ivaPct > 0 ? `${ivaPct.toFixed(1)}%` : "—"}
                    </div>
                </div>

                {/* 17%: Controles */}
                <div className="col-span-4 md:col-span-2 flex flex-col items-end">
                    <div className="self-end text-[11px] uppercase tracking-wide text-[#7a7a7a]">
                        {isLoggedIn ? 'Agregar al carrito' : 'Cotizar'}
                    </div>
                    <div className="mt-1 inline-flex items-center rounded-full border border-[#e1e8f4] bg-[#e1e8f4] overflow-hidden">
                        <button type="button" onClick={dec} className="h-7 w-7 text-sm text-[#384A93] hover:bg-[#d1d8e4] transition-colors" aria-label="Restar">–</button>
                        <div className="h-7 min-w-[2.25rem] px-1 text-center text-sm leading-7 text-[#384A93] font-medium">{qty}</div>
                        <button type="button" onClick={inc} className="h-7 w-7 text-sm text-[#384A93] hover:bg-[#d1d8e4] transition-colors" aria-label="Sumar">+</button>
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
                        {isLoggedIn ? (
                            <>
                                Valor total:{" "}
                                <span className="font-medium text-[#1C1C1C]">{formatMoney(total)}</span>{" "}
                                <span className="text-xs">+ IVA</span>
                            </>
                        ) : (
                            <>
                                Cantidad: <span className="font-medium text-[#1C1C1C]">{qty}</span>{" "}
                                <span className="text-xs">• Precio a consultar</span>
                            </>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={add}
                        className="inline-flex items-center justify-center rounded-md bg-[#384A93] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2e3d7a]"
                    >
                        {isLoggedIn ? 'Añadir al carrito' : 'Agregar para cotizar'}
                    </button>
                </div>
            )}
        </li>
    );
}
