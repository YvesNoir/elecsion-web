"use client";

import { useState, useEffect } from "react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({ 
    isOpen, 
    onClose, 
    onConfirm,
    title, 
    message, 
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "danger"
}: ConfirmationModalProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset states when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setLoading(false);
            setSuccess(false);
            setError(null);
        }
    }, [isOpen]);

    // Cerrar modal con Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !loading) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            // Prevenir scroll del body cuando el modal está abierto
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose, loading]);

    const handleConfirm = async () => {
        setLoading(true);
        setError(null);
        
        try {
            await onConfirm();
            setSuccess(true);
            
            // Auto close after success
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Colores según la variante
    const variantStyles = {
        danger: {
            icon: "🗑️",
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            confirmBg: "bg-red-600 hover:bg-red-700",
            confirmText: "text-white"
        },
        warning: {
            icon: "⚠️", 
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            confirmBg: "bg-orange-600 hover:bg-orange-700",
            confirmText: "text-white"
        },
        info: {
            icon: "ℹ️",
            iconBg: "bg-blue-100", 
            iconColor: "text-blue-600",
            confirmBg: "bg-[#384a93] hover:bg-[#384a93]/90",
            confirmText: "text-white"
        }
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 transition-opacity duration-300"
                onClick={!loading ? onClose : undefined}
                aria-hidden="true"
            />
            
            {/* Modal */}
            <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
                {/* Success State */}
                {success && (
                    <div className="flex flex-col items-center px-6 py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-[#1C1C1C] text-center mb-2">
                            ¡Acción completada!
                        </h3>
                        <p className="text-sm text-[#646464] text-center">
                            La operación se realizó exitosamente.
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="flex flex-col items-center px-6 py-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-[#1C1C1C] text-center mb-2">
                            Error
                        </h3>
                        <p className="text-sm text-red-600 text-center mb-6">
                            {error}
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-[#646464] font-medium py-3 px-4 rounded-md transition-colors duration-200"
                        >
                            Cerrar
                        </button>
                    </div>
                )}

                {/* Confirmation State */}
                {!success && !error && (
                    <>
                        {/* Header con ícono */}
                        <div className="flex flex-col items-center px-6 pt-6 pb-4">
                            <div className={`w-16 h-16 ${styles.iconBg} rounded-full flex items-center justify-center mb-4`}>
                                <span className="text-2xl">{styles.icon}</span>
                            </div>
                            
                            <h3 className="text-lg font-semibold text-[#1C1C1C] text-center">
                                {title}
                            </h3>
                        </div>

                        {/* Body */}
                        <div className="px-6 pb-4">
                            <p className="text-sm text-[#646464] text-center leading-relaxed">
                                {message}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#646464] font-medium py-3 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className={`flex-1 ${styles.confirmBg} ${styles.confirmText} font-medium py-3 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Procesando...
                                    </div>
                                ) : (
                                    confirmText
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}