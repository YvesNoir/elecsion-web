// src/app/usuarios/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AccountSidebar from "@/components/AccountSidebar";
import AddUserModal from "@/components/AddUserModal";

interface User {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
    assignedSeller?: {
        name: string;
        email: string;
    } | null;
    _count: {
        clients: number;
    };
}

function roleLabel(role: string) {
    switch (role) {
        case "ADMIN":
            return "Administrador";
        case "SELLER":
            return "Vendedor";
        case "CLIENT":
            return "Cliente";
        default:
            return role;
    }
}

function roleColor(role: string) {
    switch (role) {
        case "ADMIN":
            return "bg-red-100 text-red-800";
        case "SELLER":
            return "bg-blue-100 text-blue-800";
        case "CLIENT":
            return "bg-green-100 text-green-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
}

export default function UsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Verificar autenticación y permisos
    useEffect(() => {
        if (status === "loading") return;
        
        if (!session?.user) {
            router.push("/login?callbackUrl=/usuarios");
            return;
        }
        
        if (session.user.role !== "ADMIN") {
            router.push("/mi-cuenta");
            return;
        }

        fetchUsers();
    }, [session, status, router]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users/all');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                console.error('Error al obtener usuarios:', response.status);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserAdded = () => {
        fetchUsers(); // Recargar la lista después de agregar un usuario
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#384A93] mx-auto mb-4"></div>
                    <p className="text-[#646464]">Cargando usuarios...</p>
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
                                    <h1 className="text-xl font-semibold text-[#1C1C1C]">Usuarios</h1>
                                    <p className="text-sm text-[#646464] mt-1">Gestión de usuarios del sistema</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-[#646464]">
                                        Total: {users.length} usuarios
                                    </div>
                                    <button
                                        className="bg-[#384A93] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2e3d7a] transition-colors flex items-center gap-2"
                                        onClick={() => setIsModalOpen(true)}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Agregar Usuario
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#F5F5F7] border-b border-[#B5B5B5]/40">
                                    <tr className="text-left">
                                        <th className="px-6 py-3 text-sm font-medium text-[#1C1C1C]">Usuario</th>
                                        <th className="px-3 py-3 text-sm font-medium text-[#1C1C1C] text-center w-32">Rol</th>
                                        <th className="px-3 py-3 text-sm font-medium text-[#1C1C1C] text-center w-24">Estado</th>
                                        <th className="px-3 py-3 text-sm font-medium text-[#1C1C1C]">Vendedor Asignado</th>
                                        <th className="px-3 py-3 text-sm font-medium text-[#1C1C1C] text-center w-20">Clientes</th>
                                        <th className="px-3 py-3 text-sm font-medium text-[#1C1C1C] text-center w-28">Fecha Registro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#B5B5B5]/20">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-[#F5F5F7]/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#384A93] rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                        {(user.name || user.email)?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-[#1C1C1C] text-sm">
                                                            {user.name || "Sin nombre"}
                                                        </div>
                                                        <div className="text-xs text-[#646464]">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColor(user.role)}`}>
                                                    {roleLabel(user.role)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    user.isActive 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {user.isActive ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4">
                                                {user.assignedSeller ? (
                                                    <div className="text-sm">
                                                        <div className="font-medium text-[#1C1C1C]">
                                                            {user.assignedSeller.name}
                                                        </div>
                                                        <div className="text-xs text-[#646464]">
                                                            {user.assignedSeller.email}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-[#646464]">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <span className="text-sm font-medium text-[#1C1C1C]">
                                                    {user.role === 'SELLER' ? user._count.clients : '—'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <span className="text-xs text-[#646464]">
                                                    {new Date(user.createdAt).toLocaleDateString('es-AR')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer con estadísticas */}
                        <div className="px-6 py-4 bg-[#F5F5F7] border-t border-[#B5B5B5]/40">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex gap-6">
                                    <div>
                                        <span className="text-[#646464]">Administradores:</span>
                                        <span className="ml-1 font-medium text-[#1C1C1C]">
                                            {users.filter(u => u.role === 'ADMIN').length}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[#646464]">Vendedores:</span>
                                        <span className="ml-1 font-medium text-[#1C1C1C]">
                                            {users.filter(u => u.role === 'SELLER').length}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[#646464]">Clientes:</span>
                                        <span className="ml-1 font-medium text-[#1C1C1C]">
                                            {users.filter(u => u.role === 'CLIENT').length}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-[#646464]">
                                    Activos: {users.filter(u => u.isActive).length} de {users.length}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para agregar usuario */}
            <AddUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUserAdded={handleUserAdded}
            />
        </>
    );
}