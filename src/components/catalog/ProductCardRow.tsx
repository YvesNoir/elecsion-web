// src/components/catalog/ProductCardRow.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useCart } from "@/store/cart";
import { getProductImageUrl } from "@/lib/utils/image";

type Props = {
    sku: string | null;
    name: string;
    unit?: string | null;
    priceBase: number;
    currency: string;
    taxRate?: number | null;
    brand?: {
        name: string;
        slug: string;
    } | null;
    isLoggedIn: boolean;
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

function formatUSD(value: number) {
    return `U$S ${Number(value ?? 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
}

function formatARS(value: number) {
    return `$ ${Number(value ?? 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
}

export default function ProductCardRow({
                                           sku,
                                           name,
                                           unit,
                                           priceBase,
                                           currency,
                                           taxRate,
                                           brand,
                                           isLoggedIn,
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
    const [exchangeRate, setExchangeRate] = useState<{ sell: number } | null>(null);

    // Obtener cotización BNA para productos USD
    useEffect(() => {
        if (currency?.toUpperCase() === 'USD') {
            fetch('/api/exchange-rate')
                .then(res => res.json())
                .then(data => {
                    if (data.sell) {
                        setExchangeRate(data);
                    }
                })
                .catch(err => console.error('Error fetching exchange rate:', err));
        }
    }, [currency]);


    const ivaPct = Number(taxRate ?? 0);
    const total = useMemo(() => Number(priceBase ?? 0) * qty, [priceBase, qty]);
    
    // Calcular precio en pesos para productos USD
    const priceInARS = useMemo(() => {
        if (currency?.toUpperCase() === 'USD' && exchangeRate?.sell) {
            return Number(priceBase) * exchangeRate.sell;
        }
        return null;
    }, [priceBase, currency, exchangeRate]);

    const isUSD = currency?.toUpperCase() === 'USD';

    const normalizedSku = (sku ?? "").trim();
    const imgSrc = getProductImageUrl(normalizedSku);

    const dec = () => setQty((q) => Math.max(0, q - 1));
    const inc = () => setQty((q) => Math.min(9999, q + 1));

    const add = () => {
        if (!normalizedSku || qty < 1) return;
        if (typeof addItem === "function") {
            addItem(
                { id: normalizedSku, sku: normalizedSku, name, price: Number(priceBase), currency, unit: unit ?? undefined },
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
                                src={imgSrc}
                                alt={normalizedSku || "Producto"}
                                width={56}
                                height={56}
                                loading="lazy"
                                className="h-14 w-14 object-cover"
                                onError={(e) => {
                                    const el = e.currentTarget as HTMLImageElement;
                                    const currentSrc = el.src;

                                    // Si falló PNG, intentar JPG
                                    if (currentSrc.endsWith('.png') && normalizedSku) {
                                        el.src = `/product-images/${normalizedSku.toLowerCase().replace(/[^a-z0-9-]/g, '')}.jpg`;
                                    }
                                    // Si falló JPG o no hay SKU, usar placeholder
                                    else {
                                        el.onerror = null;
                                        el.src = "/product-images/placeholder.png";
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
                                {isUSD ? (
                                    <div>
                                        <div className="font-medium text-[#1C1C1C]">
                                            {formatUSD(priceBase)}
                                        </div>
                                        {priceInARS && (
                                            <div className="text-xs text-[#646464] mt-0.5">
                                                Precio en pesos: {formatARS(priceInARS)}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="font-medium text-[#1C1C1C]">
                                        {formatMoney(priceBase, currency)}
                                    </div>
                                )}
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
                                <span className="font-medium text-[#1C1C1C]">{formatMoney(total, currency)}</span>{" "}
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