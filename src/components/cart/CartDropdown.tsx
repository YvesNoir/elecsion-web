// src/components/cart/CartDropdown.tsx
"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

type Props = { trigger: ReactElement };

type Item = {
    id: string;        // id del ítem (server) o productId (local)
    productId: string;
    name: string;
    qty: number;
    unit: number;      // precio unitario final (con impuestos si corresponde)
    line: number;      // total de la línea = unit * qty
};

type Mode = "server" | "local";

// ----------- Tipos para respuestas del server -----------
type OrderItemServer = {
    id: string;
    productId?: string;
    name?: string;
    quantity?: string | number | null;
    unitPrice?: string | number | null;
    taxRate?: string | number | null;
    subtotal?: string | number | null;
    total?: string | number | null;
};

type OrderServer = {
    items?: OrderItemServer[] | null;
};

type ApiOrdersResponse = {
    order?: OrderServer | null;
};

// ----------- Tipos para el LS -----------
type LocalItemRaw = {
    productId: string;
    name?: string;
    price?: number | string | null;     // compat
    unitPrice?: number | string | null; // compat
    qty?: number | string | null;
    quantity?: number | string | null;  // compat
};

const LS_KEY = "elecsion_cart";

// ===================== Helpers =====================

// Convierte entrada (string/number/Decimal) a number (es-AR seguro).
function toNumber(x: unknown): number {
    if (typeof x === "number") return Number.isFinite(x) ? x : 0;

    const s = (x as { toString?: () => string } | null | undefined)?.toString?.();
    if (!s) return 0;

    // Limpia símbolos y normaliza coma decimal
    const cleaned = s.replace(/\s/g, "").replace(/[^\d.,-]/g, "");
    const normalized =
        cleaned.includes(",") && cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
            ? cleaned.replace(/\./g, "").replace(",", ".")
            : cleaned;

    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
}

function toQty(x: unknown): number {
    const n = Math.floor(toNumber(x));
    return n > 0 ? n : 1;
}

function fmtAr(n: number): string {
    return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ================== Cargas ==================

async function loadFromServer(): Promise<Item[] | null> {
    try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (!res.ok) return null;

        const data = (await res.json()) as ApiOrdersResponse;
        const order = data?.order;
        const items = order?.items ?? [];
        if (!Array.isArray(items)) return [];

        const mapped: Item[] = items.map((it) => {
            const q = toQty(it.quantity);
            const unitPrice = toNumber(it.unitPrice);
            const taxRate = toNumber(it.taxRate);
            // si no viene total, lo estimamos
            const total = toNumber(it.total) || q * unitPrice * (1 + taxRate);
            const unitFinal = total / q;

            return {
                id: String(it.id),
                productId: String(it.productId ?? it.id),
                name: String(it.name ?? ""),
                qty: q,
                unit: unitFinal,
                line: total,
            };
        });

        return mapped;
    } catch {
        return null;
    }
}

function loadFromLocal(): Item[] {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw) as unknown;

        if (!Array.isArray(arr)) return [];

        const mapped: Item[] = (arr as LocalItemRaw[])
            .map((it) => {
                const q = toQty(it.qty ?? it.quantity);
                const unit = toNumber(it.price ?? it.unitPrice);
                const nm = (it.name ?? "").toString();

                const productId = it.productId?.toString?.() ?? "";
                if (!productId || !nm) return null;

                return {
                    id: productId,          // en local usamos productId como id
                    productId,
                    name: nm,
                    qty: q,
                    unit,
                    line: unit * q,
                } as Item;
            })
            .filter((x): x is Item => !!x);

        return mapped;
    } catch {
        return [];
    }
}

// ================== Componente ==================

