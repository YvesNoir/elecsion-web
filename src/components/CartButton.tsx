// src/components/CartButton.tsx
"use client";

import { useEffect, useState } from "react";

type CartItem = {
    id: string;
    sku: string | null;
    name: string;
    quantity: number;
    unit?: string | null;
    unitPrice?: number | null;
    total?: number | null;
};

type CartOrder = {
    id: string;
    items: CartItem[];
};

function formatCurrency(n: number) {
    return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

export default function CartButton() {
    const [count, setCount] = useState(0);
    const [amount, setAmount] = useState(0);

    const computeFromOrder = (order: CartOrder | null) => {
        if (!order?.items?.length) {
            setCount(0);
            setAmount(0);
            return;
        }
        const itemsCount = order.items.reduce((acc, it) => acc + Number(it.quantity ?? 0), 0);
        const subtotal = order.items.reduce((acc, it) => {
            const qty = Number(it.quantity ?? 0);
            const line =
                (typeof it.total === "number" ? it.total : 0) ||
                ((it.unitPrice ?? 0) * qty);
            return acc + (isFinite(line) ? line : 0);
        }, 0);

        setCount(itemsCount);
        setAmount(subtotal);
    };

    const fetchCart = async () => {
        try {
            const res = await fetch("/api/orders", { cache: "no-store" });
            if (res.ok) {
                const data = (await res.json()) as { order: CartOrder | null };
                computeFromOrder(data.order ?? null);
            } else if (res.status === 401) {
                // no logueado => vaciar
                setCount(0);
                setAmount(0);
            } else {
                setCount(0);
                setAmount(0);
            }
        } catch {
            setCount(0);
            setAmount(0);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    useEffect(() => {
        const handler = () => fetchCart();
        window.addEventListener("cart:changed", handler);
        return () => window.removeEventListener("cart:changed", handler);
    }, []);

    return (
        <div className="inline-flex items-center">
            <div className="relative rounded-full bg-[#384a93] text-white px-3 py-2 flex items-center gap-2">
        <span className="relative inline-block">
          {/* carrito */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6h15l-1.5 9h-12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M6 6 5 3H2" stroke="currentColor" strokeWidth="2" />
            <circle cx="9" cy="20" r="1.6" fill="currentColor" />
            <circle cx="18" cy="20" r="1.6" fill="currentColor" />
          </svg>

            {/* badge con el conteo real */}
            {count > 0 && (
                <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs font-bold text-[#384a93] ring-1 ring-[#384a93]/20">
              {count}
            </span>
            )}
        </span>

                {/* monto */}
                <span className="text-sm font-medium">{formatCurrency(amount)}</span>
            </div>
        </div>
    );
}