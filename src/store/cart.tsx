// src/store/cart.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
    id: string;
    sku: string;
    name: string;
    price: number;
    currency: string; // "ARS" | "USD"
    unit?: string;
    qty: number;
};

type CartState = {
    lines: CartLine[];
    addItem: (line: Omit<CartLine, "qty">, qty: number) => void;
    removeItem: (sku: string) => void;
    setQty: (sku: string, qty: number) => void;
    clear: () => void;
    subtotal: number;
};

const Ctx = createContext<CartState | null>(null);

function readLS(): CartLine[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem("cart:v1");
        return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
        return [];
    }
}

function writeLS(lines: CartLine[]) {
    try {
        localStorage.setItem("cart:v1", JSON.stringify(lines));
    } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [lines, setLines] = useState<CartLine[]>([]);

    // hidratar desde localStorage una vez
    useEffect(() => {
        setLines(readLS());
    }, []);

    // persistir
    useEffect(() => {
        writeLS(lines);
        // Notify other components about cart updates
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("cart:updated"));
        }
    }, [lines]);

    const addItem = (line: Omit<CartLine, "qty">, qty: number) => {
        setLines(prev => {
            const idx = prev.findIndex(l => l.sku === line.sku);
            if (idx >= 0) {
                const clone = [...prev];
                clone[idx] = { ...clone[idx], qty: clone[idx].qty + qty };
                return clone;
            }
            return [...prev, { ...line, qty }];
        });
    };

    const removeItem = (sku: string) =>
        setLines(prev => prev.filter(l => l.sku !== sku));

    const setQty = (sku: string, qty: number) =>
        setLines(prev =>
            prev.map(l => (l.sku === sku ? { ...l, qty: Math.max(0, qty) } : l))
        );

    const subtotal = useMemo(
        () => lines.reduce((acc, l) => acc + l.price * l.qty, 0),
        [lines]
    );

    const value: CartState = { lines, addItem, removeItem, setQty, clear: () => setLines([]), subtotal };

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useCart must be used within <CartProvider>");
    return ctx;
}