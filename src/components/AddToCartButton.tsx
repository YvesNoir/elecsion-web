"use client";

import { useState } from "react";

type Props = {
    productId: string;
    name: string;
    price: number;   // fallback para localStorage (numérico)
    qty?: number;
    className?: string;
    label?: string;
};

const LS_KEY = "elecsion_cart";

export default function AddToCartButton({
                                            productId,
                                            name,
                                            price,
                                            qty = 1,
                                            className,
                                            label = "Agregar al carrito",
                                        }: Props) {
    const [loading, setLoading] = useState(false);

    function notifyAll() {
        // compat con componentes viejos y nuevos
        window.dispatchEvent(new Event("cart:changed"));
        window.dispatchEvent(new CustomEvent("cart:updated"));
    }

    function addToLocalStorage() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            const items: any[] = raw ? JSON.parse(raw) : [];
            const i = items.findIndex((it) => it.productId === productId);
            if (i >= 0) {
                items[i].qty = (items[i].qty || 0) + qty;
                items[i].price = price; // sincronizar precio
            } else {
                items.push({ productId, name, price, qty });
            }
            localStorage.setItem(LS_KEY, JSON.stringify(items));
            notifyAll();
        } catch {
            /* noop */
        }
    }

    async function addToServer() {
        setLoading(true);
        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
                body: JSON.stringify({ productId, quantity: qty }),
            });

            if (res.ok) {
                notifyAll();
                return;
            }

            if (res.status === 401) {
                // No logueado: guardamos local
                addToLocalStorage();
                return;
            }

            const data = await res.json().catch(() => ({}));
            alert(data?.error || "No se pudo agregar al carrito.");
        } catch (e) {
            console.error("add to cart", e);
            alert("Ocurrió un error al agregar el producto.");
        } finally {
            setLoading(false);
        }
    }

    async function handleClick() {
        await addToServer();
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className={className ?? "btn-primary"}
            aria-label={label}
            title={label}
        >
            {/* Ícono carrito */}
            <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                className="shrink-0"
                aria-hidden="true"
            >
                <path d="M3 3h2l2.4 12.3A2 2 0 0 0 9.36 17h7.28a2 2 0 0 0 1.96-1.7L20 9H6"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="20" r="1" fill="currentColor" />
                <circle cx="17" cy="20" r="1" fill="currentColor" />
            </svg>
            {loading ? "Agregando..." : label}
        </button>
    );
}