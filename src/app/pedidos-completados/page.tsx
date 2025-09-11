// src/app/pedidos-completados/page.tsx
"use client";

import Link from "next/link";
import Head from "next/head";
import { useEffect, useState } from "react";
import AccountSidebar from "@/components/AccountSidebar";

function money(n: number, currency = "ARS") {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency })
        .format(Number(n || 0));
}

// Datos de ejemplo - en una implementación real vendrían de la API
const completedOrders = [
    {
        id: "000010640",
        date: "20/11/25",
        company: "NUEVA DIRECCION ELECSION S.R.L.",
        total: 4250000,
        status: "Entregado",
        trackingNumber: "AR123456789",
        deliveryDate: "22/11/25",
        items: [
            { sku: "SICA-001", name: "Lámpara LED A60 9W E27 6500K", qty: 50, price: 1250 },
            { sku: "SICA-003", name: "Tomacorriente Simple 10A Blanco", qty: 100, price: 1800 }
        ]
    },
    {
        id: "000010635",
        date: "15/11/25",
        company: "NUEVA DIRECCION ELECSION S.R.L.",
        total: 2100000,
        status: "Entregado",
        trackingNumber: "AR987654321",
        deliveryDate: "18/11/25",
        items: [
            { sku: "SICA-005", name: "Llave Interruptora 1 Punto Blanca", qty: 75, price: 1500 }
        ]
    }
];

export default function CompletedOrdersPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                setSession(data.user ? { user: data.user } : null);
            })
            .catch(() => setSession(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <>
                <Head>
                    <title>Pedidos Completados | Mi cuenta | Elecsion</title>
                </Head>
                <div className="flex items-center justify-center py-8">
                    <div className="text-[#646464]">Cargando...</div>
                </div>
            </>
        );
    }
    
    if (!session?.user) {
        return (
            <>
                <Head>
                    <title>Pedidos Completados | Mi cuenta | Elecsion</title>
                </Head>
                <div className="mb-4">
                    <Link 
                        href="/" 
                        className="text-[#384A93] hover:underline text-sm"
                    >
                        ← Catálogo
                    </Link>
                    <span className="mx-2 text-[#646464]">Pedidos Completados</span>
                </div>
                
                <div className="bg-white rounded-lg border border-[#B5B5B5]/40 p-8 text-center">
                    <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-4">Pedidos Completados</h1>
                    <p className="text-[#646464] mb-6">
                        No has iniciado sesión. Por favor, inicia sesión para ver tus pedidos.
                    </p>
                    <Link
                        href="/login?next=/pedidos-completados"
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
            <Head>
                <title>Pedidos Completados | Mi cuenta | Elecsion</title>
            </Head>
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
                            <h1 className="text-xl font-semibold text-[#1C1C1C]">Pedidos Completados</h1>
                            <p className="text-sm text-[#646464] mt-1">Historial de pedidos finalizados y entregados</p>
                        </div>

                        <div className="p-6">
                            {completedOrders.length === 0 ? (
                                <div className="bg-[#F5F5F7] rounded-lg p-8 text-center">
                                    <div className="text-4xl mb-4">📦</div>
                                    <p className="text-[#646464] mb-4">
                                        Aún no tienes pedidos completados.
                                    </p>
                                    <Link
                                        href="/catalogo"
                                        className="inline-flex items-center px-4 py-2 bg-[#384A93] text-white rounded-md hover:bg-[#2e3d7a] transition-colors"
                                    >
                                        Hacer tu primer pedido
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Lista de pedidos completados */}
                                    {completedOrders.map((order) => (
                                        <div key={order.id} className="border border-[#B5B5B5]/40 rounded-lg overflow-hidden">
                                            {/* Header del pedido */}
                                            <div className="px-4 py-3 bg-green-50 border-b border-[#B5B5B5]/40">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                                            <span className="text-sm font-medium text-green-800">
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-[#646464]">
                                                            Pedido #{order.id} • {order.date}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm text-[#646464]">Total</div>
                                                        <div className="text-base font-semibold text-[#1C1C1C]">
                                                            {money(order.total)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Información de envío */}
                                            <div className="px-4 py-3 bg-[#F5F5F7] border-b border-[#B5B5B5]/40">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div>
                                                        <span className="text-[#646464]">Entregado el:</span>
                                                        <span className="ml-2 font-medium text-[#1C1C1C]">{order.deliveryDate}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[#646464]">Tracking:</span>
                                                        <span className="ml-2 font-mono text-[#384A93]">{order.trackingNumber}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Items del pedido */}
                                            <div className="p-4">
                                                <div className="space-y-3 mb-4">
                                                    {order.items.map((item, index) => (
                                                        <div key={index} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-12 h-12 bg-[#F5F5F7] border border-[#B5B5B5]/40 rounded flex-shrink-0 overflow-hidden">
                                                                    <img
                                                                        src={`/product-images/${item.sku}.jpg`}
                                                                        alt={item.sku}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            const el = e.currentTarget as HTMLImageElement;
                                                                            el.onerror = null;
                                                                            el.src = "/product-images/placeholder.jpg";
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-sm text-[#1C1C1C]">{item.sku}</div>
                                                                    <div className="text-xs text-[#646464] mt-1">{item.name}</div>
                                                                    <div className="text-xs text-[#646464] mt-1">Cantidad: {item.qty}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-medium text-[#1C1C1C]">
                                                                    {money(item.price * item.qty)}
                                                                </div>
                                                                <div className="text-xs text-[#646464]">
                                                                    {money(item.price)} c/u
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Acciones */}
                                                <div className="flex items-center justify-between pt-4 border-t border-[#B5B5B5]/40">
                                                    <div className="flex gap-3">
                                                        <button className="px-4 py-2 text-sm text-[#384A93] border border-[#384A93] rounded-md hover:bg-[#384A93] hover:text-white transition-colors">
                                                            Ver Factura
                                                        </button>
                                                        <button className="px-4 py-2 text-sm text-[#384A93] border border-[#384A93] rounded-md hover:bg-[#384A93] hover:text-white transition-colors">
                                                            Reordenar
                                                        </button>
                                                    </div>
                                                    <div className="text-xs text-[#646464]">
                                                        Enviado a: {order.company}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Paginación */}
                                    <div className="flex items-center justify-between pt-6">
                                        <div className="text-sm text-[#646464]">
                                            Mostrando {completedOrders.length} de {completedOrders.length} pedidos
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-3 py-1 text-sm border border-[#B5B5B5]/60 rounded hover:bg-[#F5F5F7] disabled:opacity-50" disabled>
                                                Anterior
                                            </button>
                                            <button className="px-3 py-1 text-sm border border-[#B5B5B5]/60 rounded hover:bg-[#F5F5F7] disabled:opacity-50" disabled>
                                                Siguiente
                                            </button>
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