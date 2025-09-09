// src/components/CartBadge.tsx
"use client";
import { useEffect, useState } from "react";

export default function CartBadge() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch("/api/orders", { cache: "no-store" });
                if (!mounted) return;
                if (res.status !== 200) { setCount(0); return; }
                const data = await res.json();
                const items = data?.order?.items ?? [];
                setCount(items.length || 0);
            } catch { setCount(0); }
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <a href="/cliente/carrito" className="relative text-sm border rounded-md px-3 py-1">
            Carrito
            <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 text-xs border rounded-full px-1">
        {count ?? "—"}
      </span>
        </a>
    );
}