"use client";

import { useState } from "react";

type QuotationFormData = {
    nombre: string;
    empresa: string;
    email: string;
    telefono: string;
    cuit: string;
};

type QuotationFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: QuotationFormData) => void;
    isSubmitting: boolean;
};

export default function QuotationFormModal({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
}: QuotationFormModalProps) {
    const [formData, setFormData] = useState<QuotationFormData>({
        nombre: "",
        empresa: "",
        email: "",
        telefono: "",
        cuit: "",
    });

    const [errors, setErrors] = useState<Partial<QuotationFormData>>({});

    const handleInputChange = (field: keyof QuotationFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpiar error cuando el usuario empiece a escribir
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<QuotationFormData> = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = "El nombre es obligatorio";
        }
        
        if (!formData.email.trim()) {
            newErrors.email = "El email es obligatorio";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "El email no es válido";
        }

        if (!formData.telefono.trim()) {
            newErrors.telefono = "El teléfono es obligatorio";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        onSubmit(formData);
    };

    const handleClose = () => {
        // Resetear el formulario al cerrar
        setFormData({
            nombre: "",
            empresa: "",
            email: "",
            telefono: "",
            cuit: "",
        });
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300"
                onClick={handleClose}
                aria-hidden="true"
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div 
                    className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="border-b border-[#B5B5B5]/40 p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-[#1C1C1C]">
                                Solicitar Cotización
                            </h2>
                            <button
                                onClick={handleClose}
                                className="rounded-md p-1.5 hover:bg-gray-100"
                                aria-label="Cerrar"
                                disabled={isSubmitting}
                            >
                                ×
                            </button>
                        </div>
                        <p className="text-sm text-[#646464] mt-2">
                            Completa tus datos para recibir una cotización personalizada con los mejores precios
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Nombre */}
                        <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                Nombre completo *
                            </label>
                            <input
                                type="text"
                                id="nombre"
                                value={formData.nombre}
                                onChange={(e) => handleInputChange("nombre", e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] ${
                                    errors.nombre ? "border-red-500" : "border-[#B5B5B5]/60"
                                }`}
                                placeholder="Ingresa tu nombre completo"
                                disabled={isSubmitting}
                            />
                            {errors.nombre && (
                                <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
                            )}
                        </div>

                        {/* Empresa */}
                        <div>
                            <label htmlFor="empresa" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                Empresa
                            </label>
                            <input
                                type="text"
                                id="empresa"
                                value={formData.empresa}
                                onChange={(e) => handleInputChange("empresa", e.target.value)}
                                className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93]"
                                placeholder="Nombre de tu empresa (opcional)"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                Email *
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] ${
                                    errors.email ? "border-red-500" : "border-[#B5B5B5]/60"
                                }`}
                                placeholder="tu@email.com"
                                disabled={isSubmitting}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label htmlFor="telefono" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                Teléfono *
                            </label>
                            <input
                                type="tel"
                                id="telefono"
                                value={formData.telefono}
                                onChange={(e) => handleInputChange("telefono", e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93] ${
                                    errors.telefono ? "border-red-500" : "border-[#B5B5B5]/60"
                                }`}
                                placeholder="+54 9 11 1234-5678"
                                disabled={isSubmitting}
                            />
                            {errors.telefono && (
                                <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>
                            )}
                        </div>

                        {/* CUIT */}
                        <div>
                            <label htmlFor="cuit" className="block text-sm font-medium text-[#1C1C1C] mb-1">
                                CUIT
                            </label>
                            <input
                                type="text"
                                id="cuit"
                                value={formData.cuit}
                                onChange={(e) => handleInputChange("cuit", e.target.value)}
                                className="w-full px-3 py-2 border border-[#B5B5B5]/60 rounded-md focus:outline-none focus:ring-2 focus:ring-[#384A93]"
                                placeholder="XX-XXXXXXXX-X (opcional)"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 text-sm text-[#646464] border border-[#B5B5B5]/60 rounded-md hover:bg-gray-50 transition-colors"
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 text-sm bg-[#384A93] text-white rounded-md hover:bg-[#2e3d7a] disabled:opacity-60 transition-colors"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Enviando..." : "Enviar Cotización"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export type { QuotationFormData };