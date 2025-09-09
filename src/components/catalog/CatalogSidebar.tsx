// src/components/catalog/CatalogSidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Brand = {
    id: string;
    name: string;
    slug: string;
    _count: { products: number };
};

export default function CatalogSidebar() {
    const [open, setOpen] = useState(false);
    const [brands, setBrands] = useState<Brand[] | null>(null);
    const [loading, setLoading] = useState(false);

    // Escuchar el evento global para abrir/cerrar
    useEffect(() => {
        const toggle = () => setOpen((v) => !v);
        const openFn = () => setOpen(true);
        const closeFn = () => setOpen(false);

        window.addEventListener("catalog:toggle", toggle);
        window.addEventListener("catalog:open", openFn);
        window.addEventListener("catalog:close", closeFn);
        return () => {
            window.removeEventListener("catalog:toggle", toggle);
            window.removeEventListener("catalog:open", openFn);
            window.removeEventListener("catalog:close", closeFn);
        };
    }, []);

    // Cargar marcas la primera vez que se abre
    useEffect(() => {
        if (!open || brands) return;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/brands", { cache: "no-store" });
                const data: Brand[] = await res.json();
                setBrands(data);
            } finally {
                setLoading(false);
            }
        })();
    }, [open, brands]);

    return (
        <div
            className={`fixed inset-0 z-[60] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
            aria-hidden={!open}
        >
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/20 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
                onClick={() => window.dispatchEvent(new Event("catalog:close"))}
            />

            {/* Panel */}
            <aside
                className={`absolute left-0 top-0 h-full w-72 bg-white border-r border-black/10 shadow-sm
                    transition-transform duration-300 ease-out
                    ${open ? "translate-x-0" : "-translate-x-full"}`}
                role="dialog"
                aria-label="Catálogo"
            >
                <div className="h-14 px-4 flex items-center justify-between border-b">
                    <span className="font-medium text-[#1C1C1C]">Catálogo</span>
                    <button
                        className="text-sm text-[#1C1C1C] hover:underline"
                        onClick={() => window.dispatchEvent(new Event("catalog:close"))}
                    >
                        Cerrar
                    </button>
                </div>

                <div className="p-3">
                    {loading && (
                        <ul className="space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <li key={i} className="h-4 rounded bg-gray-200 animate-pulse" />
                            ))}
                        </ul>
                    )}

                    {!loading && brands && (
                        <ul className="space-y-1">
                            {brands.map((b) => (
                                <li key={b.id}>
                                    <Link
                                        href={`/marcas/${b.slug}`}
                                        className="flex items-center justify-between rounded px-2 py-2 hover:bg-gray-50 text-[#1C1C1C]"
                                        onClick={() => window.dispatchEvent(new Event("catalog:close"))}
                                    >
                                        <span className="truncate">{b.name}</span>
                                        <span className="text-xs text-[#646464]">{b._count.products}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    {!loading && brands && brands.length === 0 && (
                        <p className="text-sm text-[#646464]">No hay marcas cargadas.</p>
                    )}
                </div>
            </aside>
        </div>
    );
}