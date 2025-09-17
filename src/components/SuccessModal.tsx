"use client";

import { useEffect } from "react";

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    buttonText?: string;
}

export default function SuccessModal({ 
    isOpen, 
    onClose, 
    title, 
    message, 
    buttonText = "Aceptar" 
}: SuccessModalProps) {
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

    if (!isOpen) return null;

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
                {/* Header con ícono de éxito */}
                <div className="flex flex-col items-center px-6 pt-6 pb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <svg 
                            className="w-8 h-8 text-green-600" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M5 13l4 4L19 7" 
                            />
                        </svg>
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
                <div className="px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="w-full bg-[#384a93] hover:bg-[#384a93]/90 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#384a93] focus:ring-offset-2"
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
}