export default function CartDropdown({ trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    const [mode, setMode] = useState<Mode>("local");

    const subtotal = useMemo(
        () => items.reduce((s, i) => s + i.line, 0),
        [items]
    );

    async function refresh(): Promise<void> {
        const serverItems = await loadFromServer();
        if (serverItems) {
            setItems(serverItems);
            setMode("server");
            return;
        }
        setItems(loadFromLocal());
        setMode("local");
    }

    useEffect(() => {
        void refresh();
        const handler = (_e: Event) => void refresh();
        window.addEventListener("cart:updated", handler as EventListener);
        return () => window.removeEventListener("cart:updated", handler as EventListener);
    }, []);

    async function updateQty(id: string, delta: number): Promise<void> {
        if (mode === "server") {
            const row = items.find((i) => i.id === id);
            if (!row) return;
            const next = Math.max(1, row.qty + delta);

            try {
                await fetch("/api/orders", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "updateQty", itemId: id, quantity: next }),
                });
            } finally {
                void refresh();
            }
            return;
        }

        // local
        const current = loadFromLocal();
        const nextLocal = current.map((i) =>
            i.id === id
                ? { ...i, qty: Math.max(1, i.qty + delta), line: i.unit * Math.max(1, i.qty + delta) }
                : i
        );

        // Persistencia con el shape original
        localStorage.setItem(
            LS_KEY,
            JSON.stringify(
                nextLocal.map(({ productId, name, unit, qty }) => ({
                    productId,
                    name,
                    price: unit,
                    qty,
                }))
            )
        );
        window.dispatchEvent(new CustomEvent("cart:updated"));
        setItems(nextLocal);
    }

    async function removeItem(id: string): Promise<void> {
        if (mode === "server") {
            try {
                await fetch("/api/orders", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "removeItem", itemId: id }),
                });
            } finally {
                void refresh();
            }
            return;
        }

        const next = loadFromLocal().filter((i) => i.id !== id);
        localStorage.setItem(
            LS_KEY,
            JSON.stringify(next.map(({ productId, name, unit, qty }) => ({ productId, name, price: unit, qty })))
        );
        window.dispatchEvent(new CustomEvent("cart:updated"));
        setItems(next);
    }

    return (
        <div
            className="relative"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            {/* trigger (CartButton) */}
            <span onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
        {trigger}
      </span>

            {open && (
                <div className="absolute right-0 mt-2 w-[360px] rounded-lg border border-[#B5B5B5]/40 bg-white shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-[#B5B5B5]/40 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#1C1C1C]">Tu carrito</span>
                        <button
                            className="text-[#646464] hover:text-[#1C1C1C]"
                            onClick={() => setOpen(false)}
                            aria-label="Cerrar"
                            type="button"
                        >
                            ×
                        </button>
                    </div>

                    {/* Items */}
                    <div className="max-h-[300px] overflow-auto divide-y divide-[#B5B5B5]/30">
                        {items.length === 0 && (
                            <div className="px-4 py-6 text-sm text-[#646464]">Tu carrito está vacío.</div>
                        )}

                        {items.map((it) => (
                            <div key={it.id} className="px-4 py-3 text-sm">
                                <div className="font-medium text-[#1C1C1C] line-clamp-2">{it.name}</div>

                                <div className="mt-1 flex items-center justify-between">
                                    <div className="text-[#646464]">Unit. $ {fmtAr(it.unit)}</div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => void updateQty(it.id, -1)}
                                            className="h-7 w-7 grid place-items-center rounded border border-[#B5B5B5]/50 hover:bg-[#f5f5f7]"
                                            aria-label="Restar"
                                            type="button"
                                        >
                                            –
                                        </button>
                                        <span className="w-6 text-center select-none">{it.qty}</span>
                                        <button
                                            onClick={() => void updateQty(it.id, +1)}
                                            className="h-7 w-7 grid place-items-center rounded border border-[#B5B5B5]/50 hover:bg-[#f5f5f7]"
                                            aria-label="Sumar"
                                            type="button"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-1 flex items-center justify-between">
                                    <div className="text-[#1C1C1C]">$ {fmtAr(it.line)}</div>
                                    <button
                                        onClick={() => void removeItem(it.id)}
                                        className="text-xs text-[#646464] hover:text-[#384A93]"
                                        type="button"
                                    >
                                        Quitar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-[#B5B5B5]/40 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[#646464]">Subtotal</span>
                            <span className="text-[#1C1C1C]">$ {fmtAr(subtotal)}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <Link
                                href="/carrito"
                                className="flex-1 h-9 rounded-md bg-[#384A93] text-white text-sm grid place-items-center hover:bg-[#2e3d7a]"
                            >
                                Ver el carrito
                            </Link>

                            <button
                                onClick={() => void refresh()}
                                className="h-9 px-3 rounded-md border border-[#B5B5B5]/50 text-sm hover:bg-[#f5f5f7]"
                                type="button"
                            >
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}