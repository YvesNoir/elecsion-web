"use client";

import { useState } from "react";
import { useCart } from "@/store/cart";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import ProductImage from "@/components/ProductImage";

type ProductCardGridProps = {
    sku: string | null;
    name: string;
    unit: string | null;
    priceBase: number;
    currency: string;
    taxRate: number | null;
    isLoggedIn: boolean;
};

function money(n: number, currency = "ARS") {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency })
        .format(Number(n || 0));
}

export default function ProductCardGrid({
    sku,
    name,
    unit,
    priceBase,
    currency,
    taxRate,
    isLoggedIn,
}: ProductCardGridProps) {
    const [qty, setQty] = useState(0);
    const { addItem } = useCart();
    const { getCartPrice } = useExchangeRate();

    const normalizedSku = sku || "N/A";

    const handleAddToCart = () => {
        if (qty <= 0) {
            alert('Por favor, ingresa una cantidad mayor a 0');
            return;
        }

        const cartPrice = getCartPrice(Number(priceBase), currency);

        addItem(
            {
                id: normalizedSku,
                sku: normalizedSku,
                name,
                price: cartPrice.price,
                currency: cartPrice.currency,
                unit: unit ?? undefined,
            },
            qty
        );

        // Abrir el drawer del carrito automáticamente
        window.dispatchEvent(new CustomEvent("cart:open"));

        // Opcional: resetear la cantidad después de agregar
        setQty(0);
    };

    return (
        <div className="bg-white border border-[#B5B5B5]/40 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            {/* Imagen del producto */}
            <div className="aspect-square bg-[#F5F5F7] flex items-center justify-center">
                <ProductImage
                    sku={normalizedSku}
                    alt={normalizedSku}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Contenido */}
            <div className="p-4">
                {/* SKU */}
                <div className="text-sm font-medium text-[#384A93] mb-1">
                    {normalizedSku}
                </div>

                {/* Nombre del producto */}
                <h3 className="text-sm font-medium text-[#1C1C1C] mb-2 min-h-[2.5rem] overflow-hidden" 
                    style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                    }}>
                    {name}
                </h3>


                {/* Precio */}
                <div className="mb-3">
                    <div className="text-lg font-semibold text-[#1C1C1C]">
                        {isLoggedIn ? money(priceBase, currency) : (
                            <span className="text-[#384A93] text-base">Consultar</span>
                        )}
                    </div>
                    {unit && (
                        <div className="text-xs text-[#646464]">
                            por {unit}
                        </div>
                    )}
                </div>

                {/* Controles de cantidad y agregar al carrito */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <label htmlFor={`qty-${normalizedSku}`} className="text-xs text-[#646464]">
                            Cantidad:
                        </label>
                        <input
                            id={`qty-${normalizedSku}`}
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => setQty(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-16 px-2 py-1 text-sm border border-[#B5B5B5]/60 rounded focus:outline-none focus:ring-1 focus:ring-[#384A93]"
                            placeholder="0"
                        />
                    </div>
                    
                    <button
                        onClick={handleAddToCart}
                        className="w-full px-3 py-2 bg-[#384A93] text-white text-sm rounded-md hover:bg-[#2e3d7a] transition-colors"
                    >
                        {isLoggedIn ? 'Agregar al carrito' : 'Agregar para cotizar'}
                    </button>
                </div>
            </div>
        </div>
    );
}