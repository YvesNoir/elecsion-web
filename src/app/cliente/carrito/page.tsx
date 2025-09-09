"use client";
import { useEffect, useState } from "react";

type Order = {
    id: string;
    status: string;
    currency: string;
    subtotal: number;
    taxTotal: number;
    grandTotal: number;
    items: Array<{
        id: string; productId: string; sku: string; name: string;
        quantity: number; unit: string; unitPrice: number; taxRate: number; subtotal: number; total: number;
    }>;
} | null;

export default function CartPage() {
    const [order, setOrder] = useState<Order>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (res.status === 401) {
            setError("Necesitás iniciar sesión.");
            setLoading(false);
            return;
        }
        const data = await res.json();
        setOrder(data.order);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function updateQty(itemId: string, qty: number) {
        const res = await fetch("/api/orders", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "updateQty", itemId, quantity: qty }),
        });
        const data = await res.json();
        setOrder(data.order);
    }

    async function removeItem(itemId: string) {
        const res = await fetch("/api/orders", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "removeItem", itemId }),
        });
        const data = await res.json();
        setOrder(data.order);
    }

    async function submitOrder() {
        const res = await fetch("/api/orders", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "submit" }),
        });
        const data = await res.json();
        if (res.ok) {
            alert(`Pedido enviado: ${data.order.code}`);
            setOrder(null);
        } else {
            alert("No se pudo enviar el pedido");
        }
    }

    if (loading) return <main className="p-6">Cargando...</main>;
    if (error) return <main className="p-6"><a className="underline" href="/login">{error}</a></main>;

    return (
        <main className="max-w-3xl mx-auto p-6 space-y-4">
            <h1 className="text-xl font-semibold">Carrito</h1>

            {!order || order.items.length === 0 ? (
                <p>No tenés productos en el carrito.</p>
            ) : (
                <>
                    <ul className="divide-y border rounded">
                        {order.items.map(it => (
                            <li key={it.id} className="p-3 flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="font-medium">{it.name}</div>
                                    <div className="text-xs text-gray-600">{it.sku} · {it.unitPrice} {order.currency}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="border rounded px-2" onClick={() => updateQty(it.id, Math.max(1, Number(it.quantity) - 1))}>-</button>
                                    <span>{Number(it.quantity)}</span>
                                    <button className="border rounded px-2" onClick={() => updateQty(it.id, Number(it.quantity) + 1)}>+</button>
                                </div>
                                <div className="w-24 text-right">{(Number(it.quantity) * Number(it.unitPrice)).toFixed(2)}</div>
                                <button className="ml-3 text-red-600 text-sm" onClick={() => removeItem(it.id)}>Quitar</button>
                            </li>
                        ))}
                    </ul>

                    <div className="text-right space-y-1">
                        <div>Subtotal: <b>{order.subtotal.toFixed?.(2) ?? order.subtotal} {order.currency}</b></div>
                        <div>IVA: <b>{order.taxTotal.toFixed?.(2) ?? order.taxTotal} {order.currency}</b></div>
                        <div className="text-lg">Total: <b>{order.grandTotal.toFixed?.(2) ?? order.grandTotal} {order.currency}</b></div>
                    </div>

                    <div className="flex justify-end">
                        <button className="border rounded px-4 py-2" onClick={submitOrder}>Enviar pedido</button>
                    </div>
                </>
            )}
        </main>
    );
}