// src/components/Header.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import CartToggleButton from "@/components/cart/CartToggleButton";
import SearchButton from "@/components/SearchButton";
import ExchangeRateDisplay from "@/components/ExchangeRateDisplay";

type HeaderProps = {
    className?: string;
};

export default function Header({ className }: HeaderProps) {
    const { data: session } = useSession();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const navLink = "inline-flex items-center gap-1 px-2 py-1 text-sm text-[#1C1C1C] hover:text-[#384A93] transition-colors";
    const mobileNavLink = "block px-4 py-3 text-[#1C1C1C] hover:bg-[#F5F5F7] border-b border-[#E5E5E5] last:border-b-0";

    // Cerrar menú cuando se hace click fuera
    useEffect(() => {
        const handleClickOutside = () => {
            setIsMobileMenuOpen(false);
        };

        if (isMobileMenuOpen) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isMobileMenuOpen]);

    return (
        <>
            <header className={`w-full bg-white border-b border-[#E5E5E5] relative z-50 ${className ?? ""}`}>
                <div className="mx-auto w-full max-w-[1500px] px-6">
                    {/* Desktop Layout */}
                    <div className="hidden md:grid grid-cols-3 items-center h-16">
                        {/* Izquierda */}
                        <nav className="flex items-center gap-6">
                            <Link href="/" className={navLink}>Inicio</Link>
                            <Link href="/catalogo" className={navLink}>Catálogo</Link>
                            {session?.user && ["SELLER", "ADMIN"].includes(session.user.role as string) && (
                                <Link href="/pedido-rapido" className={navLink}>Pedido Rápido</Link>
                            )}
                            <SearchButton />
                        </nav>

                        {/* Centro (logo) */}
                        <div className="flex justify-center">
                            <Link href="/" aria-label="Elecsion">
                                <img src="/logo-elecsion.svg" alt="Elecsion" className="h-8 w-auto" />
                            </Link>
                        </div>

                        {/* Derecha */}
                        <div className="flex justify-end items-center gap-6">
                            <ExchangeRateDisplay />
                            <Link
                                href={session?.user ? "/mi-cuenta" : "/login"}
                                className={navLink}
                            >
                                {session?.user ? "Mi cuenta" : "Ingresar"}
                            </Link>
                            <CartToggleButton />
                        </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="md:hidden flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" aria-label="Elecsion">
                            <img src="/logo-elecsion.svg" alt="Elecsion" className="h-6 w-auto" />
                        </Link>

                        {/* Hamburger Menu Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMobileMenuOpen(!isMobileMenuOpen);
                            }}
                            className="p-2 text-[#1C1C1C] hover:text-[#384A93] transition-colors"
                            aria-label="Abrir menú"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
                    <div 
                        className="absolute top-16 left-0 right-0 bg-white border-b border-[#E5E5E5] shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <nav className="py-2">
                            <Link href="/" className={mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                                Inicio
                            </Link>
                            <Link href="/catalogo" className={mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                                Catálogo
                            </Link>
                            {session?.user && ["SELLER", "ADMIN"].includes(session.user.role as string) && (
                                <Link href="/pedido-rapido" className={mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                                    Pedido Rápido
                                </Link>
                            )}
                            
                            {/* Búsqueda en móvil */}
                            <div className="px-4 py-3 border-b border-[#E5E5E5]">
                                <SearchButton />
                            </div>
                            
                            {/* Cotización */}
                            <div className="px-4 py-3 border-b border-[#E5E5E5]">
                                <ExchangeRateDisplay />
                            </div>
                            
                            {/* Mi cuenta / Ingresar */}
                            <Link 
                                href={session?.user ? "/mi-cuenta" : "/login"} 
                                className={mobileNavLink} 
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {session?.user ? "Mi cuenta" : "Ingresar"}
                            </Link>
                            
                            {/* Carrito */}
                            <div className="px-4 py-3">
                                <CartToggleButton />
                            </div>
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}