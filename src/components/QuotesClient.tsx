"use client";

import { useState } from "react";
import QuoteActions from "./QuoteActions";
import ProductImage from "./ProductImage";

type QuoteItem = {
    sku: string;
    name: string;
    qty: number;
    price: number;
};

type Quote = {
    id: string;
    realId: string;
    date: string;
    company: string;
    total: number;
    status: string;
    statusLabel: string;
    items: QuoteItem[];
};

type QuotesClientProps = {
    quotes: Quote[];
};

function money(n: number, currency = "ARS") {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency })
        .format(Number(n || 0));
}

export default function QuotesClient({ quotes }: QuotesClientProps) {
    const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(
        quotes.length > 0 ? quotes[0].realId : null
    );

    const selectedQuote = quotes.find(q => q.realId === selectedQuoteId);

    const handleViewQuote = (quoteId: string) => {
        setSelectedQuoteId(quoteId);
    };

    if (quotes.length === 0) {
        return (
            <div className="bg-[#F5F5F7] rounded-lg p-8 text-center">
                <p className="text-[#646464]">
                    Aún no tienes cotizaciones realizadas.
                </p>
                <a
                    href="/catalogo"
                    className="inline-flex items-center mt-4 px-4 py-2 bg-[#384A93] text-white rounded-md hover:bg-[#2e3d7a] transition-colors"
                >
                    Explorar Catálogo
                </a>
            </div>
        );
    }

    return (
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
                        {quotes.map((quote) => (
                            <tr 
                                key={quote.realId} 
                                className={`hover:bg-[#F5F5F7]/50 ${
                                    selectedQuoteId === quote.realId ? 'bg-[#384A93]/5' : ''
                                }`}
                            >
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
                                        quote.status === 'APPROVED' || quote.status === 'FULFILLED' 
                                            ? 'bg-green-100 text-green-800' 
                                            : quote.status === 'CANCELLED'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {quote.statusLabel}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-sm space-x-2">
                                        <button 
                                            onClick={() => handleViewQuote(quote.realId)}
                                            className={`hover:underline ${
                                                selectedQuoteId === quote.realId 
                                                    ? 'text-[#384A93] font-medium' 
                                                    : 'text-[#384A93]'
                                            }`}
                                        >
                                            Ver pedido
                                        </button>
                                        {['DRAFT', 'SUBMITTED'].includes(quote.status) && quote.status !== 'CANCELLED' && (
                                            <>
                                                <span className="text-[#B5B5B5]">|</span>
                                                <QuoteActions 
                                                    quoteId={quote.realId}
                                                    status={quote.status}
                                                />
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Detalles de la cotización seleccionada */}
            {selectedQuote && (
                <div className="border border-[#B5B5B5]/40 rounded-lg">
                    <div className="px-4 py-3 bg-[#F5F5F7] border-b border-[#B5B5B5]/40">
                        <h3 className="text-sm font-medium text-[#1C1C1C]">
                            Detalle de Cotización #{selectedQuote.id}
                        </h3>
                    </div>
                    <div className="p-4">
                        <div className="space-y-3">
                            {selectedQuote.items.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white border border-[#B5B5B5]/40 rounded flex-shrink-0 overflow-hidden">
                                            <ProductImage
                                                sku={item.sku}
                                                alt={item.sku}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-[#1C1C1C]">{item.sku}</div>
                                            <div className="text-xs text-[#646464] mt-1">{item.name}</div>
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
                            <div className="text-right space-y-1">
                                <div className="text-sm text-[#646464]">
                                    Subtotal: {money(selectedQuote.total / 1.21)}
                                </div>
                                <div className="text-sm text-[#646464]">
                                    IVA (21%): {money(selectedQuote.total - (selectedQuote.total / 1.21))}
                                </div>
                                <div className="text-lg font-semibold text-[#1C1C1C] border-t border-[#B5B5B5]/40 pt-1">
                                    Total: {money(selectedQuote.total)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}