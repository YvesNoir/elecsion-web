// src/app/usuarios/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AccountSidebar from "@/components/AccountSidebar";
import AddUserModal from "@/components/AddUserModal";
import SellerSelector from "@/components/SellerSelector";
import ConfirmationModal from "@/components/ConfirmationModal";

interface User {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    deleted: boolean;
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
        case "DELETED":
            return "Eliminados";
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
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roleFilter, setRoleFilter] = useState<string>("ALL");
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; deleted: boolean } | null>(null);

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
                const usersArray = data.users || [];
                setUsers(usersArray);
                setFilteredUsers(usersArray);
            } else {
                console.error('Error al obtener usuarios:', response.status);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar usuarios cuando cambia el filtro de rol
    useEffect(() => {
        let filtered = users;
        
        // Por defecto, ocultar usuarios eliminados
        if (roleFilter !== "DELETED") {
            filtered = filtered.filter(user => !user.deleted);
        }
        
        // Filtrar por rol
        if (roleFilter === "ALL" || roleFilter === "DELETED") {
            // Si es "ALL", ya se filtraron los eliminados arriba
            // Si es "DELETED", mostrar solo eliminados
            if (roleFilter === "DELETED") {
                filtered = users.filter(user => user.deleted);
            }
        } else {
            // Filtrar por rol específico (y ya se excluyeron los eliminados)
            filtered = filtered.filter(user => user.role === roleFilter);
        }
        
        setFilteredUsers(filtered);
    }, [users, roleFilter]);

    const handleUserAdded = () => {
        fetchUsers(); // Recargar la lista después de agregar un usuario
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete({
            id: user.id,
            name: user.name || user.email,
            deleted: user.deleted
        });
        setConfirmModalOpen(true);
    };

    const handleToggleDeleted = async () => {
        if (!userToDelete) return;

        const response = await fetch(`/api/users/${userToDelete.id}/toggle-active`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al cambiar el estado del usuario');
        }

        // Recargar la lista después del éxito
        fetchUsers();
    };

    const closeConfirmModal = () => {
        setConfirmModalOpen(false);
        setUserToDelete(null);
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
                                        Total: {filteredUsers.length} usuarios {roleFilter !== "ALL" && `(filtrado por ${roleLabel(roleFilter)})`}
                                    </div>
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                        className="text-sm border border-[#B5B5B5]/40 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                                    >
                                        <option value="ALL">Todos los roles</option>
                                        <option value="ADMIN">Administradores</option>
                                        <option value="SELLER">Vendedores</option>
                                        <option value="CLIENT">Clientes</option>
                                        <option value="DELETED">Eliminados</option>
                                    </select>
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
                                        <th className="px-3 py-3 text-sm font-medium text-[#1C1C1C] text-center w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#B5B5B5]/20">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className={`hover:bg-[#F5F5F7]/50 ${user.deleted ? 'opacity-60 bg-gray-50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#384A93] rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                        {(user.name || user.email)?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-[#1C1C1C] text-sm">
                                                            {user.name || "Sin nombre"}
                                                            {user.deleted && <span className="ml-2 text-red-500 text-xs">(Eliminado)</span>}
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
                                            <td className="px-3 py-4 relative">
                                                {user.role === 'CLIENT' ? (
                                                    <SellerSelector
                                                        userId={user.id}
                                                        currentSeller={user.assignedSeller}
                                                        onSellerAssigned={fetchUsers}
                                                    />
                                                ) : (
                                                    <span className="text-[#646464] text-sm">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <span className="text-sm font-medium text-[#1C1C1C]">
                                                    {user.role === 'SELLER' || user.role === 'ADMIN' ? user._count.clients : '—'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <span className="text-xs text-[#646464]">
                                                    {new Date(user.createdAt).toLocaleDateString('es-AR')}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteClick(user)}
                                                    className={`p-1 rounded transition-colors ${
                                                        user.deleted
                                                            ? 'text-green-600 hover:bg-green-100'
                                                            : 'text-red-600 hover:bg-red-100'
                                                    }`}
                                                    title={user.deleted ? 'Restaurar usuario' : 'Eliminar usuario'}
                                                >
                                                    {user.deleted ? (
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v1h10V3a1 1 0 112 0v1h3a1 1 0 110 2h-1v11a2 2 0 01-2 2H3a2 2 0 01-2-2V6H0a1 1 0 110-2h3V3a1 1 0 011-1zm0 5v9h12V7H4z" clipRule="evenodd" />
                                                            <path d="M7 9a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    )}
                                                </button>
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
                                            {filteredUsers.filter(u => u.role === 'ADMIN').length}
                                            {roleFilter === "ALL" && ` / ${users.filter(u => u.role === 'ADMIN').length}`}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[#646464]">Vendedores:</span>
                                        <span className="ml-1 font-medium text-[#1C1C1C]">
                                            {filteredUsers.filter(u => u.role === 'SELLER').length}
                                            {roleFilter === "ALL" && ` / ${users.filter(u => u.role === 'SELLER').length}`}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[#646464]">Clientes:</span>
                                        <span className="ml-1 font-medium text-[#1C1C1C]">
                                            {filteredUsers.filter(u => u.role === 'CLIENT').length}
                                            {roleFilter === "ALL" && ` / ${users.filter(u => u.role === 'CLIENT').length}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-[#646464]">
                                    Activos: {filteredUsers.filter(u => u.isActive).length} de {filteredUsers.length}
                                    {roleFilter !== "ALL" && ` (filtrados)`}
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

            {/* Modal de confirmación para eliminar/restaurar usuario */}
            <ConfirmationModal
                isOpen={confirmModalOpen}
                onClose={closeConfirmModal}
                onConfirm={handleToggleDeleted}
                title={userToDelete?.deleted ? "Restaurar Usuario" : "Eliminar Usuario"}
                message={
                    userToDelete?.deleted 
                        ? `¿Estás seguro de que deseas restaurar al usuario "${userToDelete.name}"? El usuario volverá a estar activo en el sistema.`
                        : `¿Estás seguro de que deseas eliminar al usuario "${userToDelete?.name}"?`
                }
                confirmText={userToDelete?.deleted ? "Restaurar" : "Eliminar"}
                variant={userToDelete?.deleted ? "info" : "danger"}
            />
        </>
    );
}