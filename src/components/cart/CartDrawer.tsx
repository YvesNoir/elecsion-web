// src/components/cart/CartDrawer.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/store/cart";
import { getProductImageUrls } from "@/lib/utils/image";

function money(n: number, currency = "ARS") {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency })
        .format(Number(n || 0));
}

function CartLineItem({ item, currency, isLoggedIn, setQty, removeItem }: {
    item: any;
    currency: string;
    isLoggedIn: boolean;
    setQty: (sku: string, qty: number) => void;
    removeItem: (sku: string) => void;
}) {
    const sku = String(item?.sku ?? "");
    const qty = Number(item?.qty ?? item?.quantity ?? 0);
    const price = Number(item?.price ?? 0);
    const lineTotal = price * qty;
    const imageUrls = getProductImageUrls(sku);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    return (
        <li className="flex gap-3 rounded-md border border-[#384a93]/20 p-3">
            <div className="self-stretch w-14 flex-none overflow-hidden rounded bg-gray-50 ring-1 ring-[#384a93]/30">
                <img
                    src={imageUrls[currentImageIndex]}
                    alt={sku}
                    className="h-full w-full object-cover object-center"
                    onError={() => {
                        if (currentImageIndex < imageUrls.length - 1) {
                            setCurrentImageIndex(prev => prev + 1);
                        }
                    }}
                />
            </div>

            <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{sku}</div>
                <div className="text-xs truncate text-[#646464]">
                    {item?.name ?? ""}
                </div>

                <div className="mt-2 flex items-center justify-between">
                    <div className="inline-flex items-center rounded border border-[#384a93]/30 overflow-hidden">
                        <button
                            className="h-7 w-7 text-sm hover:bg-[#384a93]/10 text-[#384a93]"
                            onClick={() => setQty(sku, qty - 1)}
                            aria-label="Restar"
                        >
                            –
                        </button>
                        <div className="h-7 w-9 text-center text-sm leading-7">
                            {qty}
                        </div>
                        <button
                            className="h-7 w-7 text-sm hover:bg-[#384a93]/10 text-[#384a93]"
                            onClick={() => setQty(sku, qty + 1)}
                            aria-label="Sumar"
                        >
                            +
                        </button>
                    </div>
                    <div className="text-sm font-medium">
                        {isLoggedIn ? (
                            money(lineTotal, item?.currency ?? currency)
                        ) : (
                            <span className="text-[#384A93]">A consultar</span>
                        )}
                    </div>
                </div>
            </div>

            <button
                className="self-start rounded p-1.5 text-[#1C1C1C] hover:text-red-600 hover:bg-red-50"
                onClick={() => removeItem(sku)}
                aria-label="Eliminar"
                title="Eliminar"
            >
                🗑️
            </button>
        </li>
    );
}

type CartDrawerProps = {
    isLoggedIn: boolean;
};

export default function CartDrawer({ isLoggedIn }: CartDrawerProps) {
    const cart = useCart() as any;

    const storeHasOpenState =
        typeof cart?.isOpen === "boolean" || typeof cart?.open === "boolean";
    const [localOpen, setLocalOpen] = useState(false);

    const isOpen: boolean = storeHasOpenState
        ? Boolean(cart?.isOpen ?? cart?.open)
        : localOpen;

    const lines: any[] = Array.isArray(cart?.lines)
        ? cart.lines
        : Array.isArray(cart?.items)
            ? cart.items
            : [];

    const subtotal: number = useMemo(() => {
        if (typeof cart?.subtotal === "number") return cart.subtotal;
        return lines.reduce(
            (acc, l) => acc + Number(l?.price ?? 0) * Number(l?.qty ?? l?.quantity ?? 0),
            0
        );
    }, [cart?.subtotal, lines]);

    const close = () => {
        if (typeof cart?.close === "function") cart.close();
        else if (typeof cart?.setOpen === "function") cart.setOpen(false);
        else if (typeof cart?.toggle === "function" && isOpen) cart.toggle();
        else setLocalOpen(false);
    };

    const open = () => {
        if (typeof cart?.setOpen === "function") cart.setOpen(true);
        else if (typeof cart?.open === "function") cart.open(true);
        else if (typeof cart?.openDrawer === "function") cart.openDrawer();
        else if (typeof cart?.toggle === "function" && !isOpen) cart.toggle();
        else setLocalOpen(true);
    };

    const setQty = (sku: string, next: number) => {
        const q = Math.max(0, next | 0);
        if (typeof cart?.setQty === "function") cart.setQty(sku, q);
        else if (typeof cart?.updateQty === "function") cart.updateQty(sku, q);
        else window.dispatchEvent(new CustomEvent("cart:setQty", { detail: { sku, qty: q } }));
    };

    const removeItem = (sku: string) => {
        if (typeof cart?.removeItem === "function") cart.removeItem(sku);
        else if (typeof cart?.delete === "function") cart.delete(sku);
        else window.dispatchEvent(new CustomEvent("cart:remove", { detail: { sku } }));
    };

    useEffect(() => {
        const onOpen = () => open();
        const onClose = () => close();
        window.addEventListener("cart:open", onOpen);
        window.addEventListener("cart:close", onClose);
        return () => {
            window.removeEventListener("cart:open", onOpen);
            window.removeEventListener("cart:close", onClose);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, cart]);

    const currency = (lines[0]?.currency as string | undefined) ?? "ARS";

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-30 bg-black/50 transition-opacity duration-300"
                    onClick={close}
                    aria-hidden="true"
                />
            )}
            
            {/* Drawer */}
            <aside
                className={`fixed top-0 right-0 bottom-0 z-40 w-[360px] sm:w-[420px] bg-white border-l shadow-xl transition-transform duration-300 ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                } text-[#1C1C1C]`}
                aria-hidden={!isOpen}
            >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-base font-semibold">
                    {isLoggedIn ? 'Tu carrito' : 'Tu cotización'}
                </h2>
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
                    <p className="text-sm">
                        {isLoggedIn ? 'Tu carrito está vacío.' : 'Tu cotización está vacía.'}
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {lines.map((it: any) => <CartLineItem key={it?.sku ?? ''} item={it} currency={currency} isLoggedIn={isLoggedIn} setQty={setQty} removeItem={removeItem} />)}
                    </ul>
                )}
            </div>

            {/* Footer */}
            <div className="absolute inset-x-0 bottom-0 border-t bg-white px-4 py-3">
                {isLoggedIn ? (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-[#646464]">Subtotal (sin IVA)</span>
                        <span className="font-semibold text-[#1C1C1C]">
                            {money(subtotal, currency)}
                        </span>
                    </div>
                ) : (
                    <div className="text-center text-sm text-[#646464]">
                        Precios a consultar tras revisión
                    </div>
                )}

                <Link
                    href="/carrito"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-[#384a93] px-3 py-2 text-sm font-medium text-white hover:bg-[#384a93]/90"
                    onClick={close}
                >
                    Revisar y cotizar
                </Link>
            </div>
            </aside>
        </>
    );
}