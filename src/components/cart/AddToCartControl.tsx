"use client";

import { useState, useEffect, useTransition } from "react";

type Props = {
    sku?: string | null;
    packSize?: number; // opcional (por si luego usás “venta x 100 u.”); default 1
};

export default function AddToCartControl({ sku, packSize = 1 }: Props) {
    const validSku = (sku ?? "").trim();
    const disabled = !validSku;
    const [qty, setQty] = useState<number>(0);
    const [isPending, startTransition] = useTransition();

    // (Opcional) al montar, podríamos leer el carrito para precargar cantidad
    useEffect(() => {
        // Si más adelante querés hidratar desde /api/cart (GET), podés hacerlo acá.
    }, []);

    const updateCart = (newQty: number) => {
        if (!validSku) return;
        startTransition(async () => {
            await fetch("/api/cart", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sku: validSku, qty: newQty }),
            });
        });
    };

    const inc = () => {
        const next = qty + packSize;
        setQty(next);
        updateCart(next);
    };

    const dec = () => {
        const next = Math.max(0, qty - packSize);
        setQty(next);
        updateCart(next);
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = Number(e.target.value);
        if (!Number.isFinite(v) || v < 0) return;
        setQty(v);
        updateCart(v);
    };

    return (
        <div className="flex flex-col items-end gap-1">
            {/* etiqueta superior (para inspirarnos en el ejemplo) */}
            <div className="text-[11px] uppercase tracking-wide text-[#7a7a7a]">Carrito</div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={dec}
                    disabled={disabled || isPending || qty <= 0}
                    className="h-8 w-8 rounded-md border border-[#D6D6D6] text-[#1C1C1C] disabled:opacity-50"
                    aria-label="Quitar"
                >
                    –
                </button>

                <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={packSize}
                    value={qty}
                    onChange={onChange}
                    disabled={disabled || isPending}
                    className="h-8 w-16 rounded-md border border-[#D6D6D6] px-2 text-center text-sm"
                />

                <button
                    type="button"
                    onClick={inc}
                    disabled={disabled || isPending}
                    className="h-8 w-8 rounded-md border border-[#D6D6D6] text-[#1C1C1C] disabled:opacity-50"
                    aria-label="Agregar"
                >
                    +
                </button>
            </div>

            {/* pie: “Venta x N u.” / “Master N u.” si querés */}
            {packSize > 1 && (
                <div className="text-[11px] text-[#7a7a7a] leading-none">
                    Venta x {packSize} u.
                </div>
            )}
        </div>
    );
}