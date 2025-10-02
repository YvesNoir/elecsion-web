// src/components/Header.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import CartToggleButton from "@/components/cart/CartToggleButton";
import SearchButton from "@/components/SearchButton";
import ExchangeRateDisplay from "@/components/ExchangeRateDisplay";

type HeaderProps = {
    className?: string;
};

type User = {
    id: string;
    role: string;
    email: string;
    name?: string;
} | null;

export default function Header({ className }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<User>(null);

    // Obtener sesión del usuario
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const response = await fetch('/api/auth/session');
                const data = await response.json();
                setUser(data.user || null);
            } catch (error) {
                console.error('Error fetching session:', error);
            }
        };

        fetchSession();
    }, []);

    const navLink =
        "inline-flex items-center gap-1 px-2 py-1 text-sm text-[#1C1C1C] hover:text-[#384A93] transition-colors";

    return (
        <header className={`w-full bg-white border-b border-[#E5E5E5] ${className ?? ""}`}>
            <div className="mx-auto w-full max-w-[1500px] px-6">
                <div className="flex justify-between items-center h-16">
                    {/* Botón hamburguesa - Solo móvil */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-[#1C1C1C] hover:text-[#384A93] transition-colors"
                        aria-label="Abrir menú"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Navegación desktop - Solo desktop */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/" className={navLink}>Inicio</Link>
                        <Link href="/catalogo" className={navLink}>Catálogo</Link>
                        {user && (
                            <Link href="/pedido-rapido" className={navLink}>Pedido Rápido</Link>
                        )}
                        <SearchButton />
                    </nav>

                    {/* Logo - Centrado en móvil, izquierda en desktop */}
                    <div className="flex-1 flex justify-center md:justify-start md:flex-none">
                        <Link href="/" aria-label="Elecsion">
                            <img src="/logo-elecsion.svg" alt="Elecsion" className="h-6 md:h-8 w-auto" />
                        </Link>
                    </div>

                    {/* Elementos derecha */}
                    <div className="flex items-center gap-2 md:gap-6">
                        {/* Cotización del dólar - Solo desktop */}
                        <div className="hidden md:block">
                            <ExchangeRateDisplay />
                        </div>

                        {/* Mi cuenta / Login - Solo desktop */}
                        <div className="hidden md:block">
                            <Link
                                href={user ? "/mi-cuenta" : "/login"}
                                className={navLink}
                            >
                                {user ? "Mi cuenta" : "Ingresar"}
                            </Link>
                        </div>

                        {/* Botón carrito */}
                        <CartToggleButton />
                    </div>
                </div>

                {/* Menú móvil desplegable */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-[#E5E5E5]">
                        <nav className="py-4 space-y-3">
                            <Link
                                href="/"
                                className="block px-4 py-2 text-sm text-[#1C1C1C] hover:text-[#384A93] hover:bg-gray-50 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Inicio
                            </Link>
                            <Link
                                href="/catalogo"
                                className="block px-4 py-2 text-sm text-[#1C1C1C] hover:text-[#384A93] hover:bg-gray-50 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Catálogo
                            </Link>
                            {user && (
                                <Link
                                    href="/pedido-rapido"
                                    className="block px-4 py-2 text-sm text-[#1C1C1C] hover:text-[#384A93] hover:bg-gray-50 transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Pedido Rápido
                                </Link>
                            )}

                            {/* Separador */}
                            <div className="border-t border-[#E5E5E5] my-3"></div>

                            {/* Cotización móvil */}
                            <div className="px-4">
                                <ExchangeRateDisplay />
                            </div>

                            {/* Mi cuenta / Login */}
                            <Link
                                href={user ? "/mi-cuenta" : "/login"}
                                className="block px-4 py-2 text-sm text-[#1C1C1C] hover:text-[#384A93] hover:bg-gray-50 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {user ? "Mi cuenta" : "Ingresar"}
                            </Link>

                            {/* Buscador móvil */}
                            <div className="px-4">
                                <SearchButton />
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}