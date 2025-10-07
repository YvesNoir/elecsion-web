"use client";

import { useState, useEffect } from "react";

export default function WhatsAppFloat() {
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Mostrar el botón después de un pequeño delay para una mejor UX
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    const phoneNumber = "+5491158753371";
    const message = "Hola! Me gustaria consultar por productos de Elecsion";
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;

    const handleClick = () => {
        window.open(whatsappUrl, '_blank');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <button
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`
                    group relative flex items-center gap-3
                    bg-gradient-to-r from-[#25D366] to-[#128C7E]
                    hover:from-[#128C7E] hover:to-[#25D366]
                    text-white font-medium
                    px-4 py-3 rounded-full shadow-lg
                    transform transition-all duration-300 ease-out
                    hover:scale-105 hover:shadow-2xl
                    ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
                    max-w-xs sm:max-w-none
                `}
                aria-label="Contactar por WhatsApp"
            >
                {/* Icono de WhatsApp */}
                <div className="relative flex-shrink-0">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="transform transition-transform duration-300 group-hover:rotate-12"
                    >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.687"/>
                    </svg>

                    {/* Indicador de estado online */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>

                {/* Texto del botón */}
                <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-semibold leading-tight">
                        Escríbenos
                    </span>
                </div>

                {/* Versión móvil - solo icono en pantallas pequeñas */}
                <div className="sm:hidden">
                    <span className="text-xs font-medium">WhatsApp</span>
                </div>

                {/* Efecto de ondas */}
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transform scale-0 group-hover:scale-110 transition-all duration-300"></div>
            </button>

            {/* Tooltip para móvil */}
            {isHovered && (
                <div className="sm:hidden absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap transform transition-all duration-200">
                    Escríbenos
                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
            )}
        </div>
    );
}