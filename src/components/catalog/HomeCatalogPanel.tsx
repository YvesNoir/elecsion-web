// src/components/catalog/HomeCatalogPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type BrandLite = { id: string; name: string; slug: string };

export default function HomeCatalogPanel({
                                             brands,
                                             className,
                                         }: {
    brands: BrandLite[];
    className?: string;
}) {
    const [open, setOpen] = useState(false);

    // abrir si llega ?catalogo=1 (solo en el cliente para evitar hydration mismatch)
    useEffect(() => {
        try {
            const sp = new URLSearchParams(window.location.search);
            if (sp.has("catalogo")) setOpen(true);
        } catch {}
    }, []);

    // escuchar el botón del header
    useEffect(() => {
        const onToggle = () => setOpen((v) => !v);
        window.addEventListener("ui:catalog:toggle" as any, onToggle);
        return () => window.removeEventListener("ui:catalog:toggle" as any, onToggle);
    }, []);

    const content = useMemo(
        () =>
            brands.length ? (
                <ul className="divide-y">
                    {brands.map((b) => (
                        <li key={b.id}>
                            <Link
                                href={`/marcas/${b.slug}`}
                                className="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
                            >
                                <span className="truncate">{b.name}</span>
                                <span className="text-xs text-gray-500">ver</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-sm text-gray-500 p-4">No hay marcas cargadas.</div>
            ),
        [brands]
    );

    // En mobile lo mostramos como overlay; en desktop, como columna izquierda fija
    return (
        <>
            {/* Desktop (md+) columna izquierda */}
            <aside
                className={`hidden md:block md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3 transition-all ${
                    open ? "opacity-100" : "opacity-0 pointer-events-none"
                } ${className ?? ""}`}
                aria-hidden={!open}
            >
                <div className="rounded-lg border border-neutral-200 bg-white">
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                        <h2 className="font-medium">Catálogo</h2>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-sm text-gray-600 hover:text-black"
                        >
                            Cerrar
                        </button>
                    </div>
                    {content}
                </div>
            </aside>

            {/* Mobile overlay */}
            {open && (
                <div className="md:hidden fixed inset-0 z-40">
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setOpen(false)}
                        aria-hidden
                    />
                    <div className="absolute left-0 top-0 bottom-0 w-[80vw] max-w-[320px] bg-white z-50 shadow-xl">
                        <div className="flex items-center justify-between px-3 py-2 border-b">
                            <h2 className="font-medium">Catálogo</h2>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-sm text-gray-600 hover:text-black"
                            >
                                Cerrar
                            </button>
                        </div>
                        <div className="overflow-y-auto h-full">{content}</div>
                    </div>
                </div>
            )}
        </>
    );
}