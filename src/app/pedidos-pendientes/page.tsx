// src/app/pedidos-pendientes/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AccountSidebar from "@/components/AccountSidebar";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

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
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        orderId: '',
        orderCode: ''
    });
    const [cancelModal, setCancelModal] = useState({
        isOpen: false,
        orderId: '',
        orderCode: ''
    });
    const { toast, showSuccess, showError, hideToast } = useToast();

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

    // Aplicar filtro cuando cambien los pedidos
    useEffect(() => {
        handleStatusFilterChange(statusFilter);
    }, [orders, statusFilter]);

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders/all');
            if (response.ok) {
                const data = await response.json();
                
                // Filtrar solo pedidos pendientes y cancelados (NO los aprobados que van a pedidos-confirmados)
                const pendingOrders = data.filter((order: Order) =>
                    order.status === 'SUBMITTED' || order.status === 'CANCELED'
                );

                // Si es vendedor, filtrar solo los pedidos asignados a él
                if (session?.user.role === "SELLER") {
                    const sellerOrders = pendingOrders.filter((order: Order) =>
                        order.sellerUser?.email === session.user.email
                    );
                    setOrders(sellerOrders);
                    setFilteredOrders(sellerOrders);
                } else {
                    // Los admins ven todos los pedidos pendientes y cancelados
                    setOrders(pendingOrders);
                    setFilteredOrders(pendingOrders);
                }
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

    const openConfirmModal = (orderId: string, orderCode: string) => {
        setConfirmModal({
            isOpen: true,
            orderId,
            orderCode
        });
    };

    const closeConfirmModal = () => {
        setConfirmModal({
            isOpen: false,
            orderId: '',
            orderCode: ''
        });
    };

    const openCancelModal = (orderId: string, orderCode: string) => {
        setCancelModal({
            isOpen: true,
            orderId,
            orderCode
        });
    };

    const closeCancelModal = () => {
        setCancelModal({
            isOpen: false,
            orderId: '',
            orderCode: ''
        });
    };

    const handleStatusFilterChange = (newStatus: string) => {
        setStatusFilter(newStatus);

        if (newStatus === 'all') {
            setFilteredOrders(orders);
        } else {
            const filtered = orders.filter(order => {
                switch (newStatus) {
                    case 'pending':
                        return order.status === 'SUBMITTED';
                    case 'canceled':
                        return order.status === 'CANCELED';
                    default:
                        return true;
                }
            });
            setFilteredOrders(filtered);
        }
    };


    const handleConfirmOrder = async () => {
        try {
            const response = await fetch(`/api/orders/${confirmModal.orderId}/confirm`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // Cerrar modal y refresh orders list
                closeConfirmModal();
                await fetchOrders();
                showSuccess('Pedido confirmado exitosamente');
            } else {
                const error = await response.json();
                showError(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error confirming order:', error);
            showError('Error al confirmar el pedido');
        }
    };

    const handleCancelOrder = async () => {
        try {
            const response = await fetch(`/api/orders/${cancelModal.orderId}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // Cerrar modal y refresh orders list
                closeCancelModal();
                await fetchOrders();
                showSuccess('Pedido cancelado exitosamente');
            } else {
                const error = await response.json();
                showError(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error canceling order:', error);
            showError('Error al cancelar el pedido');
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

    const canCancelOrder = (order: Order) => {
        if (!session?.user) return false;

        // Solo se pueden cancelar pedidos que no estén completados/entregados/ya cancelados
        const nonCancellableStatuses = ["FULFILLED", "SHIPPED", "DELIVERED", "CANCELED"];
        if (nonCancellableStatuses.includes(order.status)) return false;

        // Los admins pueden cancelar cualquier pedido
        if (session.user.role === "ADMIN") return true;

        // Los vendedores solo pueden cancelar pedidos que les están asignados
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
                                <div className="flex items-center gap-4">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => handleStatusFilterChange(e.target.value)}
                                        className="px-3 py-1 text-sm border border-[#B5B5B5]/40 rounded-md bg-white text-[#1C1C1C] focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                                    >
                                        <option value="all">Todos los estados</option>
                                        <option value="pending">Pendientes</option>
                                        <option value="canceled">Cancelados</option>
                                    </select>
                                    <div className="text-sm text-[#646464]">
                                        Mostrando: {filteredOrders.length} de {orders.length} pedidos
                                    </div>
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
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-[#646464]">
                                                {orders.length === 0
                                                    ? "No hay pedidos pendientes"
                                                    : `No hay pedidos con el filtro seleccionado`
                                                }
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order) => (
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
                                                        {formatDate(order.submittedAt)}
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
                                                                onClick={() => openConfirmModal(order.id, order.code)}
                                                                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                                title="Confirmar pedido"
                                                            >
                                                                ✅
                                                            </button>
                                                        )}
                                                        {canCancelOrder(order) && (
                                                            <button
                                                                onClick={() => openCancelModal(order.id, order.code)}
                                                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                                title="Cancelar pedido"
                                                            >
                                                                ❌
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
                                                {filteredOrders.filter(o => o.type === 'QUOTE').length}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[#646464]">Pedidos:</span>
                                            <span className="ml-1 font-medium text-[#1C1C1C]">
                                                {filteredOrders.filter(o => o.type === 'ORDER').length}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[#646464]">Pendientes:</span>
                                            <span className="ml-1 font-medium text-[#1C1C1C]">
                                                {filteredOrders.filter(o => o.status === 'SUBMITTED').length}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[#646464]">Cancelados:</span>
                                            <span className="ml-1 font-medium text-[#1C1C1C]">
                                                {filteredOrders.filter(o => o.status === 'CANCELED').length}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-[#646464]">
                                        Total filtrado: {money(filteredOrders.reduce((sum, o) => sum + o.total, 0))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de confirmación */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Confirmar Pedido"
                message={`¿Estás seguro que deseas confirmar el pedido ${confirmModal.orderCode}? Esta acción no se puede deshacer.`}
                confirmText="Confirmar"
                cancelText="Cancelar"
                confirmButtonClass="bg-green-600 hover:bg-green-700 text-white"
                onConfirm={handleConfirmOrder}
                onCancel={closeConfirmModal}
            />

            {/* Modal de cancelación */}
            <ConfirmModal
                isOpen={cancelModal.isOpen}
                title="Cancelar Pedido"
                message={`¿Estás seguro que deseas cancelar el pedido ${cancelModal.orderCode}? Esta acción no se puede deshacer y se notificará al cliente.`}
                confirmText="Cancelar Pedido"
                cancelText="No cancelar"
                confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
                onConfirm={handleCancelOrder}
                onCancel={closeCancelModal}
            />

            {/* Toast de notificaciones */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />
        </>
    );
}