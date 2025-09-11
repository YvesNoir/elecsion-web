// src/components/cart/CartDrawer.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useCart } from "@/store/cart";

function money(n: number, currency = "ARS") {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(
        Number(n || 0)
    );
}

export default function CartDrawer({ top = 64 }: { top?: number }) {
    // No asumimos la forma exacta del store para evitar crashes por nombres distintos
    const cart = useCart() as any;

    // Estado de apertura del drawer
    const isOpen: boolean = Boolean(cart?.isOpen ?? cart?.open ?? false);

    // Líneas del carrito (acepta `lines` o `items`)
    const lines: any[] = Array.isArray(cart?.lines)
        ? cart.lines
        : Array.isArray(cart?.items)
            ? cart.items
            : [];

    // Subtotal (si el store no lo da, lo calculamos)
    const subtotal: number = useMemo(() => {
        if (typeof cart?.subtotal === "number") return cart.subtotal;
        return lines.reduce(
            (acc, l) =>
                acc +
                Number(l?.price ?? 0) * Number(l?.qty ?? l?.quantity ?? 0),
            0
        );
    }, [cart?.subtotal, lines]);

    // Cerrar drawer con varias rutas posibles
    const close = () => {
        if (typeof cart?.close === "function") cart.close();
        else if (typeof cart?.closeDrawer === "function") cart.closeDrawer();
        else if (typeof cart?.setOpen === "function") cart.setOpen(false);
        else if (typeof cart?.toggle === "function") cart.toggle();
        else window.dispatchEvent(new CustomEvent("cart:close"));
    };

    // Cambiar cantidad (fallback a evento)
    const setQty = (sku: string, next: number) => {
        const q = Math.max(0, next | 0);
        if (typeof cart?.setQty === "function") cart.setQty(sku, q);
        else if (typeof cart?.updateQty === "function") cart.updateQty(sku, q);
        else window.dispatchEvent(
                new CustomEvent("cart:setQty", { detail: { sku, qty: q } })
            );
    };

    // Eliminar ítem (fallback a evento)
    const removeItem = (sku: string) => {
        if (typeof cart?.removeItem === "function") cart.removeItem(sku);
        else if (typeof cart?.delete === "function") cart.delete(sku);
        else window.dispatchEvent(
                new CustomEvent("cart:remove", { detail: { sku } })
            );
    };

    // Soporte para el evento global "cart:open" del botón
    useEffect(() => {
        const onOpen = () => {
            if (typeof cart?.setOpen === "function") cart.setOpen(true);
            else if (typeof cart?.open === "function") cart.open(true);
            else if (typeof cart?.toggle === "function") cart.toggle();
        };
        window.addEventListener("cart:open", onOpen);
        return () => window.removeEventListener("cart:open", onOpen);
    }, [cart]);

    // Moneda a mostrar (primera línea o ARS)
    const currency =
        (lines[0]?.currency as string | undefined) ?? "ARS";

    return (
        <aside
            className={`fixed right-0 z-40 w-[360px] sm:w-[420px] bg-white border-l shadow-xl transition-transform duration-300 ${
                isOpen ? "translate-x-0" : "translate-x-full"
            }`}
            style={{ top, bottom: 0 }}
            aria-hidden={!isOpen}
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-base font-semibold">Tu carrito</h2>
                <button
                    onClick={close}
                    className="rounded-md p-1.5 hover:bg-gray-100"
                    aria-label="Cerrar"
                >
                    ×
                </button>
            </div>

            {/* Body */}
            <div className="h-full overflow-y-auto px-4 pb-40 pt-3">
                {lines.length === 0 ? (
                    <p className="text-sm text-gray-500">Tu carrito está vacío.</p>
                ) : (
                    <ul className="space-y-3">
                        {lines.map((it: any) => {
                            const sku = String(it?.sku ?? "");
                            const qty = Number(it?.qty ?? it?.quantity ?? 0);
                            const price = Number(it?.price ?? 0);
                            const lineTotal = price * qty;
                            const img = `/product-images/${sku}.jpg`;

                            return (
                                <li key={sku} className="flex gap-3 rounded-md border p-3">
                                    <div className="h-14 w-14 flex-none overflow-hidden rounded bg-gray-50 ring-1 ring-gray-200">
                                        <img
                                            src={img}
                                            alt={sku}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                const el = e.currentTarget as HTMLImageElement;
                                                el.onerror = null;
                                                el.src = "/product-images/placeholder.jpg";
                                            }}
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium truncate">{sku}</div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {it?.name ?? ""}
                                        </div>

                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="inline-flex items-center rounded border overflow-hidden">
                                                <button
                                                    className="h-7 w-7 text-sm hover:bg-gray-50"
                                                    onClick={() => setQty(sku, qty - 1)}
                                                    aria-label="Restar"
                                                >
                                                    –
                                                </button>
                                                <div className="h-7 w-9 text-center text-sm leading-7">
                                                    {qty}
                                                </div>
                                                <button
                                                    className="h-7 w-7 text-sm hover:bg-gray-50"
                                                    onClick={() => setQty(sku, qty + 1)}
                                                    aria-label="Sumar"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <div className="text-sm font-medium">
                                                {money(lineTotal, it?.currency ?? currency)}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        className="self-start rounded p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => removeItem(sku)}
                                        aria-label="Eliminar"
                                        title="Eliminar"
                                    >
                                        🗑️
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Footer */}
            <div className="absolute inset-x-0 bottom-0 border-t bg-white px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal (sin IVA)</span>
                    <span className="font-semibold">{money(subtotal, currency)}</span>
                </div>

                <Link
                    href="/carrito"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-[#1C1C1C] px-3 py-2 text-sm font-medium text-white hover:bg-black/90"
                >
                    Revisar y cotizar
                </Link>
            </div>
        </aside>
    );
}