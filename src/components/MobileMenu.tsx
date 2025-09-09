"use client";
import { useState } from "react";
import Link from "next/link";

export default function MobileMenu() {
    const [open, setOpen] = useState(false);
    return (
        <div className="lg:hidden">
            <button
                aria-label="Abrir menú"
                onClick={() => setOpen((v) => !v)}
                className="h-9 w-9 grid place-items-center rounded-md ring-1 ring-brand-silver/60"
            >
                {/* ícono hamburguesa */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-14 z-50 bg-white border-y border-brand-silver/60">
                    <nav className="px-4 py-3 grid gap-3">
                        <Link href="/" className="hover:text-brand-primary" onClick={() => setOpen(false)}>Inicio</Link>
                        <Link href="/tienda" className="hover:text-brand-primary" onClick={() => setOpen(false)}>Tienda</Link>
                        <Link href="/nuevos" className="hover:text-brand-primary" onClick={() => setOpen(false)}>Nuevos</Link>
                        <Link href="/contacto" className="hover:text-brand-primary" onClick={() => setOpen(false)}>Contáctenos</Link>
                        <Link href="/faq" className="hover:text-brand-primary" onClick={() => setOpen(false)}>Preguntas Frecuentes</Link>
                        <Link href="/cliente/carrito" className="hover:text-brand-primary" onClick={() => setOpen(false)}>Carrito</Link>
                    </nav>
                </div>
            )}
        </div>
    );
}