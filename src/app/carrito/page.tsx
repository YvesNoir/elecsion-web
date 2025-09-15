// src/app/carrito/page.tsx
"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function money(n: number, currency = "ARS") {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency })
        .format(Number(n || 0));
}

export default function CartPage() {
    const { lines, setQty, removeItem, subtotal, clear } = useCart();
    const { data: session } = useSession();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Calculamos IVA (21%) y total
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    const handleRequestQuote = async () => {
        // Verificar que el usuario esté logueado
        if (!session?.user) {
            alert("Debes iniciar sesión para solicitar una cotización");
            router.push("/login?callbackUrl=/carrito");
            return;
        }

        // Verificar que hay productos en el carrito
        if (lines.length === 0) {
            alert("Tu carrito está vacío");
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Preparar los datos del carrito
            const cartItems = lines.map(line => ({
                id: line.id,
                name: line.name,
                price: line.price,
                quantity: line.qty,
                sku: line.sku
            }));

            // Llamar a la API
            const response = await fetch('/api/orders/quote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: cartItems,
                    quoteMessage: `Solicitud de cotización desde el carrito. Total estimado: ${money(total)}`,
                    quoteName: session.user.name,
                    quoteEmail: session.user.email,
                    quotePhone: null // El usuario puede completar esto luego
                }),
            });

            const result = await response.json();

            if (response.ok) {
                // Mostrar mensaje de éxito
                alert(`✅ ${result.message}\n\nCódigo de cotización: ${result.order.code}\nTotal: ${money(result.order.total)}`);
                
                // Limpiar el carrito
                clear();
                
                // Redirigir a mis cotizaciones
                router.push("/mis-cotizaciones");
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error al solicitar cotización:', error);
            alert("Error al solicitar cotización. Por favor, intenta nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (lines.length === 0) {
        return (
            <div>
                <div className="mb-4">
                    <Link 
                        href="/catalogo" 
                        className="text-[#384A93] hover:underline text-sm"
                    >
                        ← Continuar Navegando
                    </Link>
                </div>
                
                <div className="bg-white rounded-lg border border-[#B5B5B5]/40 p-8 text-center">
                    <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-4">Carrito</h1>
                    <p className="text-[#646464] mb-4">Tu carrito está vacío.</p>
                    <Link 
                        href="/catalogo"
                        className="inline-flex items-center px-4 py-2 bg-[#384A93] text-white rounded-md hover:bg-[#2e3d7a] transition-colors"
                    >
                        Ver Catálogo
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mb-4">
                <Link 
                    href="/catalogo" 
                    className="text-[#384A93] hover:underline text-sm"
                >
                    ← Continuar Navegando
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Tabla de productos - 3/4 del ancho */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg border border-[#B5B5B5]/40 overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#B5B5B5]/40">
                            <h1 className="text-xl font-semibold text-[#1C1C1C]">
                                Carrito <span className="text-[#646464] font-normal">/ {lines.length} SKU - {lines.reduce((acc, line) => acc + line.qty, 0)} Productos</span>
                            </h1>
                        </div>

                        {/* Tabla de productos */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#F5F5F7] border-b border-[#B5B5B5]/40">
                                    <tr className="text-left">
                                        <th className="px-6 py-3 text-sm font-medium text-[#646464]">SKU/Description</th>
                                        <th className="px-3 py-3 text-sm font-medium text-[#646464] text-center w-20">Stock</th>
                                        <th className="px-3 py-3 text-sm font-medium text-[#646464] text-center w-28">Precio Unit S/IVA</th>
                                        <th className="px-3 py-3 text-sm font-medium text-[#646464] text-center w-16">IVA</th>
                                        <th className="px-3 py-3 text-sm font-medium text-[#646464] text-center w-20">Cliente</th>
                                        <th className="px-3 py-3 text-sm font-medium text-[#646464] text-center w-24">Cantidad</th>
                                        <th className="px-3 py-3 text-sm font-medium text-[#646464] text-center w-28">Subtotal</th>
                                        <th className="px-3 py-3 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#B5B5B5]/20">
                                    {lines.map((line) => {
                                        const priceWithoutTax = line.price / 1.21; // Asumiendo 21% IVA incluido
                                        const lineTotal = line.price * line.qty;
                                        const img = `/product-images/${line.sku}.jpg`;

                                        return (
                                            <tr key={line.sku} className="hover:bg-[#F5F5F7]/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-12 h-12 bg-[#F5F5F7] border border-[#B5B5B5]/40 rounded flex-shrink-0 overflow-hidden">
                                                            <img
                                                                src={img}
                                                                alt={line.sku}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    const el = e.currentTarget as HTMLImageElement;
                                                                    el.onerror = null;
                                                                    el.src = "/product-images/placeholder.jpg";
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-[#1C1C1C] text-sm">
                                                                {line.sku}
                                                            </div>
                                                            <div className="text-xs text-[#646464] mt-1 line-clamp-2">
                                                                {line.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                        <span className="text-xs text-green-600">Disponible</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 text-center">
                                                    <div className="text-sm font-medium text-[#1C1C1C]">
                                                        {money(priceWithoutTax)}
                                                    </div>
                                                    <div className="text-xs text-[#646464]">
                                                        {line.unit || "U"}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 text-center">
                                                    <span className="text-sm text-[#646464]">21%</span>
                                                </td>
                                                <td className="px-3 py-4 text-center">
                                                    <span className="text-sm text-[#646464]">-</span>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => setQty(line.id, line.qty - 1)}
                                                            className="w-6 h-6 flex items-center justify-center border border-[#B5B5B5] rounded hover:bg-[#F5F5F7] text-sm"
                                                            disabled={line.qty <= 1}
                                                        >
                                                            -
                                                        </button>
                                                        <div className="w-12 text-center">
                                                            <input
                                                                type="number"
                                                                value={line.qty}
                                                                onChange={(e) => setQty(line.id, parseInt(e.target.value) || 1)}
                                                                className="w-full text-center text-sm border-none outline-none bg-transparent"
                                                                min="1"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => setQty(line.id, line.qty + 1)}
                                                            className="w-6 h-6 flex items-center justify-center border border-[#B5B5B5] rounded hover:bg-[#F5F5F7] text-sm"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 text-center">
                                                    <div className="font-medium text-[#1C1C1C] text-sm">
                                                        {money(lineTotal)}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 text-center">
                                                    <button
                                                        onClick={() => removeItem(line.id)}
                                                        className="w-8 h-8 flex items-center justify-center text-[#646464] hover:text-red-600 hover:bg-red-50 rounded"
                                                        title="Eliminar producto"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Información adicional */}
                        <div className="px-6 py-4 bg-orange-50 border-t border-[#B5B5B5]/40">
                            <div className="flex items-start gap-2">
                                <div className="w-5 h-5 bg-orange-400 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs">!</span>
                                </div>
                                <div className="text-sm text-orange-700">
                                    <div className="font-medium mb-1">Se está aplicando tu descuento especial por ser cliente</div>
                                    <div>El valor total puede variar, ya que no contempla los valores de percepción de AFIP</div>
                                </div>
                            </div>
                        </div>

                        {/* Botón actualizar carrito */}
                        <div className="px-6 py-4 border-t border-[#B5B5B5]/40">
                            <button className="px-4 py-2 text-sm text-[#384A93] border border-[#384A93] rounded hover:bg-[#384A93] hover:text-white transition-colors">
                                🔄 Actualizar carrito
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar derecho - Resumen de compras */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg border border-[#B5B5B5]/40 p-6">
                        <h2 className="text-lg font-semibold text-[#1C1C1C] mb-4">Resumen de Compras</h2>
                        
                        <div className="space-y-3 mb-6">
                            <div className="text-sm text-[#646464] mb-3">
                                Calcular costo de envío
                            </div>
                            
                            <div className="flex justify-between text-sm">
                                <span className="text-[#646464]">Subtotal</span>
                                <span className="font-medium text-[#1C1C1C]">{money(subtotal)}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                                <span className="text-[#646464]">Envío (Envío a convenir)</span>
                                <span className="text-[#646464]">{money(0)}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                                <span className="text-[#646464]">IVA</span>
                                <span className="text-[#646464]">{money(iva)}</span>
                            </div>
                            
                            <div className="border-t border-[#B5B5B5]/40 pt-3">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-[#1C1C1C]">Total de Orden</span>
                                    <span className="font-semibold text-[#1C1C1C] text-lg">{money(total)}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleRequestQuote}
                            disabled={isSubmitting}
                            className="w-full bg-[#384A93] text-white py-3 rounded-md font-medium hover:bg-[#2e3d7a] disabled:opacity-60 transition-colors"
                        >
                            {isSubmitting ? "Procesando..." : "Pedir una Cotización"}
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
}