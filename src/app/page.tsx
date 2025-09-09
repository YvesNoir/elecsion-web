// src/app/page.tsx
import { prisma } from "@/lib/db";
import SearchBar from "@/components/SearchBar";
import HomeCatalogPanel from "@/components/catalog/HomeCatalogPanel";

export const revalidate = 60; // revalidar la lista de marcas cada 60s (opcional)

export default async function HomePage() {
    // Traemos marcas (solo lo necesario para el panel)
    const brands = await prisma.brand.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
    });

    return (
        <main className="w-full px-4 py-6">
            {/* Grilla: el panel ocupa la columna izquierda cuando está abierto */}
            <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Panel de Catálogo (aparece/oculta por evento ui:catalog:toggle o ?catalogo=1) */}
                <HomeCatalogPanel brands={brands} />

                {/* Columna principal */}
                <section className="md:col-span-9">
                    <h1 className="text-2xl font-semibold mb-4 text-[#1C1C1C]">
                        Elecsion
                    </h1>

                    <div className="mb-6">
                        <SearchBar placeholder="Buscar: tomacorrientes sica 10A..." />
                    </div>

                    {/* Espacio para hero/banners/destacados */}
                    <div className="rounded-lg border border-dashed border-[#B5B5B5]/40 p-6 text-sm text-[#646464]">
                        Contenido de portada (banners, destacados, etc.)
                    </div>
                </section>
            </div>
        </main>
    );
}