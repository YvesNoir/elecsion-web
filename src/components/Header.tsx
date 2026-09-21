// src/components/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import CartToggleButton from "@/components/cart/CartToggleButton";

type HeaderProps = {
    className?: string;
};

type User = {
    id: string;
    role: string;
    email: string;
    name?: string;
} | null;

const navLink =
    "relative inline-flex items-center px-2 py-2 text-sm font-medium text-[#1C1C1C] transition-colors hover:text-[#384A93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#384A93]/40 focus-visible:ring-offset-2";

export default function Header({ className }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<User>(null);
    const [portalClientsUrl, setPortalClientsUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const response = await fetch("/api/auth/session");
                const data = await response.json();
                setUser(data.user || null);
            } catch (error) {
                console.error("Error fetching session:", error);
            }
        };

        fetchSession();

        const fetchPortalClientsUrl = async () => {
            try {
                const response = await fetch("/api/site-settings/portal-clients", { cache: "no-store" });
                if (!response.ok) return;
                const data = await response.json();
                setPortalClientsUrl(data.url || null);
            } catch (error) {
                console.error("Error fetching Portal clientes URL:", error);
            }
        };

        fetchPortalClientsUrl();

        const handlePortalClientsUrlUpdate = (event: Event) => {
            const customEvent = event as CustomEvent<{ url?: string }>;
            setPortalClientsUrl(customEvent.detail?.url || null);
        };

        window.addEventListener("portal-clients-url-updated", handlePortalClientsUrlUpdate);
        return () => window.removeEventListener("portal-clients-url-updated", handlePortalClientsUrlUpdate);
    }, []);

    const portalHref = portalClientsUrl || (user ? "/mi-cuenta" : "/login");

    return (
        <header className={`relative z-50 -mb-16 w-full border-0 outline-none ${className ?? ""}`}>
            <div className="mx-auto w-full max-w-[1280px] px-4 pt-4 sm:px-6 md:pt-5">
                <div className="relative rounded-full border-0 bg-white px-4 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] outline-none md:grid md:h-[72px] md:grid-cols-[minmax(170px,1fr)_auto_minmax(170px,1fr)] md:items-center md:px-7 md:py-0">
                    {/* Logo */}
                    <Link
                        href="/"
                        aria-label="Elecsion, inicio"
                        className="flex w-fit items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#384A93]/40 focus-visible:ring-offset-2"
                    >
                        <Image
                            src="/logo-elecsion.svg"
                            alt="Elecsion"
                            width={191}
                            height={27}
                            className="h-3 w-auto md:h-4"
                        />
                    </Link>

                    {/* Navegación desktop */}
                    <nav className="hidden items-center justify-center gap-4 md:flex" aria-label="Navegación principal">
                        <Link href="/" className={navLink}>Inicio</Link>
                        <Link href="/catalogo" className={navLink}>Catálogo</Link>
                        <Link href="/contacto" className={navLink}>Contacto</Link>
                        {user && <Link href="/pedido-rapido" className={navLink}>Pedido Rápido</Link>}
                    </nav>

                    {/* Acciones */}
                    <div className="hidden items-center justify-end gap-3 md:flex">
                        <Link
                            href={portalHref}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            className="inline-flex h-11 items-center justify-center rounded-full bg-[#384A93] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2e3d7a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#384A93]/40 focus-visible:ring-offset-2"
                        >
                            Portal Clientes
                        </Link>
                        <CartToggleButton />
                    </div>

                    {/* Acciones móviles */}
                    <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 md:hidden">
                        <CartToggleButton />
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen((open) => !open)}
                            className="grid h-10 w-10 place-items-center rounded-full text-[#1C1C1C] transition-colors hover:bg-[#F5F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#384A93]/40"
                            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? (
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                    <path d="m6 6 12 12M18 6 6 18" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                    <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Navegación móvil */}
                    {mobileMenuOpen && (
                        <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] rounded-[1.5rem] bg-white p-3 shadow-[0_8px_16px_rgba(0,0,0,0.10)] ring-1 ring-black/[0.04] md:hidden">
                            <nav className="grid gap-1" aria-label="Navegación móvil">
                                <Link href="/" className="rounded-xl px-4 py-3 text-sm font-medium text-[#1C1C1C] hover:bg-[#F5F5F7]" onClick={() => setMobileMenuOpen(false)}>
                                    Inicio
                                </Link>
                                <Link href="/catalogo" className="rounded-xl px-4 py-3 text-sm font-medium text-[#1C1C1C] hover:bg-[#F5F5F7]" onClick={() => setMobileMenuOpen(false)}>
                                    Catálogo
                                </Link>
                                <Link href="/contacto" className="rounded-xl px-4 py-3 text-sm font-medium text-[#1C1C1C] hover:bg-[#F5F5F7]" onClick={() => setMobileMenuOpen(false)}>
                                    Contacto
                                </Link>
                                {user && (
                                    <Link href="/pedido-rapido" className="rounded-xl px-4 py-3 text-sm font-medium text-[#1C1C1C] hover:bg-[#F5F5F7]" onClick={() => setMobileMenuOpen(false)}>
                                        Pedido Rápido
                                    </Link>
                                )}
                                <Link href={portalHref} target="_blank" rel="nofollow noopener noreferrer" className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-[#384A93] px-5 text-sm font-semibold text-white hover:bg-[#2e3d7a]" onClick={() => setMobileMenuOpen(false)}>
                                    Portal Clientes
                                </Link>
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
