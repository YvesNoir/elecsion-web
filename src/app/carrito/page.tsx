// src/app/carrito/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* ==================== Tipos ==================== */
type Mode = "server" | "local";

type Item = {
    id: string;        // id del ítem (server) o productId (local)
    productId: string;
    name: string;
    qty: number;
    unit: number;      // precio unitario final
    line: number;      // total de la línea
};

type OrderItemServer = {
    id: string;
    productId?: string;
    name?: string;
    quantity?: string | number | null;
    unitPrice?: string | number | null;
    taxRate?: string | number | null;
    total?: string | number | null;
};

type OrderServer = {
    items?: OrderItemServer[] | null;
};

type ApiOrdersResponse = {
    order?: OrderServer | null;
};

type LocalItemRaw = {
    productId: string;
    name?: string;
    price?: number | string | null;
    unitPrice?: number | string | null;
    qty?: number | string | null;
    quantity?: number | string | null;
};

const LS_KEY = "elecsion_cart";

/* ==================== Helpers ==================== */
function toNumber(x: unknown): number {
    if (typeof x === "number") return Number.isFinite(x) ? x : 0;
    const s = (x as { toString?: () => string } | null | undefined)?.toString?.();
    if (!s) return 0;

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

/* ============ Carga desde server / local ============ */
async function loadFromServer(): Promise<Item[] | null> {
    try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (!res.ok) return null;

        const data = (await res.json()) as ApiOrdersResponse;
        const items = data.order?.items ?? [];
        if (!Array.isArray(items)) return [];

        return items.map((it) => {
            const q = toQty(it.quantity);
            const unitPrice = toNumber(it.unitPrice);
            const taxRate = toNumber(it.taxRate);
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

        return (arr as LocalItemRaw[])
            .map((it) => {
                const productId = it.productId?.toString?.() ?? "";
                const name = (it.name ?? "").toString();
                if (!productId || !name) return null;

                const qty = toQty(it.qty ?? it.quantity);
                const unit = toNumber(it.price ?? it.unitPrice);
                return {
                    id: productId,
                    productId,
                    name,
                    qty,
                    unit,
                    line: unit * qty,
                } as Item;
            })
            .filter((x): x is Item => !!x);
    } catch {
        return [];
    }
}

/* ==================== Página ==================== */
export default function CartPage() {
    const [mode, setMode] = useState<Mode>("local");
    const [items, setItems] = useState<Item[]>([]);
    const [sending, setSending] = useState(false);

    const subtotal = useMemo(() => items.reduce((s, i) => s + i.line, 0), [items]);

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
        const handler = () => void refresh();
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
            i.id === id ? { ...i, qty: Math.max(1, i.qty + delta), line: i.unit * Math.max(1, i.qty + delta) } : i
        );
        localStorage.setItem(
            LS_KEY,
            JSON.stringify(nextLocal.map(({ productId, name, unit, qty }) => ({ productId, name, price: unit, qty })))
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

    async function submitOrder(): Promise<void> {
        if (mode !== "server") return;
        setSending(true);
        try {
            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "submit" }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(data?.error || "No pudimos enviar tu pedido.");
                return;
            }
            // Éxito
            window.location.href = "/carrito?status=ok";
        } catch (e) {
            console.error(e);
            alert("Ocurrió un error al enviar el pedido.");
        } finally {
            setSending(false);
        }
    }

    return (
        <main className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-6">Tu carrito</h1>

            {items.length === 0 ? (
                <div className="rounded-lg border border-[#B5B5B5]/40 bg-white p-6 text-[#646464]">
                    Tu carrito está vacío.{" "}
                    <Link href="/tienda" className="text-[#384A93] hover:underline">
                        Ir a la tienda
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna izquierda: listado */}
                    <section className="lg:col-span-2 rounded-lg border border-[#B5B5B5]/40 bg-white">
                        <ul className="divide-y divide-[#B5B5B5]/30">
                            {items.map((it) => (
                                <li key={it.id} className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="font-medium text-[#1C1C1C]">{it.name}</div>
                                            <div className="text-sm text-[#646464] mt-1">Unit. $ {fmtAr(it.unit)}</div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => void updateQty(it.id, -1)}
                                                className="h-8 w-8 grid place-items-center rounded border border-[#B5B5B5]/60 hover:bg-[#f5f5f7]"
                                                aria-label="Restar"
                                                type="button"
                                            >
                                                –
                                            </button>
                                            <span className="w-8 text-center">{it.qty}</span>
                                            <button
                                                onClick={() => void updateQty(it.id, +1)}
                                                className="h-8 w-8 grid place-items-center rounded border border-[#B5B5B5]/60 hover:bg-[#f5f5f7]"
                                                aria-label="Sumar"
                                                type="button"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="w-28 text-right font-medium text-[#1C1C1C]">$ {fmtAr(it.line)}</div>

                                        <button
                                            onClick={() => void removeItem(it.id)}
                                            className="text-sm text-[#646464] hover:text-[#384A93]"
                                            type="button"
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="p-4 border-t border-[#B5B5B5]/40 flex items-center justify-between">
                            <Link href="/tienda" className="text-sm text-[#384A93] hover:underline">
                                ← Seguir comprando
                            </Link>
                            <div className="text-sm text-[#646464]">
                                {items.length} {items.length === 1 ? "artículo" : "artículos"}
                            </div>
                        </div>
                    </section>

                    {/* Columna derecha: resumen */}
                    <aside className="rounded-lg border border-[#B5B5B5]/40 bg-white p-4 h-fit">
                        <h2 className="text-lg font-semibold text-[#1C1C1C] mb-3">Resumen</h2>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-[#646464]">Subtotal</span>
                                <span className="text-[#1C1C1C]">$ {fmtAr(subtotal)}</span>
                            </div>
                            {/* Si después definimos envíos/impuestos, se agregan acá */}
                        </div>

                        <div className="mt-4">
                            {mode === "server" ? (
                                <button
                                    onClick={() => void submitOrder()}
                                    disabled={sending || items.length === 0}
                                    className="w-full h-10 rounded-md bg-[#384A93] text-white text-sm font-medium hover:bg-[#2e3d7a] disabled:opacity-60"
                                    type="button"
                                >
                                    {sending ? "Enviando..." : "Enviar pedido"}
                                </button>
                            ) : (
                                <div className="text-sm text-[#646464]">
                                    <p className="mb-2">
                                        Para enviar tu pedido, primero{" "}
                                        <Link href="/login" className="text-[#384A93] hover:underline">
                                            iniciá sesión
                                        </Link>
                                        .
                                    </p>
                                    <Link
                                        href="/login"
                                        className="inline-flex h-10 items-center justify-center rounded-md bg-[#384A93] px-4 text-white text-sm hover:bg-[#2e3d7a]"
                                    >
                                        Iniciar sesión
                                    </Link>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </main>
    );
}