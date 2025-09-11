// src/components/cart/CartToggleButton.tsx
"use client";

import { useCart } from "@/store/cart";
import { useMemo } from "react";

export default function CartToggleButton() {
    const cart = useCart() as any;

    const lines: any[] = Array.isArray(cart?.lines)
        ? cart.lines
        : Array.isArray(cart?.items)
            ? cart.items
            : [];

    const count = useMemo(
        () => lines.reduce((acc, l) => acc + Number(l?.qty ?? l?.quantity ?? 0), 0),
        [lines]
    );

    function handleClick() {
        if (typeof cart?.setOpen === "function") cart.setOpen(true);
        else if (typeof cart?.open === "function") cart.open(true);
        else if (typeof cart?.openDrawer === "function") cart.openDrawer();
        else if (typeof cart?.toggle === "function") cart.toggle();
        else window.dispatchEvent(new CustomEvent("cart:open"));
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