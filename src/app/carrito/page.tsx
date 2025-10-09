// src/app/carrito/page.tsx
"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SuccessModal from "@/components/SuccessModal";
import QuotationFormModal, { QuotationFormData } from "@/components/QuotationFormModal";
import ProductImage from "@/components/ProductImage";

function money(n: number, currency = "ARS") {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency })
        .format(Number(n || 0));
}

export default function CartPage() {
    const { lines, setQty, removeItem, subtotal, clear } = useCart();
    const { data: session } = useSession();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showQuotationForm, setShowQuotationForm] = useState(false);
    const [successData, setSuccessData] = useState<{
        title: string;
        message: string;
    } | null>(null);
    
    const isLoggedIn = !!session?.user;
    
    // Calculamos IVA (21%) y total - solo si está loggeado
    const iva = isLoggedIn ? subtotal * 0.21 : 0;
    const total = isLoggedIn ? subtotal + iva : 0;

    const handleRequestQuote = () => {
        // Verificar que hay productos en el carrito
        if (lines.length === 0) {
            setSuccessData({
                title: "Carrito vacío",
                message: isLoggedIn ? "Tu carrito está vacío. Agrega productos antes de solicitar una cotización" : "Tu cotización está vacía. Agrega productos antes de solicitar una cotización"
            });
            setShowSuccessModal(true);
            return;
        }

        // Si está logueado, usar los datos de la sesión directamente
        if (isLoggedIn && session?.user) {
            submitQuotation({
                nombre: session.user.name || "",
                empresa: "",
                email: session.user.email || "",
                telefono: "",
                cuit: ""
            });
        } else {
            // Si no está logueado, abrir el formulario
            setShowQuotationForm(true);
        }
    };

    const submitQuotation = async (formData: QuotationFormData) => {
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
                    quoteMessage: isLoggedIn 
                        ? `Solicitud de cotización desde el carrito. Total estimado: ${money(total)}`
                        : `Solicitud de cotización sin cuenta registrada`,
                    quoteName: formData.nombre,
                    quoteEmail: formData.email,
                    quotePhone: formData.telefono,
                    quoteCompany: formData.empresa,
                    quoteCuit: formData.cuit
                }),
            });

            const result = await response.json();

            if (response.ok) {
                // Cerrar el formulario modal
                setShowQuotationForm(false);
                
                // Mostrar mensaje de éxito
                setSuccessData({
                    title: "¡Cotización enviada exitosamente!",
                    message: `${result.message}\n\nCódigo de cotización: ${result.order.code}${isLoggedIn ? `\nTotal: ${money(result.order.total)}` : "\n\nRecibirás los precios por email"}`
                });
                setShowSuccessModal(true);
                
            } else {
                // Cerrar el formulario modal
                setShowQuotationForm(false);
                
                setSuccessData({
                    title: "Error al enviar cotización",
                    message: result.error || "Ocurrió un error inesperado. Por favor, intenta nuevamente."
                });
                setShowSuccessModal(true);
            }
        } catch (error) {
            console.error('Error al solicitar cotización:', error);
            
            // Cerrar el formulario modal
            setShowQuotationForm(false);
            
            setSuccessData({
                title: "Error de conexión",
                message: "Error al solicitar cotización. Por favor, verifica tu conexión e intenta nuevamente."
            });
            setShowSuccessModal(true);
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
                    <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-4">
                        {isLoggedIn ? 'Carrito' : 'Cotización'}
                    </h1>
                    <p className="text-[#646464] mb-4">
                        {isLoggedIn ? 'Tu carrito está vacío.' : 'Tu cotización está vacía.'}
                    </p>
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
                                {isLoggedIn ? 'Carrito' : 'Cotización'} <span className="text-[#646464] font-normal">/ {lines.length} SKU - {lines.reduce((acc, line) => acc + line.qty, 0)} Productos</span>
                            </h1>
                        </div>

                        {/* Tabla de productos */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#F5F5F7] border-b border-[#B5B5B5]/40">
                                    <tr className="text-left">
                                        <th className="px-6 py-3 text-sm font-medium text-[#646464]">SKU/Description</th>
                                        <th className="px-3 py-3 text-sm font-medium text-[#646464] text-center w-20">Stock</th>
                                        {isLoggedIn && <th className="px-3 py-3 text-sm font-medium text-[#646464] text-center w-28">Precio Unit S/IVA</th>}
                                        {isLoggedIn && <th className="px-3 py-3 text-sm font-medium text-[#646464] text-center w-16">IVA</th>}
                                        {isLoggedIn && <th className="px-3 py-3 text-sm font-medium text-[#646464] text-center w-20">Cliente</th>}
                                        <th className="px-3 py-3 text-sm font-medium text-[#646464] text-center w-24">Cantidad</th>
                                        {isLoggedIn && <th className="px-3 py-3 text-sm font-medium text-[#646464] text-center w-28">Subtotal</th>}
                                        <th className="px-3 py-3 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#B5B5B5]/20">
                                    {lines.map((line) => {
                                        const priceWithoutTax = line.price / 1.21; // Asumiendo 21% IVA incluido
                                        const lineTotal = line.price * line.qty;

                                        return (
                                            <tr key={line.sku} className="hover:bg-[#F5F5F7]/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-12 h-12 bg-[#F5F5F7] border border-[#B5B5B5]/40 rounded flex-shrink-0 overflow-hidden">
                                                            <ProductImage
                                                                sku={line.sku}
                                                                alt={line.name}
                                                                className="w-full h-full"
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
                                                {isLoggedIn && (
                                                    <td className="px-3 py-4 text-center">
                                                        <div className="text-sm font-medium text-[#1C1C1C]">
                                                            {money(priceWithoutTax)}
                                                        </div>
                                                        <div className="text-xs text-[#646464]">
                                                            {line.unit || "U"}
                                                        </div>
                                                    </td>
                                                )}
                                                {isLoggedIn && (
                                                    <td className="px-3 py-4 text-center">
                                                        <span className="text-sm text-[#646464]">21%</span>
                                                    </td>
                                                )}
                                                {isLoggedIn && (
                                                    <td className="px-3 py-4 text-center">
                                                        <span className="text-sm text-[#646464]">-</span>
                                                    </td>
                                                )}
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
                                                {isLoggedIn && (
                                                    <td className="px-3 py-4 text-center">
                                                        <div className="font-medium text-[#1C1C1C] text-sm">
                                                            {money(lineTotal)}
                                                        </div>
                                                    </td>
                                                )}
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
                        <div className={`px-6 py-4 border-t border-[#B5B5B5]/40 ${isLoggedIn ? 'bg-orange-50' : 'bg-blue-50'}`}>
                            <div className="flex items-start gap-2">
                                <div className={`w-5 h-5 ${isLoggedIn ? 'bg-orange-400' : 'bg-blue-400'} rounded flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                    <span className="text-white text-xs">{isLoggedIn ? '!' : 'i'}</span>
                                </div>
                                <div className={`text-sm ${isLoggedIn ? 'text-orange-700' : 'text-blue-700'}`}>
                                    {isLoggedIn ? (
                                        <>
                                            <div className="font-medium mb-1">Se está aplicando tu descuento especial por ser cliente</div>
                                            <div>El valor total puede variar, ya que no contempla los valores de percepción de AFIP</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="font-medium mb-1">Cotización sin precios</div>
                                            <div>Los precios se calcularán tras la revisión de tu solicitud. Se aplicarán los mejores precios disponibles.</div>
                                        </>
                                    )}
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
                        <h2 className="text-lg font-semibold text-[#1C1C1C] mb-4">
                            {isLoggedIn ? 'Resumen de Compras' : 'Resumen de Cotización'}
                        </h2>
                        
                        <div className="space-y-3 mb-6">
                            {isLoggedIn ? (
                                <>
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
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="mb-4">
                                        <span className="text-4xl">📋</span>
                                    </div>
                                    <div className="text-sm text-[#646464]">
                                        Productos seleccionados para cotización
                                    </div>
                                    <div className="text-lg font-medium text-[#1C1C1C] mt-2">
                                        {lines.reduce((acc, line) => acc + line.qty, 0)} productos
                                    </div>
                                    <div className="text-xs text-[#646464] mt-2">
                                        Los precios serán calculados tras la revisión
                                    </div>
                                </div>
                            )}
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

            {/* Modal de formulario de cotización */}
            <QuotationFormModal
                isOpen={showQuotationForm}
                onClose={() => setShowQuotationForm(false)}
                onSubmit={submitQuotation}
                isSubmitting={isSubmitting}
            />

            {/* Modal de éxito */}
            {successData && (
                <SuccessModal
                    isOpen={showSuccessModal}
                    onClose={() => {
                        setShowSuccessModal(false);
                        setSuccessData(null);
                        // Si fue exitosa la cotización, limpiar carrito y redirigir
                        if (successData.title.includes("exitosamente")) {
                            clear(); // Limpiar carrito después de mostrar el modal
                            router.push("/mis-cotizaciones");
                        }
                    }}
                    title={successData.title}
                    message={successData.message}
                />
            )}
        </>
    );
}