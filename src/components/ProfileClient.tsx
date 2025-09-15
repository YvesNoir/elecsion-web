"use client";

import { useState } from "react";

type User = {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    company: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    role: string;
    isActive: boolean | null;
};

type ProfileClientProps = {
    user: User;
};

export default function ProfileClient({ user }: ProfileClientProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [formData, setFormData] = useState({
        name: user.name || "",
        email: user.email,
        phone: user.phone || "",
        company: user.company || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        zip: user.zip || "",
        newsletter: false,
        promotions: false
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setSaveMessage(null);
        // Resetear datos a los originales
        setFormData({
            name: user.name || "",
            email: user.email,
            phone: user.phone || "",
            company: user.company || "",
            address: user.address || "",
            city: user.city || "",
            state: user.state || "",
            zip: user.zip || "",
            newsletter: false,
            promotions: false
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage(null);
        
        try {
            const response = await fetch('/api/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    company: formData.company,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zip: formData.zip
                })
            });

            if (response.ok) {
                const result = await response.json();
                setSaveMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
                setIsEditing(false);
                
                // Actualizar los datos del usuario en el estado
                // Esto forzaría una re-renderización con los nuevos datos
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                const error = await response.json();
                setSaveMessage({ type: 'error', text: error.error || 'Error al actualizar el perfil' });
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            setSaveMessage({ type: 'error', text: 'Error de conexión. Intenta nuevamente.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isEditing) {
        // Modo de solo lectura
        return (
            <div className="space-y-6">
                {/* Header con botón de editar */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-[#1C1C1C]">Tu Información</h2>
                        <p className="text-sm text-[#646464]">Revisa y actualiza tu información personal</p>
                    </div>
                    <button
                        onClick={handleEdit}
                        className="px-4 py-2 bg-[#384A93] text-white rounded-md hover:bg-[#2e3d7a] transition-colors text-sm"
                    >
                        ✏️ Editar
                    </button>
                </div>

                {/* Información Personal */}
                <div className="bg-[#F5F5F7] rounded-lg p-4">
                    <h3 className="text-base font-medium text-[#1C1C1C] mb-3">Información Personal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#646464] mb-1">Nombre completo</label>
                            <p className="text-[#1C1C1C]">{formData.name || "—"}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#646464] mb-1">Email</label>
                            <p className="text-[#1C1C1C]">{formData.email}</p>
                        </div>
                    </div>
                </div>

                {/* Información de Contacto */}
                <div className="bg-[#F5F5F7] rounded-lg p-4">
                    <h3 className="text-base font-medium text-[#1C1C1C] mb-3">Información de Contacto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#646464] mb-1">Teléfono</label>
                            <p className="text-[#1C1C1C]">{formData.phone || "—"}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#646464] mb-1">Empresa</label>
                            <p className="text-[#1C1C1C]">{formData.company || "—"}</p>
                        </div>
                    </div>
                </div>

                {/* Dirección de Entrega */}
                <div className="bg-[#F5F5F7] rounded-lg p-4">
                    <h3 className="text-base font-medium text-[#1C1C1C] mb-3">Dirección de Entrega</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-[#646464] mb-1">Dirección</label>
                            <p className="text-[#1C1C1C]">{formData.address || "—"}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#646464] mb-1">Ciudad</label>
                                <p className="text-[#1C1C1C]">{formData.city || "—"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#646464] mb-1">Provincia</label>
                                <p className="text-[#1C1C1C]">{formData.state || "—"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#646464] mb-1">Código Postal</label>
                                <p className="text-[#1C1C1C]">{formData.zip || "—"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Modo de edición
    return (
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-[#1C1C1C]">Editando Perfil</h2>
                <p className="text-sm text-[#646464]">Actualiza tu información personal</p>
                
                {/* Mensaje de estado */}
                {saveMessage && (
                    <div className={`mt-3 p-3 rounded-md text-sm ${
                        saveMessage.type === 'success' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                        {saveMessage.text}
                    </div>
                )}
            </div>

            {/* Información personal */}
            <div>
                <h3 className="text-base font-medium text-[#1C1C1C] mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                            Nombre completo
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Información de contacto */}
            <div className="border-t border-[#B5B5B5]/40 pt-6">
                <h3 className="text-base font-medium text-[#1C1C1C] mb-4">Información de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="2099-6983"
                            className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label htmlFor="company" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                            Empresa
                        </label>
                        <input
                            type="text"
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleInputChange}
                            placeholder="Nombre de la empresa"
                            className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Dirección */}
            <div className="border-t border-[#B5B5B5]/40 pt-6">
                <h3 className="text-base font-medium text-[#1C1C1C] mb-4">Dirección de Entrega</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                            Dirección
                        </label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Calle y número"
                            className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                Ciudad
                            </label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                placeholder="Buenos Aires"
                                className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                Provincia
                            </label>
                            <input
                                type="text"
                                id="state"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                placeholder="Buenos Aires"
                                className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label htmlFor="zip" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                Código Postal
                            </label>
                            <input
                                type="text"
                                id="zip"
                                name="zip"
                                value={formData.zip}
                                onChange={handleInputChange}
                                placeholder="1439"
                                className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Botones */}
            <div className="border-t border-[#B5B5B5]/40 pt-6 flex gap-3">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-[#384A93] text-white rounded-md hover:bg-[#2e3d7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2 border border-[#B5B5B5]/60 text-[#646464] rounded-md hover:bg-[#F5F5F7] transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}