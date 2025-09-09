"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

type Brand = { id: string; name: string; slug: string };

type Props = {
    brands: Brand[];
    gradientFrom?: string;
    gradientTo?: string;
};

export default function BrandsDropdownClient({
                                                 brands = [],
                                                 gradientFrom = "#8493D0",
                                                 gradientTo = "#384A93",
                                             }: Props) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const popoverRef = useRef<HTMLDivElement>(null);

    // Cerrar al cambiar de ruta
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    // Cerrar al click afuera o Escape
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!popoverRef.current?.contains(e.target as Node)) setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    return (
        <div className="relative" ref={popoverRef}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="h-10 px-4 rounded-md text-white inline-flex items-center gap-2"
                style={{
                    background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.3)",
                }}
            >
                Marcas
                <span className="h-6 w-6 grid place-items-center rounded-full bg-white/20">›</span>
            </button>

            {open && (
                <div className="absolute left-0 top-12 z-50 w-[360px] max-h-[60vh] overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/10">
                    <ul className="py-2 text-sm">
                        {brands.map((b) => (
                            <li key={b.id}>
                                <Link
                                    href={`/marcas/${b.slug}`}
                                    onClick={() => setOpen(false)}   // ← solo click
                                    className="flex px-4 py-2 hover:bg-gray-50 text-[#1C1C1C]"
                                    prefetch={false}
                                >
                                    {b.name}
                                </Link>
                            </li>
                        ))}
                        {brands.length === 0 && (
                            <li className="px-4 py-3 text-gray-500">Sin marcas disponibles</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}