"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/store/cart";

type Product = {
    id: string;
    sku: string | null;
    name: string;
    priceBase: number;
    currency: string;
    stockQty: number | null;
    unit: string | null;
    brand?: {
        name: string;
    } | null;
};

type ProductSearchTableProps = {
    products: Product[];
    loading: boolean;
    selectedClientId: string;
};

function formatMoney(value: number, currency: string) {
    const n = Number(value ?? 0);
    const cur = currency?.toUpperCase() === "USD" ? "USD" : "ARS";
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: cur,
        minimumFractionDigits: 2,
    }).format(n);
}

function formatUSD(value: number) {
    return `U$S ${Number(value ?? 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
}

function formatARS(value: number) {
    return `$ ${Number(value ?? 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
}

// Componente para mostrar precios con cotización
function PriceDisplay({
    price,
    currency,
    unit,
    exchangeRate,
    isLoadingExchange
}: {
    price: number;
    currency: string;
    unit?: string | null;
    exchangeRate: { sell: number } | null;
    isLoadingExchange: boolean;
}) {
    const isUSD = currency?.toUpperCase() === 'USD';
    const priceInARS = isUSD && exchangeRate?.sell ? price * exchangeRate.sell : null;

    return (
        <div>
            <div className="text-sm font-medium text-[#1C1C1C]">
                {isUSD ? formatUSD(price) : formatMoney(price, currency)}
            </div>
            {isUSD && (
                <div>
                    {isLoadingExchange ? (
                        <div className="text-xs text-[#646464] mt-0.5 flex items-center gap-1">
                            <div className="w-3 h-3 border border-gray-300 border-t-[#384A93] rounded-full animate-spin"></div>
                            Obteniendo cotización...
                        </div>
                    ) : priceInARS ? (
                        <div className="text-xs text-[#646464] mt-0.5">
                            Precio en pesos: {formatARS(priceInARS)}
                        </div>
                    ) : null}
                </div>
            )}
            {unit && (
                <div className="text-xs text-[#646464]">
                    por {unit}
                </div>
            )}
        </div>
    );
}

export default function ProductSearchTable({ products, loading, selectedClientId }: ProductSearchTableProps) {
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [exchangeRate, setExchangeRate] = useState<{ sell: number } | null>(null);
    const [isLoadingExchange, setIsLoadingExchange] = useState(false);
    const cart = useCart() as any;

    // Obtener cotización BNA si hay productos USD
    useEffect(() => {
        const hasUSDProducts = products.some(product => product.currency?.toUpperCase() === 'USD');

        if (hasUSDProducts && !exchangeRate) {
            setIsLoadingExchange(true);
            fetch('/api/exchange-rate')
                .then(res => res.json())
                .then(data => {
                    if (data.sell) {
                        setExchangeRate(data);
                    }
                })
                .catch(err => console.error('Error fetching exchange rate:', err))
                .finally(() => setIsLoadingExchange(false));
        }
    }, [products, exchangeRate]);

    const updateQuantity = (productId: string, newQty: number) => {
        setQuantities(prev => ({
            ...prev,
            [productId]: Math.max(0, Math.min(9999, newQty))
        }));
    };

    const addToCart = (product: Product) => {
        const qty = quantities[product.id] || 0;
        if (qty < 1) return;

        if (!selectedClientId) {
            alert("Por favor, selecciona un cliente primero");
            return;
        }

        // Convertir precios USD a pesos si tenemos cotización
        const isUSD = product.currency?.toUpperCase() === 'USD';
        const finalPrice = isUSD && exchangeRate?.sell
            ? Number(product.priceBase) * exchangeRate.sell
            : Number(product.priceBase);
        const finalCurrency = isUSD && exchangeRate?.sell ? 'ARS' : product.currency;

        const addItem = cart?.addItem;
        if (typeof addItem === "function") {
            addItem(
                {
                    id: product.sku || product.id,
                    sku: product.sku || product.id,
                    name: product.name,
                    price: finalPrice,
                    currency: finalCurrency,
                    unit: product.unit ?? undefined,
                },
                qty
            );

            // NO abrir carrito en pedido rápido - se mantiene en la página

            // Reset quantity
            setQuantities(prev => ({
                ...prev,
                [product.id]: 0
            }));
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#384A93] mx-auto"></div>
                <p className="text-[#646464] mt-2">Cargando productos...</p>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="p-8 text-center text-[#646464]">
                No se encontraron productos
            </div>
        );
    }

    return (
        <>
            {/* Vista móvil - Cards */}
            <div className="md:hidden space-y-3">
                {products.map((product, index) => {
                    const qty = quantities[product.id] || 0;
                    const stock = product.stockQty ? Number(product.stockQty) : 0;
                    const hasStock = stock > 0;

                    return (
                        <div key={product.id} className={`bg-white border border-[#E5E5E5] rounded-lg p-4 ${index === 0 ? 'mt-4' : ''}`}>
                            {/* Header: SKU + Stock */}
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-sm font-medium text-[#646464]">
                                    {product.sku || "—"}
                                </div>
                                <div>
                                    {hasStock ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {stock}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Consultar
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Nombre del producto */}
                            <div className="mb-2">
                                <div className="text-sm font-medium text-[#1C1C1C] mb-1">
                                    {product.name}
                                </div>
                                {product.brand && (
                                    <div className="text-xs text-[#646464]">
                                        {product.brand.name}
                                    </div>
                                )}
                            </div>

                            {/* Precio + Controles */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-[#646464] mb-1">Precio:</div>
                                    <div className="text-lg">
                                        <PriceDisplay
                                            price={product.priceBase}
                                            currency={product.currency}
                                            unit={product.unit}
                                            exchangeRate={exchangeRate}
                                            isLoadingExchange={isLoadingExchange}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="inline-flex items-center rounded-full border border-[#e1e8f4] bg-[#e1e8f4] overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(product.id, qty - 1)}
                                            className="h-8 w-8 text-sm text-[#384A93] hover:bg-[#d1d8e4] transition-colors"
                                            disabled={qty <= 0}
                                            aria-label="Restar"
                                        >
                                            –
                                        </button>
                                        <input
                                            type="number"
                                            value={qty}
                                            onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                                            className="h-8 min-w-[3rem] w-16 px-1 text-center text-sm text-[#384A93] font-medium bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-[#384A93] rounded"
                                            min="0"
                                            max="9999"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(product.id, qty + 1)}
                                            className="h-8 w-8 text-sm text-[#384A93] hover:bg-[#d1d8e4] transition-colors"
                                            aria-label="Sumar"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => addToCart(product)}
                                        disabled={qty < 1 || !selectedClientId}
                                        className="inline-flex items-center justify-center w-8 h-8 border border-transparent text-sm font-medium rounded-full bg-[#384A93] text-white hover:bg-[#2e3d7a] disabled:bg-[#B5B5B5] disabled:cursor-not-allowed transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Vista desktop - Tabla */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-white border-b border-[#E5E5E5]">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[#646464] uppercase tracking-wider">
                                SKU
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[#646464] uppercase tracking-wider">
                                Descripción
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[#646464] uppercase tracking-wider">
                                Stock
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[#646464] uppercase tracking-wider">
                                Precio
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-[#646464] uppercase tracking-wider">
                                Cantidad
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#E5E5E5]">
                        {products.map((product) => {
                            const qty = quantities[product.id] || 0;
                            const stock = product.stockQty ? Number(product.stockQty) : 0;
                            const hasStock = stock > 0;

                            return (
                                <tr key={product.id} className="hover:bg-white transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-[#1C1C1C]">
                                        {product.sku || "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <div className="text-sm font-medium text-[#1C1C1C]">
                                                {product.name}
                                            </div>
                                            {product.brand && (
                                                <div className="text-xs text-[#646464]">
                                                    {product.brand.name}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {hasStock ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {stock}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                Consultar
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <PriceDisplay
                                            price={product.priceBase}
                                            currency={product.currency}
                                            unit={product.unit}
                                            exchangeRate={exchangeRate}
                                            isLoadingExchange={isLoadingExchange}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="inline-flex items-center rounded-full border border-[#e1e8f4] bg-[#e1e8f4] overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuantity(product.id, qty - 1)}
                                                    className="h-7 w-7 text-sm text-[#384A93] hover:bg-[#d1d8e4] transition-colors"
                                                    disabled={qty <= 0}
                                                    aria-label="Restar"
                                                >
                                                    –
                                                </button>
                                                <input
                                                    type="number"
                                                    value={qty}
                                                    onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                                                    className="h-7 min-w-[2.5rem] w-16 px-1 text-center text-sm text-[#384A93] font-medium bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-[#384A93] rounded"
                                                    min="0"
                                                    max="9999"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuantity(product.id, qty + 1)}
                                                    className="h-7 w-7 text-sm text-[#384A93] hover:bg-[#d1d8e4] transition-colors"
                                                    aria-label="Sumar"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => addToCart(product)}
                                                disabled={qty < 1 || !selectedClientId}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded bg-[#384A93] text-white hover:bg-[#2e3d7a] disabled:bg-[#B5B5B5] disabled:cursor-not-allowed transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
}