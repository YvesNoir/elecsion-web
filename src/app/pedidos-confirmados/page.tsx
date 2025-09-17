// src/app/pedidos-confirmados/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AccountSidebar from "@/components/AccountSidebar";

interface OrderItem {
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

interface Order {
    id: string;
    code: string;
    type: string;
    status: string;
    total: number;
    currency: string;
    submittedAt: string;
    quoteEmail: string | null;
    quoteName: string | null;
    quotePhone: string | null;
    quoteMessage: string | null;
    clientUser: {
        name: string;
        email: string;
        phone: string | null;
    } | null;
    sellerUser: {
        name: string;
        email: string;
    } | null;
    items: OrderItem[];
    _count: {
        items: number;
    };
}

function money(n: number, currency = "ARS") {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency })
        .format(Number(n || 0));
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-AR', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusLabel(status: string) {
    const statusLabels = {
        'DRAFT': 'Borrador',
        'SUBMITTED': 'Enviado',
        'APPROVED': 'Confirmado',
        'ASSIGNED': 'Asignado',
        'FULFILLED': 'Completado',
        'SHIPPED': 'Enviado',
        'DELIVERED': 'Entregado',
        'CANCELED': 'Cancelado',
        'REJECTED': 'Rechazado'
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
}

function getStatusColor(status: string) {
    const colors = {
        'DRAFT': 'bg-gray-100 text-gray-800',
        'SUBMITTED': 'bg-blue-100 text-blue-800',
        'APPROVED': 'bg-green-100 text-green-800',
        'ASSIGNED': 'bg-purple-100 text-purple-800',
        'FULFILLED': 'bg-emerald-100 text-emerald-800',
        'SHIPPED': 'bg-indigo-100 text-indigo-800',
        'DELIVERED': 'bg-green-100 text-green-800',
        'CANCELED': 'bg-red-100 text-red-800',
        'REJECTED': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}

function getTypeLabel(type: string) {
    return type === 'QUOTE' ? 'Cotización' : 'Pedido';
}

export default function ConfirmedOrdersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Verificar autenticación y permisos
    useEffect(() => {
        if (status === "loading") return;
        
        if (!session?.user) {
            router.push("/login?callbackUrl=/pedidos-confirmados");
            return;
        }
        
        if (session.user.role !== "ADMIN") {
            router.push("/mi-cuenta");
            return;
        }

        fetchOrders();
    }, [session, status, router]);

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders/all');
            if (response.ok) {
                const data = await response.json();
                // Filtrar solo los pedidos confirmados
                const confirmedOrders = data.filter((order: Order) => order.status === 'APPROVED');
                setOrders(confirmedOrders);
            } else {
                console.error('Error al obtener pedidos:', response.status);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintOrder = (order: Order) => {
        // Create printable receipt window
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;

        const receiptHtml = generateReceiptHTML(order);
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const generateReceiptHTML = (order: Order) => {
        const itemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.sku}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">${money(item.unitPrice)}</td>
                <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">${money(item.subtotal)}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Recibo - ${order.code}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .company { font-size: 24px; font-weight: bold; color: #384A93; }
                    .receipt-title { font-size: 18px; margin: 10px 0; }
                    .order-info { margin-bottom: 20px; }
                    .order-info div { margin-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background-color: #f5f5f5; padding: 12px 8px; text-align: left; border-bottom: 2px solid #ddd; }
                    td { padding: 8px; border-bottom: 1px solid #eee; }
                    .totals { margin-top: 20px; text-align: right; }
                    .totals div { margin-bottom: 5px; }
                    .total-final { font-size: 18px; font-weight: bold; padding-top: 10px; border-top: 2px solid #384A93; }
                    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
                    .confirmed-badge { background-color: #10B981; color: white; padding: 8px 16px; border-radius: 8px; margin: 10px 0; display: inline-block; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company">ELECSION</div>
                    <div class="receipt-title">Recibo de ${getTypeLabel(order.type)} - CONFIRMADO</div>
                    <div class="confirmed-badge">✅ PEDIDO CONFIRMADO</div>
                </div>
                
                <div class="order-info">
                    <div><strong>Código:</strong> ${order.code}</div>
                    <div><strong>Fecha:</strong> ${formatDateTime(order.submittedAt)}</div>
                    <div><strong>Cliente:</strong> ${order.clientUser?.name || order.quoteName || 'Cliente'}</div>
                    <div><strong>Email:</strong> ${order.clientUser?.email || order.quoteEmail}</div>
                    ${order.clientUser?.phone || order.quotePhone ? `<div><strong>Teléfono:</strong> ${order.clientUser?.phone || order.quotePhone}</div>` : ''}
                    <div><strong>Estado:</strong> ${getStatusLabel(order.status)}</div>
                    ${order.sellerUser ? `<div><strong>Vendedor:</strong> ${order.sellerUser.name}</div>` : ''}
                    ${order.quoteMessage ? `<div><strong>Mensaje:</strong> ${order.quoteMessage}</div>` : ''}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Descripción</th>
                            <th style="text-align: center;">Cantidad</th>
                            <th style="text-align: right;">Precio Unitario</th>
                            <th style="text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="totals">
                    <div>Subtotal: ${money(order.subtotal)}</div>
                    <div>IVA (21%): ${money(order.taxTotal)}</div>
                    <div class="total-final">Total: ${money(order.total, order.currency)}</div>
                </div>

                <div class="footer">
                    <p>Gracias por su preferencia</p>
                    <p>Este pedido ha sido confirmado y está listo para preparar</p>
                </div>
            </body>
            </html>
        `;
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#384A93] mx-auto mb-4"></div>
                    <p className="text-[#646464]">Cargando pedidos confirmados...</p>
                </div>
            </div>
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
                <span className="mx-2 text-[#646464]">👤 Mi Cuenta</span>
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
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-xl font-semibold text-[#1C1C1C]">Pedidos Confirmados</h1>
                                    <p className="text-sm text-[#646464] mt-1">Pedidos aprobados listos para preparar</p>
                                </div>
                                <div className="text-sm text-[#646464]">
                                    Total: {orders.length} pedidos confirmados
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#F5F5F7] border-b border-[#B5B5B5]/40">
                                    <tr className="text-left">
                                        <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C] w-24">Código</th>
                                        <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C] text-center w-20">Tipo</th>
                                        <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C] w-48">Cliente</th>
                                        <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C] text-center w-32">Items/Total</th>
                                        <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C] text-center w-24">Estado</th>
                                        <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C] w-36">Vendedor</th>
                                        <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C] text-center w-24">Fecha</th>
                                        <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C] text-center w-24">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#B5B5B5]/20">
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-[#646464]">
                                                No hay pedidos confirmados
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-[#F5F5F7]/50">
                                                <td className="px-4 py-4">
                                                    <span className="font-medium text-[#1C1C1C] text-sm">
                                                        {order.code}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        order.type === 'QUOTE' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {getTypeLabel(order.type)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <div className="font-medium text-[#1C1C1C] text-sm">
                                                            {order.clientUser?.name || order.quoteName || "Cliente"}
                                                        </div>
                                                        <div className="text-xs text-[#646464] truncate">
                                                            {order.clientUser?.email || order.quoteEmail}
                                                        </div>
                                                        {(order.clientUser?.phone || order.quotePhone) && (
                                                            <div className="text-xs text-[#646464]">
                                                                {order.clientUser?.phone || order.quotePhone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-[#1C1C1C]">
                                                            {money(order.total, order.currency)}
                                                        </div>
                                                        <div className="text-xs text-[#646464]">
                                                            {order._count.items} item{order._count.items !== 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                        {getStatusLabel(order.status)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {order.sellerUser ? (
                                                        <div className="text-sm">
                                                            <div className="font-medium text-[#1C1C1C]">
                                                                {order.sellerUser.name}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-[#646464]">Sin asignar</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="text-xs text-[#646464]">
                                                        {formatDate(order.submittedAt)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => handlePrintOrder(order)}
                                                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                        title="Imprimir recibo"
                                                    >
                                                        🖨️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer con estadísticas */}
                        {orders.length > 0 && (
                            <div className="px-6 py-4 bg-green-50 border-t border-[#B5B5B5]/40">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex gap-6">
                                        <div>
                                            <span className="text-green-700">Cotizaciones confirmadas:</span>
                                            <span className="ml-1 font-medium text-green-800">
                                                {orders.filter(o => o.type === 'QUOTE').length}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-green-700">Pedidos confirmados:</span>
                                            <span className="ml-1 font-medium text-green-800">
                                                {orders.filter(o => o.type === 'ORDER').length}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-green-700 font-medium">
                                        Total confirmado: {(() => {
                                            const total = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
                                            return total > 0 ? money(total) : "—";
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}