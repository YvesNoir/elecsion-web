// src/app/mis-cotizaciones/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import AccountSidebar from "@/components/AccountSidebar";

export const metadata: Metadata = {
    title: "Mis Cotizaciones | Mi cuenta | Elecsion",
};

function money(n: number, currency = "ARS") {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency })
        .format(Number(n || 0));
}

// Datos de ejemplo - en una implementación real vendrían de la API
const sampleQuotes = [
    {
        id: "000010639",
        date: "24/11/25",
        company: "NUEVA DIRECCION ELECSION S.R.L.",
        total: 6001468,
        status: "Completo",
        items: [
            { sku: "BT-55-7WW", name: "BULBO ASS MACROLED 7W E27 6C220-240V CALIDO 3000K", qty: 200, price: 425 }
        ]
    }
];

export default async function QuotesPage() {
    const session = await getSession();
    
    if (!session?.user) {
        return (
            <>
                <div className="mb-4">
                    <Link 
                        href="/" 
                        className="text-[#384A93] hover:underline text-sm"
                    >
                        ← Catálogo
                    </Link>
                    <span className="mx-2 text-[#646464]">Mis Cotizaciones</span>
                </div>
                
                <div className="bg-white rounded-lg border border-[#B5B5B5]/40 p-8 text-center">
                    <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-4">Mis Cotizaciones</h1>
                    <p className="text-[#646464] mb-6">
                        No has iniciado sesión. Por favor, inicia sesión para ver tus cotizaciones.
                    </p>
                    <Link
                        href="/login?next=/mis-cotizaciones"
                        className="inline-flex items-center px-4 py-2 bg-[#384A93] text-white rounded-md hover:bg-[#2e3d7a] transition-colors"
                    >
                        Iniciar Sesión
                    </Link>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="mb-4">
                <Link 
                    href="/" 
                    className="text-[#384A93] hover:underline text-sm"
                >
                    ← Catálogo
                </Link>
                <span className="mx-2 text-[#646464]">Mi Cuenta</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar - 1/4 del ancho */}
                <div className="lg:col-span-1">
                    <AccountSidebar />
                </div>

                {/* Contenido principal - 3/4 del ancho */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg border border-[#B5B5B5]/40 overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#B5B5B5]/40">
                            <h1 className="text-xl font-semibold text-[#1C1C1C]">Mis Cotizaciones</h1>
                            <p className="text-sm text-[#646464] mt-1">Historial de cotizaciones realizadas</p>
                        </div>

                        <div className="p-6">
                            {sampleQuotes.length === 0 ? (
                                <div className="bg-[#F5F5F7] rounded-lg p-8 text-center">
                                    <p className="text-[#646464]">
                                        Aún no tienes cotizaciones realizadas.
                                    </p>
                                    <Link
                                        href="/catalogo"
                                        className="inline-flex items-center mt-4 px-4 py-2 bg-[#384A93] text-white rounded-md hover:bg-[#2e3d7a] transition-colors"
                                    >
                                        Explorar Catálogo
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Tabla de cotizaciones */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full border border-[#B5B5B5]/40 rounded-lg overflow-hidden">
                                            <thead className="bg-[#F5F5F7]">
                                                <tr className="text-left">
                                                    <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C]">Orden #</th>
                                                    <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C]">Fecha</th>
                                                    <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C]">Envío</th>
                                                    <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C]">Total de Orden</th>
                                                    <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C]">Estado</th>
                                                    <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C]">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#B5B5B5]/20">
                                                {sampleQuotes.map((quote) => (
                                                    <tr key={quote.id} className="hover:bg-[#F5F5F7]/50">
                                                        <td className="px-4 py-3 text-sm text-[#1C1C1C]">
                                                            {quote.id}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-[#646464]">
                                                            {quote.date}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-[#646464]">
                                                            {quote.company}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium text-[#1C1C1C]">
                                                            {money(quote.total)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                quote.status === 'Completo' 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {quote.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm space-x-2">
                                                            <button className="text-[#384A93] hover:underline">
                                                                Ver pedido
                                                            </button>
                                                            <span className="text-[#B5B5B5]">|</span>
                                                            <button className="text-[#384A93] hover:underline">
                                                                Reordenar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Detalles de la cotización (expandible) */}
                                    <div className="border border-[#B5B5B5]/40 rounded-lg">
                                        <div className="px-4 py-3 bg-[#F5F5F7] border-b border-[#B5B5B5]/40">
                                            <h3 className="text-sm font-medium text-[#1C1C1C]">
                                                Detalle de Cotización #{sampleQuotes[0].id}
                                            </h3>
                                        </div>
                                        <div className="p-4">
                                            <div className="space-y-3">
                                                {sampleQuotes[0].items.map((item, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-white border border-[#B5B5B5]/40 rounded flex-shrink-0"></div>
                                                            <div>
                                                                <div className="font-medium text-sm text-[#1C1C1C]">{item.sku}</div>
                                                                <div className="text-xs text-[#646464] mt-1">{item.name}</div>
                                                                <div className="text-xs text-[#646464] mt-1">
                                                                    Venta x 100 u. - Master 100 u
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm text-[#646464]">Cantidad: {item.qty}</div>
                                                            <div className="text-sm font-medium text-[#1C1C1C]">
                                                                {money(item.price * item.qty)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className="mt-4 pt-4 border-t border-[#B5B5B5]/40 flex justify-between items-center">
                                                <div className="text-sm text-[#646464]">
                                                    ⚠️ No te olvides de actualizar el carrito luego de haber hecho cambios
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-semibold text-[#1C1C1C]">
                                                        Total: {money(sampleQuotes[0].total)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}