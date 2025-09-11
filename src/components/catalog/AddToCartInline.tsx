// src/components/catalog/AddToCartInline.tsx
'use client';

import { useState } from 'react';

type Props = {
    sku?: string | null;
    priceBase: number | string;   // Prisma.Decimal | number
    currency: string;             // 'ARS' | 'USD' | ...
};

function formatMoney(value: number, currency: string) {
    const cur = currency?.toUpperCase() === 'USD' ? 'USD' : 'ARS';
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: cur,
        minimumFractionDigits: 2,
    }).format(value);
}

export default function AddToCartInline({ sku, priceBase, currency }: Props) {
    const [qty, setQty] = useState<number>(0);

    const nPrice = Number(priceBase ?? 0);
    const subTotal = qty > 0 ? nPrice * qty : 0;

    function dec() {
        setQty((q) => Math.max(0, q - 1));
    }
    function inc() {
        setQty((q) => Math.min(9999, q + 1));
    }
    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const v = Number(e.target.value.replace(/[^\d]/g, ''));
        setQty(isFinite(v) ? Math.min(9999, Math.max(0, v)) : 0);
    }

    function onAdd() {
        // Placeholder: integra acá tu acción/endpoint de carrito
        // p.ej. fetch('/api/cart/add', { method:'POST', body: JSON.stringify({ sku, qty }) })
        // Por ahora solo log:
        console.log('ADD_TO_CART', { sku, qty });
    }

    return (
        <div className="flex flex-col items-start sm:items-end gap-1">
            <div className="text-[11px] uppercase tracking-wide text-[#7a7a7a]">Carrito</div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={dec}
                    className="h-8 w-8 rounded-md border text-sm leading-none hover:bg-gray-50"
                    aria-label="Restar"
                >
                    –
                </button>

                <input
                    inputMode="numeric"
                    value={qty}
                    onChange={onChange}
                    className="h-8 w-12 rounded-md border px-2 text-center text-sm"
                />

                <button
                    type="button"
                    onClick={inc}
                    className="h-8 w-8 rounded-md border text-sm leading-none hover:bg-gray-50"
                    aria-label="Sumar"
                >
                    +
                </button>
            </div>

            {qty > 0 && (
                <div className="mt-1 flex flex-col items-start sm:items-end gap-2">
                    <div className="text-xs text-[#7a7a7a]">
                        Valor total:{' '}
                        <span className="font-medium text-[#1C1C1C]">
              {formatMoney(subTotal, currency)}
            </span>{' '}
                        + IVA
                    </div>

                    <button
                        type="button"
                        onClick={onAdd}
                        className="inline-flex items-center gap-2 rounded-md bg-[#1C1C1C] px-3 py-2 text-sm text-white hover:opacity-90"
                    >
                        Añadir al carrito
                    </button>
                </div>
            )}
        </div>
    );
}