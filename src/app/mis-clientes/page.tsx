"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AccountSidebar from "@/components/AccountSidebar";

type Client = {
    id: string;
    name: string | null;
    email: string;
    company: string | null;
    phone: string | null;
    _count: {
        orders: number;
    };
};

export default function MyClientsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "loading") return;

        if (!session?.user) {
            router.push("/login?callbackUrl=/mis-clientes");
            return;
        }

        if (session.user.role !== "SELLER") {
            router.push("/mi-cuenta");
            return;
        }

        const fetchClients = async () => {
            try {
                const response = await fetch("/api/clients");
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "No se pudieron cargar los clientes");
                }

                setClients(data.clients || []);
            } catch (fetchError) {
                console.error("Error fetching clients:", fetchError);
                setError("No se pudieron cargar los clientes");
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, [session, status, router]);

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#384A93] mx-auto mb-4" />
                    <p className="text-[#646464]">Cargando clientes...</p>
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
                            <h1 className="text-xl font-semibold text-[#1C1C1C]">Mis Clientes</h1>
                            <p className="text-sm text-[#646464] mt-1">
                                Clientes asignados a tu cuenta
                            </p>
                        </div>

                        {error ? (
                            <div className="p-6 text-center text-red-600">{error}</div>
                        ) : clients.length === 0 ? (
                            <div className="p-10 text-center text-[#646464]">
                                No tenés clientes asignados.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#F5F5F7] border-b border-[#B5B5B5]/40">
                                        <tr className="text-left">
                                            <th className="px-6 py-3 text-sm font-medium text-[#1C1C1C]">Cliente</th>
                                            <th className="px-6 py-3 text-sm font-medium text-[#1C1C1C]">Empresa</th>
                                            <th className="px-6 py-3 text-sm font-medium text-[#1C1C1C]">Email</th>
                                            <th className="px-6 py-3 text-sm font-medium text-[#1C1C1C]">Teléfono</th>
                                            <th className="px-6 py-3 text-sm font-medium text-[#1C1C1C] text-center">Pedidos</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#B5B5B5]/20">
                                        {clients.map((client) => (
                                            <tr key={client.id} className="hover:bg-[#F5F5F7]/50">
                                                <td className="px-6 py-4 text-sm text-[#1C1C1C]">
                                                    {client.name || "Sin nombre"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[#646464]">
                                                    {client.company || "—"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[#646464]">
                                                    {client.email}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[#646464]">
                                                    {client.phone || "—"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[#646464] text-center">
                                                    {client._count.orders}
                                                </td>
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
