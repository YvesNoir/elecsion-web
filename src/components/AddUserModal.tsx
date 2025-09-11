"use client";

import { useState, useEffect } from "react";

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
}

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserAdded: () => void;
}

export default function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "CLIENT",
        assignedSellerId: ""
    });
    const [sellers, setSellers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Obtener lista de vendedores y admins para asignar a clientes
    useEffect(() => {
        if (isOpen) {
            fetchSellers();
        }
    }, [isOpen]);

    const fetchSellers = async () => {
        try {
            const response = await fetch('/api/users/sellers');
            if (response.ok) {
                const data = await response.json();
                setSellers(data);
            }
        } catch (error) {
            console.error('Error fetching sellers:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    role: formData.role,
                    assignedSellerId: formData.role === 'CLIENT' ? formData.assignedSellerId : null
                }),
            });

            if (response.ok) {
                onUserAdded();
                onClose();
                setFormData({
                    name: "",
                    email: "",
                    password: "",
                    phone: "",
                    role: "CLIENT",
                    assignedSellerId: ""
                });
            } else {
                const errorData = await response.json();
                setErrors(errorData.errors || { general: 'Error al crear usuario' });
            }
        } catch (error) {
            console.error('Error creating user:', error);
            setErrors({ general: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#B5B5B5]/40">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-[#1C1C1C]">Agregar Usuario</h2>
                        <button
                            onClick={onClose}
                            className="text-[#646464] hover:text-[#1C1C1C] transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        {/* Nombre */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-[#1C1C1C] mb-2">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent transition-colors ${
                                    errors.name ? 'border-red-500' : 'border-[#B5B5B5]/60'
                                }`}
                                required
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[#1C1C1C] mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent transition-colors ${
                                    errors.email ? 'border-red-500' : 'border-[#B5B5B5]/60'
                                }`}
                                required
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-[#1C1C1C] mb-2">
                                Contraseña *
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent transition-colors ${
                                    errors.password ? 'border-red-500' : 'border-[#B5B5B5]/60'
                                }`}
                                required
                                minLength={6}
                            />
                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-[#1C1C1C] mb-2">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent transition-colors"
                                placeholder="+5491150011976"
                            />
                        </div>

                        {/* Rol */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-[#1C1C1C] mb-2">
                                Rol *
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent transition-colors"
                                required
                            >
                                <option value="CLIENT">Cliente</option>
                                <option value="SELLER">Vendedor</option>
                                <option value="ADMIN">Administrador</option>
                            </select>
                        </div>

                        {/* Vendedor Asignado (solo para clientes) */}
                        {formData.role === 'CLIENT' && (
                            <div>
                                <label htmlFor="assignedSellerId" className="block text-sm font-medium text-[#1C1C1C] mb-2">
                                    Vendedor Asignado
                                </label>
                                <select
                                    id="assignedSellerId"
                                    name="assignedSellerId"
                                    value={formData.assignedSellerId}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent transition-colors"
                                >
                                    <option value="">Sin asignar</option>
                                    {sellers.map((seller) => (
                                        <option key={seller.id} value={seller.id}>
                                            {seller.name} - {seller.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Error general */}
                        {errors.general && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{errors.general}</p>
                            </div>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 mt-6 pt-4 border-t border-[#B5B5B5]/40">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-[#646464] border border-[#B5B5B5]/60 rounded-lg hover:bg-[#F5F5F7] transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-[#384A93] text-white rounded-lg hover:bg-[#2e3d7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creando...' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}