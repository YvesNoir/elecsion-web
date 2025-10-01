"use client";

import React, { useMemo } from "react";
import { useCart } from "@/store/cart";

type CartSummaryProps = {
    selectedClientId: string;
};

function formatMoney(value: number, currency = "ARS") {
    const n = Number(value ?? 0);
    const cur = currency?.toUpperCase() === "USD" ? "USD" : "ARS";
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: cur,
        minimumFractionDigits: 2,
    }).format(n);
}

export default function CartSummary({ selectedClientId }: CartSummaryProps) {
    const cart = useCart();

    const cartItems = cart.lines || [];

    const { subtotal, total } = useMemo(() => {
        const sub = cartItems.reduce((sum: number, item: any) => {
            const price = Number(item.price || 0);
            const qty = Number(item.qty || 0);
            return sum + (price * qty);
        }, 0);

        return {
            subtotal: sub,
            total: sub // Por ahora sin IVA
        };
    }, [cartItems]);

    const updateQuantity = (itemSku: string, newQty: number) => {
        if (newQty <= 0) {
            cart.removeItem(itemSku);
        } else {
            cart.setQty(itemSku, newQty);
        }
    };

    const removeItem = (itemSku: string) => {
        cart.removeItem(itemSku);
    };

    const clearCart = () => {
        cart.clear();
    };

    const createOrder = () => {
        if (!selectedClientId) {
            alert("Por favor, selecciona un cliente primero");
            return;
        }

        if (cartItems.length === 0) {
            alert("No hay productos en el carrito");
            return;
        }

        // TODO: Implementar creación de pedido
        console.log("Crear pedido para cliente:", selectedClientId);
        console.log("Items:", cartItems);
        alert("Funcionalidad de crear pedido próximamente");
    };

    return (
        <div className="bg-white rounded-lg border border-[#E5E5E5] p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-[#1C1C1C]">
                    Carrito ({cartItems.length})
                </h3>
                {cartItems.length > 0 && (
                    <button
                        onClick={clearCart}
                        className="text-sm text-red-600 hover:text-red-700 transition-colors"
                    >
                        Limpiar
                    </button>
                )}
            </div>

            {cartItems.length === 0 ? (
                <p className="text-[#646464] text-sm">No hay productos en el carrito.</p>
            ) : (
                <div className="space-y-4">
                    {/* Items del carrito */}
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {cartItems.map((item: any) => (
                            <div key={item.sku} className="border-b border-[#E5E5E5] pb-4 last:border-b-0 mb-4 last:mb-0">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-[#1C1C1C] truncate">
                                            {item.sku}
                                        </div>
                                        <div className="text-xs text-[#646464] truncate">
                                            {item.name}
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium text-[#1C1C1C] ml-2">
                                        {formatMoney(Number(item.price) * Number(item.qty), item.currency)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="inline-flex items-center rounded-full border border-[#e1e8f4] bg-[#e1e8f4] overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.sku, Number(item.qty) - 1)}
                                            className="h-8 w-8 text-sm text-[#384A93] hover:bg-[#d1d8e4] transition-colors"
                                            aria-label="Restar"
                                        >
                                            –
                                        </button>
                                        <div className="h-8 min-w-[2rem] px-2 text-center text-sm leading-8 text-[#384A93] font-medium">
                                            {item.qty}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.sku, Number(item.qty) + 1)}
                                            className="h-8 w-8 text-sm text-[#384A93] hover:bg-[#d1d8e4] transition-colors"
                                            aria-label="Sumar"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => removeItem(item.sku)}
                                        className="text-red-600 hover:text-red-700 transition-colors p-1"
                                        aria-label="Eliminar producto"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totales */}
                    <div className="pt-3 border-t border-[#E5E5E5] space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-[#646464]">Subtotal:</span>
                            <span className="font-medium text-[#1C1C1C]">
                                {formatMoney(subtotal)}
                            </span>
                        </div>
                        <div className="flex justify-between text-base font-semibold">
                            <span className="text-[#1C1C1C]">Total:</span>
                            <span className="text-[#1C1C1C]">
                                {formatMoney(total)}
                            </span>
                        </div>
                    </div>

                    {/* Botón crear pedido */}
                    <button
                        onClick={createOrder}
                        disabled={!selectedClientId || cartItems.length === 0}
                        className="w-full bg-[#384A93] text-white py-2 px-4 rounded-md hover:bg-[#2e3d7a] disabled:bg-[#B5B5B5] disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        Crear Pedido
                    </button>
                </div>
            )}
        </div>
    );
}