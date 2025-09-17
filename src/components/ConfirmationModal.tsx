"use client";

import { useEffect } from "react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
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
    // Cerrar modal con Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
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
    }, [isOpen, onClose]);

    const handleConfirm = () => {
        onConfirm();
        onClose();
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
                onClick={onClose}
                aria-hidden="true"
            />
            
            {/* Modal */}
            <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
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
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#646464] font-medium py-3 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`flex-1 ${styles.confirmBg} ${styles.confirmText} font-medium py-3 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}