import type { Metadata } from "next";
import Link from "next/link";
import { getTangoBrands } from "@/lib/products-tango";

export const metadata: Metadata = {
    title: "Marcas | Elecsion",
    description: "Todas las marcas disponibles en Elecsion.",
    alternates: { canonical: "/marcas" },
    openGraph: {
        title: "Marcas | Elecsion",
        description: "Todas las marcas disponibles en Elecsion.",
        url: "/marcas",
    },
};

export default async function BrandsPage() {
    const brands = await getTangoBrands();

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 text-[#1C1C1C]">
            <div className="text-sm mb-6 text-[#646464]">
                <Link href="/" className="hover:underline">Inicio</Link>
                <span className="mx-2">/</span>
                <span>Marcas</span>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#1C1C1C] mb-2">Todas las Marcas</h1>
                <p className="text-[#646464]">Explorá productos por marca</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {brands.map((brand) => (
                    <Link
                        key={brand.id}
                        href={`/marcas/${brand.slug}`}
                        className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
                    >
                        <h3 className="text-lg font-semibold text-[#1C1C1C] mb-2">{brand.name}</h3>
                        <p className="text-[#646464] text-sm">
                            {brand._count.products} {brand._count.products === 1 ? "producto" : "productos"}
                        </p>
                    </Link>
                ))}
            </div>

            {brands.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-[#646464]">No hay marcas disponibles en este momento.</p>
                </div>
            )}
        </div>
    );
}
