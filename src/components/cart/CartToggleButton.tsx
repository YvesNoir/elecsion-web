// src/components/cart/CartToggleButton.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

export default function CartToggleButton() {
    const [lines, setLines] = useState<any[]>([]);
    
    // Use localStorage directly to avoid cart context dependency 
    useEffect(() => {
        const updateFromLocalStorage = () => {
            try {
                const raw = localStorage.getItem("cart:v1");
                const cartLines = raw ? JSON.parse(raw) : [];
                setLines(Array.isArray(cartLines) ? cartLines : []);
            } catch {
                setLines([]);
            }
        };

        // Initial load
        updateFromLocalStorage();

        // Listen for storage changes
        window.addEventListener("storage", updateFromLocalStorage);
        
        // Listen for custom cart events
        const handleCartUpdate = () => updateFromLocalStorage();
        window.addEventListener("cart:updated", handleCartUpdate);

        return () => {
            window.removeEventListener("storage", updateFromLocalStorage);
            window.removeEventListener("cart:updated", handleCartUpdate);
        };
    }, []);

    const count = useMemo(
        () => lines.reduce((acc, l) => acc + Number(l?.qty ?? l?.quantity ?? 0), 0),
        [lines]
    );

    function handleClick() {
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