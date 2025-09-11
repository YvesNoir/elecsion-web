'use client';

import * as React from 'react';
import { useCart } from '@/store/cart';

function formatMoney(value: number, currency: string) {
    const cur = currency?.toUpperCase() === 'USD' ? 'USD' : 'ARS';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: cur, minimumFractionDigits: 2 }).format(value);
}

type Props = {
    sku: string;
    name: string;
    unit?: string | null;
    priceBase: number;     // ¡número plano! (no Prisma.Decimal)
    currency: string;
    imageUrl?: string;
    className?: string;
};

export default function CartControls({
                                         sku, name, unit, priceBase, currency, imageUrl, className,
                                     }: Props) {
    const [qty, setQty] = React.useState<number>(0);
    const { addItem } = useCart();

    const onAdd = () => {
        if (!sku || qty <= 0) return;
        addItem(
            {
                sku,
                name,
                unit: unit ?? undefined,
                price: Number(priceBase) || 0,
                currency,
                imageUrl,
            },
            qty
        );
        // si querés, resetear:
        // setQty(0);
    };

    const dec = () => setQty(q => Math.max(0, q - 1));
    const inc = () => setQty(q => q + 1);

    const total = (Number(priceBase) || 0) * qty;

    return (
        <div className={className}>
            <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wide text-[#7a7a7a]">Carrito</span>
                <div className="ml-auto flex items-center gap-1">
                    <button onClick={dec} className="h-7 w-7 rounded border text-sm text-[#1C1C1C] hover:bg-gray-50">−</button>
                    <div className="h-7 min-w-[2.25rem] rounded border px-2 text-center text-sm leading-7">{qty}</div>
                    <button onClick={inc} className="h-7 w-7 rounded border text-sm text-[#1C1C1C] hover:bg-gray-50">+</button>
                </div>
            </div>

            {qty > 0 && (
                <div className="mt-3 rounded-md bg-[#F7F7F7] px-3 py-2">
                    <div className="text-xs text-[#646464]">
                        Valor total: <span className="font-medium text-[#1C1C1C]">{formatMoney(total, currency)}</span> <span className="text-[#9a9a9a]">+ IVA</span>
                    </div>
                    <button
                        onClick={onAdd}
                        className="mt-2 inline-flex items-center justify-center rounded-md bg-[#1C1C1C] px-3 py-1.5 text-sm font-medium text-white hover:bg-black"
                    >
                        Añadir al carrito
                    </button>
                </div>
            )}
        </div>
    );
}