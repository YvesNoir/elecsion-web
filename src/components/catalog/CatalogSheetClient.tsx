"use client";
import Link from "next/link";
import { useCatalogStore } from "@/store/catalog";

export default function CatalogSheetClient({
                                               brands,
                                           }: { brands: Array<{ id: string; name: string; slug: string; count: number }> }) {
    const open = useCatalogStore((s) => s.open);
    const close = useCatalogStore((s) => s.closeCatalog);

    return (
        <aside
            aria-hidden={!open}
            className={`fixed inset-y-0 left-0 w-[280px] bg-white border-r border-gray-200 shadow-xl
                  transition-transform duration-200 z-[60]
                  ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
            <div className="px-4 py-3 flex items-center justify-between border-b">
                <span className="font-medium">Catálogo</span>
                <button onClick={close} className="text-sm text-[#384A93]">Cerrar</button>
            </div>

            <div className="overflow-y-auto h-full">
                {brands.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">No hay marcas cargadas.</div>
                ) : (
                    <ul className="divide-y">
                        {brands.map((b) => (
                            <li key={b.id} className="hover:bg-gray-50">
                                <Link
                                    href={`/marcas/${b.slug}`}
                                    className="flex items-center justify-between px-4 py-2 text-sm"
                                    onClick={close}
                                >
                                    <span className="text-[#1C1C1C]">{b.name}</span>
                                    <span className="text-xs text-[#646464]">{b.count}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </aside>
    );
}