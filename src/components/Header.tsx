// src/components/Header.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import CartToggleButton from "@/components/cart/CartToggleButton";
import SearchButton from "@/components/SearchButton";
import ExchangeRateDisplay from "@/components/ExchangeRateDisplay";

type HeaderProps = {
    className?: string;
};

export default function Header({ className }: HeaderProps) {
    const { data: session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLink =
        "inline-flex items-center gap-1 px-3 py-2 text-sm text-[#1C1C1C] hover:text-[#384A93] transition-colors";

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <header className={`w-full bg-white border-b border-[#E5E5E5] ${className ?? ""}`}>
            <div className="mx-auto w-full max-w-[1500px] px-6">
                {/* Mobile Layout */}
                <div className="md:hidden">
                    {/* Logo centrado */}
                    <div className="flex justify-center py-3 border-b border-[#E5E5E5]">
                        <Link href="/" aria-label="Elecsion">
                            <img src="/logo-elecsion.svg" alt="Elecsion" className="h-8 w-auto" />
                        </Link>
                    </div>

                    {/* Barra con hamburguesa y carrito */}
                    <div className="flex items-center justify-between h-12">
                        {/* Botón hamburguesa */}
                        <button
                            onClick={toggleMobileMenu}
                            className="p-2 text-[#1C1C1C] hover:text-[#384A93] transition-colors"
                            aria-label="Menú"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                            </svg>
                        </button>

                        {/* Carrito */}
                        <CartToggleButton />
                    </div>

                    {/* Menú móvil desplegable */}
                    {mobileMenuOpen && (
                        <div className="border-t border-[#E5E5E5] bg-white">
                            <nav className="py-2">
                                <Link href="/" className={`${navLink} w-full justify-start`} onClick={() => setMobileMenuOpen(false)}>
                                    Inicio
                                </Link>
                                <Link href="/catalogo" className={`${navLink} w-full justify-start`} onClick={() => setMobileMenuOpen(false)}>
                                    Catálogo
                                </Link>
                                <div className={`${navLink} w-full justify-start`}>
                                    <SearchButton />
                                </div>
                                <Link
                                    href={session?.user ? "/mi-cuenta" : "/login"}
                                    className={`${navLink} w-full justify-start`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {session?.user ? "Mi cuenta" : "Ingresar"}
                                </Link>
                                <div className="px-3 py-2">
                                    <ExchangeRateDisplay />
                                </div>
                            </nav>
                        </div>
                    )}
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid grid-cols-3 items-center h-16">
                    {/* Izquierda */}
                    <nav className="flex items-center gap-6">
                        <Link href="/" className={navLink}>Inicio</Link>
                        <Link href="/catalogo" className={navLink}>Catálogo</Link>
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
                        {/* Cotización del dólar */}
                        <ExchangeRateDisplay />

                        <Link
                            href={session?.user ? "/mi-cuenta" : "/login"}
                            className={navLink}
                        >
                            {session?.user ? "Mi cuenta" : "Ingresar"}
                        </Link>

                        {/* Botón que ABRE el drawer del carrito */}
                        <CartToggleButton />
                    </div>
                </div>
            </div>
        </header>
    );
}