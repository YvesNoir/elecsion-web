// src/app/pedidos-pendientes/page.tsx
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
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('es-AR', { 
        month: 'short',
        timeZone: 'America/Argentina/Buenos_Aires'
    });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Argentina/Buenos_Aires'
    });
    
    return `${day} ${month} ${year} ${time}`;
}

function getStatusLabel(status: string) {
    const statusLabels = {
        'DRAFT': 'Borrador',
        'SUBMITTED': 'Enviado',
        'APPROVED': 'Aprobado',
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

export default function PendingOrdersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Verificar autenticación y permisos
    useEffect(() => {
        if (status === "loading") return;
        
        if (!session?.user) {
            router.push("/login?callbackUrl=/pedidos-pendientes");
            return;
        }
        
        if (session.user.role !== "ADMIN" && session.user.role !== "SELLER") {
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
                
                // Si es vendedor, filtrar solo los pedidos asignados a él
                let ordersToShow = data;
                if (session?.user.role === "SELLER") {
                    ordersToShow = data.filter((order: Order) => 
                        order.sellerUser?.email === session.user.email
                    );
                }
                
                // Ordenar por fecha y hora (más recientes primero)
                ordersToShow.sort((a: Order, b: Order) => {
                    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
                });
                
                setOrders(ordersToShow);
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

    const handleConfirmOrder = async (orderId: string) => {
        if (!confirm('¿Estás seguro de que quieres confirmar este pedido?')) {
            return;
        }

        try {
            const response = await fetch(`/api/orders/${orderId}/confirm`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // Refresh orders list
                await fetchOrders();
                alert('Pedido confirmado exitosamente');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error confirming order:', error);
            alert('Error al confirmar el pedido');
        }
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
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company">ELECSION</div>
                    <div class="receipt-title">Recibo de ${getTypeLabel(order.type)}</div>
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
                    <p>Este recibo es para uso interno del taller</p>
                </div>
            </body>
            </html>
        `;
    };

    const canConfirmOrder = (order: Order) => {
        if (!session?.user) return false;
        
        // Los admins pueden confirmar cualquier pedido
        if (session.user.role === "ADMIN") return true;
        
        // Los vendedores solo pueden confirmar pedidos que les están asignados
        if (session.user.role === "SELLER") {
            return order.sellerUser?.email === session.user.email;
        }
        
        return false;
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#384A93] mx-auto mb-4"></div>
                    <p className="text-[#646464]">Cargando pedidos...</p>
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
                                    <h1 className="text-xl font-semibold text-[#1C1C1C]">Pedidos Pendientes</h1>
                                    <p className="text-sm text-[#646464] mt-1">
                                        {session?.user.role === "ADMIN" 
                                            ? "Gestión de cotizaciones y pedidos del sistema" 
                                            : "Pedidos asignados pendientes de confirmación"
                                        }
                                    </p>
                                </div>
                                <div className="text-sm text-[#646464]">
                                    Total: {orders.length} pedidos
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
                                        <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C] text-center w-32">Fecha</th>
                                        <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C] text-center w-24">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#B5B5B5]/20">
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-[#646464]">
                                                No hay pedidos pendientes
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
                                                        order.clientUser 
                                                            ? 'bg-blue-100 text-blue-800'   // Pedidos de clientes registrados
                                                            : 'bg-purple-100 text-purple-800'  // Cotizaciones sin usuario registrado
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
                                                        {formatDateTime(order.submittedAt)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handlePrintOrder(order)}
                                                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                            title="Imprimir recibo"
                                                        >
                                                            🖨️
                                                        </button>
                                                        {order.status === 'SUBMITTED' && canConfirmOrder(order) && (
                                                            <button
                                                                onClick={() => handleConfirmOrder(order.id)}
                                                                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                                title="Confirmar pedido"
                                                            >
                                                                ✅
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer con estadísticas */}
                        {orders.length > 0 && (
                            <div className="px-6 py-4 bg-[#F5F5F7] border-t border-[#B5B5B5]/40">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex gap-6">
                                        <div>
                                            <span className="text-[#646464]">Cotizaciones:</span>
                                            <span className="ml-1 font-medium text-[#1C1C1C]">
                                                {orders.filter(o => o.type === 'QUOTE').length}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[#646464]">Pedidos:</span>
                                            <span className="ml-1 font-medium text-[#1C1C1C]">
                                                {orders.filter(o => o.type === 'ORDER').length}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[#646464]">Pendientes:</span>
                                            <span className="ml-1 font-medium text-[#1C1C1C]">
                                                {orders.filter(o => o.status === 'SUBMITTED').length}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-[#646464]">
                                        Total en cotizaciones: {money(orders.reduce((sum, o) => sum + (o.type === 'QUOTE' ? o.total : 0), 0))}
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