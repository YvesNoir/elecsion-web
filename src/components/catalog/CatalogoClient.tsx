// src/components/catalog/CatalogoClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type BrandLite = {
    id: string;
    name: string;
    slug: string;
    code: number | null;
    count: number;
};

type ApiProduct = {
    id: string;
    sku: string | null;
    name: string;
    unit: string | null;
    price: number;
    currency: string; // "ARS" | "USD" | ...
};

type Props = {
    brands: BrandLite[];
};

export default function CatalogoClient({ brands }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initial = searchParams.get("brand") || brands[0]?.slug || "";
    const [activeSlug, setActiveSlug] = useState(initial);
    const [products, setProducts] = useState<ApiProduct[] | null>(null);
    const [loading, setLoading] = useState(false);

    // Cuando cambia la query externa (ej. pegar URL con ?brand=sica)
    useEffect(() => {
        const qp = searchParams.get("brand");
        if (qp && qp !== activeSlug) setActiveSlug(qp);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Trae productos de la API
    useEffect(() => {
        if (!activeSlug) return;
        setLoading(true);
        setProducts(null);

        fetch(`/api/catalogo/products?brand=${encodeURIComponent(activeSlug)}`, {
            cache: "no-store",
        })
            .then((r) => r.json())
            .then((data) => {
                setProducts(data.products ?? []);
            })
            .finally(() => setLoading(false));
    }, [activeSlug]);

    function selectBrand(slug: string) {
        setActiveSlug(slug);
        // Actualizamos la URL sin recargar la página
        const url = new URL(window.location.href);
        url.searchParams.set("brand", slug);
        router.replace(url.toString(), { scroll: false });
    }

    const activeBrand = useMemo(
        () => brands.find((b) => b.slug === activeSlug) || null,
        [brands, activeSlug]
    );

    return (
        <div className="grid grid-cols-12 gap-6">
            {/* Sidebar de marcas (20%) */}
            <aside className="col-span-12 md:col-span-3">
                <div className="rounded-lg border border-[#B5B5B5]/40 bg-white">
                    <div className="px-3 py-2 border-b font-semibold text-[#1C1C1C]">
                        Marcas
                    </div>

                    {brands.length === 0 ? (
                        <div className="p-3 text-sm text-[#646464]">No hay marcas cargadas.</div>
                    ) : (
                        <ul className="divide-y">
                            {brands.map((b) => {
                                const isActive = b.slug === activeSlug;
                                return (
                                    <li key={b.id}>
                                        <button
                                            onClick={() => selectBrand(b.slug)}
                                            className={[
                                                "w-full flex items-center justify-between px-3 py-2 text-sm",
                                                isActive ? "bg-gray-100 font-medium" : "hover:bg-gray-50",
                                            ].join(" ")}
                                        >
                                            <span className="text-[#1C1C1C]">{b.name}</span>
                                            <span className="text-xs text-[#646464]">{b.count}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </aside>

            {/* Contenido principal (80%) */}
            <main className="col-span-12 md:col-span-9">
                <div className="rounded-lg border border-[#B5B5B5]/40 bg-white p-4">
                    <h2 className="text-xl font-semibold text-[#1C1C1C] mb-2">Catálogo</h2>

                    {!activeBrand ? (
                        <p className="text-sm text-[#646464]">
                            Elegí una marca a la izquierda para ver sus productos.
                        </p>
                    ) : (
                        <>
                            <p className="text-sm text-[#646464] mb-4">
                                Mostrando productos de <strong>{activeBrand.name}</strong>
                            </p>

                            {/* Estado de carga */}
                            {loading && (
                                <div className="text-sm text-[#646464]">Cargando productos…</div>
                            )}

                            {/* Listado */}
                            {!loading && products && products.length === 0 && (
                                <div className="text-sm text-[#646464]">
                                    Esta marca no tiene productos.
                                </div>
                            )}

                            {!loading && products && products.length > 0 && (
                                <div className="overflow-hidden rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                        <tr className="text-left text-[#1C1C1C]">
                                            <th className="px-3 py-2 w-[120px]">SKU</th>
                                            <th className="px-3 py-2">Descripción</th>
                                            <th className="px-3 py-2 w-[80px]">U.M.</th>
                                            <th className="px-3 py-2 w-[140px]">Precio</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                        {products.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 text-[#1C1C1C] tabular-nums">
                                                    {p.sku ?? "—"}
                                                </td>
                                                <td className="px-3 py-2 text-[#1C1C1C]">{p.name}</td>
                                                <td className="px-3 py-2 text-[#646464]">{p.unit ?? "—"}</td>
                                                <td className="px-3 py-2 text-[#1C1C1C] tabular-nums">
                                                    {formatMoney(p.price, p.currency)}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

function formatMoney(v: number, currency: string) {
    try {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: currency || "ARS",
            maximumFractionDigits: 2,
        }).format(v || 0);
    } catch {
        return `${v?.toFixed?.(2) ?? v} ${currency || ""}`.trim();
    }
}