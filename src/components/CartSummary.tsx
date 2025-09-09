"use client";
import { useEffect, useState } from "react";

export default function CartSummary() {
    const [count, setCount] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);

    useEffect(() => {
        let ok = true;
        (async () => {
            try {
                const res = await fetch("/api/orders", { cache: "no-store" });
                if (!ok || res.status !== 200) return;
                const data = await res.json();
                const order = data?.order;
                setCount(order?.items?.length ?? 0);
                setTotal(Number(order?.grandTotal ?? 0));
            } catch {}
        })();
        return () => { ok = false; };
    }, []);

    const IconWrap = ({ children }: { children: React.ReactNode }) => (
        <span className="relative inline-flex items-center justify-center h-9 w-9 rounded-full ring-1 ring-gray-200">
      {children}
            <span className="absolute -top-1 -right-1 text-[10px] min-w-[16px] h-4 px-1 rounded-full bg-sky-500 text-white grid place-items-center">
        {count}
      </span>
    </span>
    );

    return (
        <div className="flex items-center gap-3">
            {/* comparar */}
            <IconWrap>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M4 7h7M4 12h11M4 17h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </IconWrap>
            {/* wishlist */}
            <IconWrap>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10Z"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </IconWrap>
            {/* carrito */}
            <a href="/cliente/carrito" className="flex items-center gap-2">
                <IconWrap>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M6 6h15l-1.5 9h-12L6 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="9" cy="20" r="1.5" fill="currentColor"/><circle cx="18" cy="20" r="1.5" fill="currentColor"/>
                    </svg>
                </IconWrap>
                <span className="text-sm text-gray-700">$ {total.toFixed(2)}</span>
            </a>
        </div>
    );
}