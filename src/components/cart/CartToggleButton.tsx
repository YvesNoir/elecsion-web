// src/components/cart/CartToggleButton.tsx
"use client";

import { useMemo } from "react";
import { useCart } from "@/store/cart";

export default function CartToggleButton() {
    // No asumimos la forma exacta del store para no chocar con los tipos
    const cart = useCart() as any;

    // Tomamos las líneas del carrito, tolerando distintas claves
    const lines: any[] = Array.isArray(cart?.lines)
        ? cart.lines
        : Array.isArray(cart?.items)
            ? cart.items
            : [];

    // Intentamos descubrir cómo se abre el drawer
    const openFn: ((v?: any) => void) | null =
        typeof cart?.open === "function"
            ? cart.open
            : typeof cart?.openDrawer === "function"
                ? cart.openDrawer
                : typeof cart?.toggle === "function"
                    ? cart.toggle
                    : typeof cart?.setOpen === "function"
                        ? cart.setOpen
                        : null;

    // Cantidad total (acepta qty o quantity)
    const count = useMemo(
        () =>
            lines.reduce(
                (acc, l) => acc + (Number(l?.qty ?? l?.quantity ?? 0) || 0),
                0
            ),
        [lines]
    );

    function handleClick() {
        if (openFn) {
            // si la función acepta parámetro, le pasamos true
            try {
                if (openFn.length >= 1) openFn(true);
                else openFn();
                return;
            } catch {
                // si algo falla, caemos al evento global
            }
        }
        // Fallback: evento global para que el Drawer se abra
        window.dispatchEvent(new CustomEvent("cart:open"));
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-[#1C1C1C] hover:bg-gray-50"
            aria-label="Abrir carrito"
        >
            Carrito
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-black text-white text-xs px-1">
        {count}
      </span>
        </button>
    );
}