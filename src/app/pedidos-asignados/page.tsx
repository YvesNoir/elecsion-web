"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AccountSidebar from "@/components/AccountSidebar";

type Order = {
    id: string;
    code: string;
    type: "ORDER" | "QUOTE";
    status: string;
    total: number;
    submittedAt: string;
    clientUser: {
        name: string | null;
        email: string;
    } | null;
    _count: {
        items: number;
    };
};

function money(value: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
    }).format(Number(value || 0));
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("es-AR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Argentina/Buenos_Aires",
    });
}

function statusLabel(status: string) {
    const labels: Record<string, string> = {
        DRAFT: "Borrador",
        SUBMITTED: "Pendiente",
        APPROVED: "Confirmado",
        CANCELED: "Cancelado",
        REJECTED: "Rechazado",
        FULFILLED: "Completado",
        SHIPPED: "Enviado",
        DELIVERED: "Entregado",
    };
    return labels[status] || status;
}

function statusColor(status: string) {
    if (status === "APPROVED" || status === "DELIVERED") return "bg-green-100 text-green-800";
    if (status === "CANCELED" || status === "REJECTED") return "bg-red-100 text-red-800";
    if (status === "SUBMITTED") return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
}

export default function AssignedOrdersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "loading") return;

        if (!session?.user) {
            router.push("/login?callbackUrl=/pedidos-asignados");
            return;
        }

        if (session.user.role !== "SELLER") {
            router.push("/mi-cuenta");
            return;
        }

        const fetchOrders = async () => {
            try {
                const response = await fetch("/api/orders/all");
                if (response.ok) {
                    setOrders(await response.json());
                }
            } catch (error) {
                console.error("Error fetching assigned orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [session, status, router]);

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#384A93] mx-auto mb-4" />
                    <p className="text-[#646464]">Cargando pedidos...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mb-4">
                <Link href="/" className="text-[#384A93] hover:underline text-sm">
                    ← Catálogo
                </Link>
                <span className="mx-2 text-[#646464]">👤 Mi Cuenta</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <AccountSidebar />
                </div>

                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg border border-[#B5B5B5]/40 overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#B5B5B5]/40">
                            <h1 className="text-xl font-semibold text-[#1C1C1C]">Pedidos Asignados</h1>
                            <p className="text-sm text-[#646464] mt-1">
                                Pedidos de tus clientes, incluidos los creados desde Pedido Rápido
                            </p>
                        </div>

                        {orders.length === 0 ? (
                            <div className="p-10 text-center text-[#646464]">
                                No hay pedidos asignados.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#F5F5F7] border-b border-[#B5B5B5]/40">
                                        <tr className="text-left">
                                            <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C]">Código</th>
                                            <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C]">Cliente</th>
                                            <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C] text-center">Items</th>
                                            <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C] text-right">Total</th>
                                            <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C]">Estado</th>
                                            <th className="px-4 py-3 text-sm font-medium text-[#1C1C1C]">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#B5B5B5]/20">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-[#F5F5F7]/50">
                                                <td className="px-4 py-4 text-sm font-medium text-[#1C1C1C]">{order.code}</td>
                                                <td className="px-4 py-4 text-sm">
                                                    <div className="text-[#1C1C1C]">{order.clientUser?.name || "Cliente"}</div>
                                                    <div className="text-xs text-[#646464]">{order.clientUser?.email || "—"}</div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-center text-[#646464]">{order._count.items}</td>
                                                <td className="px-4 py-4 text-sm text-right text-[#1C1C1C]">{money(order.total)}</td>
                                                <td className="px-4 py-4 text-sm">
                                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(order.status)}`}>
                                                        {statusLabel(order.status)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-xs text-[#646464]">{formatDateTime(order.submittedAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
