// src/app/catalogo/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic"; // evita caché estática
export const revalidate = 0;

export default async function CatalogoPage() {
    // Traemos las marcas ordenadas, con conteo de productos (opcional)
    const brands = await prisma.brand.findMany({
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            slug: true,
            _count: { select: { products: true } },
        },
    });

    return (
        <div className="full-bleed">
            <div className="py-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[20%_80%]">
                    {/* Columna marcas */}
                    <aside className="rounded-lg border border-[#B5B5B5]/40 bg-white">
                        <div className="px-3 py-2 border-b font-semibold text-[#1C1C1C]">
                            Marcas
                        </div>

                        {brands.length === 0 ? (
                            <div className="p-3 text-sm text-[#646464]">
                                No hay marcas cargadas.
                            </div>
                        ) : (
                            <ul className="divide-y">
                                {brands.map((b) => (
                                    <li key={b.id} className="hover:bg-gray-50">
                                        <Link
                                            href={`/marcas/${b.slug}`}
                                            className="flex items-center justify-between px-3 py-2 text-sm"
                                        >
                                            <span className="text-[#1C1C1C]">{b.name}</span>
                                            <span className="text-xs text-[#646464]">
                        {b._count.products}
                      </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </aside>

                    {/* Contenido principal */}
                    <section className="rounded-lg border border-[#B5B5B5]/40 bg-white p-5">
                        <h1 className="text-xl font-semibold mb-2">Catálogo</h1>
                        <p className="text-sm text-[#646464]">
                            Elegí una marca a la izquierda para ver sus productos.
                        </p>

                        <div className="mt-4 rounded-md border border-dashed border-[#B5B5B5]/40 p-4 text-xs text-[#646464]">
                            (Aquí va el listado de productos de la marca seleccionada)
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}