// src/app/pedidos-completados/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AccountSidebar from "@/components/AccountSidebar";
import ProductImage from "@/components/ProductImage";

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
    subtotal: number;
    taxTotal: number;
    currency: string;
    submittedAt: string;
    createdAt: string;
    updatedAt: string;
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
}

function money(n: number, currency = "ARS") {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency })
        .format(Number(n || 0));
}

function formatDate(dateString: string) {
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

function getTypeLabel(type: string) {
    return type === 'QUOTE' ? 'Cotización' : 'Pedido';
}

export default function CompletedOrdersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "loading") return;
        
        if (!session?.user) {
            router.push("/login?next=/pedidos-completados");
            return;
        }

        fetchCompletedOrders();
    }, [session, status, router]);

    const fetchCompletedOrders = async () => {
        try {
            const response = await fetch('/api/orders/completed');
            if (response.ok) {
                const data = await response.json();
                setCompletedOrders(data);
            } else {
                console.error('Error al obtener pedidos completados:', response.status);
            }
        } catch (error) {
            console.error('Error fetching completed orders:', error);
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
                <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">${money(item.subtotal || item.unitPrice * item.quantity)}</td>
            </tr>
        `).join('');

        const trackingNumber = `AR${order.id.slice(-6).toUpperCase()}`;
        const deliveryDate = formatDate(order.updatedAt);

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
                    .delivered-badge { background-color: #10B981; color: white; padding: 8px 16px; border-radius: 8px; margin: 10px 0; display: inline-block; }
                    .shipping-info { background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company">ELECSION</div>
                    <div class="receipt-title">Recibo de ${getTypeLabel(order.type)} - COMPLETADO</div>
                    <div class="delivered-badge">✅ PEDIDO ENTREGADO</div>
                </div>
                
                <div class="order-info">
                    <div><strong>Código:</strong> ${order.code}</div>
                    <div><strong>Fecha de Pedido:</strong> ${formatDate(order.submittedAt || order.createdAt)}</div>
                    <div><strong>Fecha de Entrega:</strong> ${deliveryDate}</div>
                    <div><strong>Cliente:</strong> ${order.clientUser?.name || order.quoteName || 'Cliente'}</div>
                    <div><strong>Email:</strong> ${order.clientUser?.email || order.quoteEmail}</div>
                    ${order.clientUser?.phone || order.quotePhone ? `<div><strong>Teléfono:</strong> ${order.clientUser?.phone || order.quotePhone}</div>` : ''}
                    <div><strong>Estado:</strong> ${getStatusLabel(order.status)}</div>
                    ${order.sellerUser ? `<div><strong>Vendedor:</strong> ${order.sellerUser.name}</div>` : ''}
                    ${order.quoteMessage ? `<div><strong>Mensaje:</strong> ${order.quoteMessage}</div>` : ''}
                </div>

                <div class="shipping-info">
                    <div><strong>Información de Envío:</strong></div>
                    <div><strong>Número de Seguimiento:</strong> ${trackingNumber}</div>
                    <div><strong>Empresa:</strong> NUEVA DIRECCION ELECSION S.R.L.</div>
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
                    <div>Subtotal: ${money(order.subtotal || order.total / 1.21)}</div>
                    <div>IVA (21%): ${money(order.taxTotal || order.total - (order.total / 1.21))}</div>
                    <div class="total-final">Total: ${money(order.total, order.currency)}</div>
                </div>

                <div class="footer">
                    <p>Gracias por su preferencia</p>
                    <p>Este pedido ha sido completado y entregado exitosamente</p>
                    <p>NUEVA DIRECCION ELECSION S.R.L. - Distribuidora de Productos Eléctricos</p>
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
                    <p className="text-[#646464]">Cargando pedidos completados...</p>
                </div>
            </div>
        );
    }

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
    };
    
    // Formatear las órdenes para la UI
    const formattedOrders = completedOrders.map(order => ({
        id: order.code || order.id,
        realId: order.id,
        date: new Date(order.createdAt).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }),
        company: "NUEVA DIRECCION ELECSION S.R.L.",
        total: Number(order.total),
        status: order.status === 'DELIVERED' ? 'Entregado' : 
               order.status === 'SHIPPED' ? 'Enviado' :
               order.status === 'FULFILLED' ? 'Procesado' : 'Confirmado',
        trackingNumber: `AR${order.id.slice(-6).toUpperCase()}`,
        deliveryDate: new Date(order.updatedAt).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }),
        items: order.items.map(item => ({
            sku: item.sku || 'N/A',
            name: item.name,
            qty: Number(item.quantity),
            price: Number(item.unitPrice || 0)
        })),
        // Datos completos para la factura
        fullOrder: order
    }));

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
                            <h1 className="text-xl font-semibold text-[#1C1C1C]">Pedidos Completados</h1>
                            <p className="text-sm text-[#646464] mt-1">Historial de pedidos finalizados y entregados</p>
                        </div>

                        <div className="p-6">
                            {formattedOrders.length === 0 ? (
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
                                    {formattedOrders.map((order) => (
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
                                                    <div className="text-right space-y-1">
                                                        <div className="text-xs text-[#646464]">
                                                            Subtotal: {money(order.total / 1.21)}
                                                        </div>
                                                        <div className="text-xs text-[#646464]">
                                                            IVA (21%): {money(order.total - (order.total / 1.21))}
                                                        </div>
                                                        <div className="text-sm text-[#646464] border-t border-[#B5B5B5]/40 pt-1">Total</div>
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
                                                                    <ProductImage
                                                                        sku={item.sku}
                                                                        alt={item.sku}
                                                                        className="w-full h-full object-cover"
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
                                                        <button 
                                                            onClick={() => handlePrintOrder(order.fullOrder)}
                                                            className="px-4 py-2 text-sm text-[#384A93] border border-[#384A93] rounded-md hover:bg-[#384A93] hover:text-white transition-colors"
                                                        >
                                                            Ver Recibo
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
                                            Mostrando {formattedOrders.length} de {formattedOrders.length} pedidos
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