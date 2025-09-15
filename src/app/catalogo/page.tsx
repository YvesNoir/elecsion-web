// src/app/catalogo/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCardRow from "@/components/catalog/ProductCardRow";

export const revalidate = 30;

type Props = {
    // En Next 15 searchParams es async
    searchParams: Promise<{ brand?: string }>;
};

export default async function CatalogoPage({ searchParams }: Props) {
    const params = await searchParams;
    const currentSlug = (params?.brand ?? "").toLowerCase().trim();

    const brands = await prisma.brand.findMany({
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            slug: true,
            _count: { select: { products: true } },
        },
    });

    const selectedBrand = brands.find((b) => b.slug === currentSlug) ?? null;

    const rawProducts = selectedBrand
        ? await prisma.product.findMany({
            where: { brandId: selectedBrand.id, isActive: true },
            orderBy: [{ sku: "asc" }, { name: "asc" }],
            select: {
                id: true,
                sku: true,
                name: true,
                unit: true,
                priceBase: true,  // Prisma.Decimal
                currency: true,
                taxRate: true,    // Prisma.Decimal | null
                stockQty: true,   // Prisma.Decimal | null
            },
        })
        : [];

    // <<<<<<<<<< IMPORTANTÍSIMO: serializamos a number >>>>>>>>>>
    const products = rawProducts.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        priceBase: p.priceBase ? Number(p.priceBase) : 0,
        currency: p.currency ?? "ARS",
        taxRate: p.taxRate === null ? null : Number(p.taxRate),
        stockQty: p.stockQty === null ? null : Number(p.stockQty),
    }));

    return (
        <div className="w-full">
            <div className="mx-auto w-full max-w-[1500px] py-6">
                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar marcas */}
                    <aside className="col-span-12 md:col-span-3">
                        <div className="rounded-lg border border-[#B5B5B5]/40 bg-white">
                            <div className="px-3 py-2 border-b font-semibold text-[#1C1C1C]">Marcas</div>
                            <ul className="divide-y">
                                {brands.map((b) => {
                                    const active = b.slug === currentSlug;
                                    return (
                                        <li key={b.id}>
                                            <Link
                                                href={`/catalogo?brand=${b.slug}`}
                                                className={`flex items-center justify-between px-3 py-2 text-sm transition ${
                                                    active ? "bg-gray-100 text-[#1C1C1C] font-medium" : "hover:bg-gray-50"
                                                }`}
                                            >
                                                <span>{b.name}</span>
                                                <span className="text-xs text-[#646464]">{b._count.products}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </aside>

                    {/* Contenido principal */}
                    <main className="col-span-12 md:col-span-9">
                        <div className="bg-white">
                            {!selectedBrand ? (
                                <>
                                    <h1 className="text-xl sm:text-2xl font-semibold text-[#1C1C1C]">Catálogo</h1>
                                    <p className="mt-2 text-sm text-[#646464]">
                                        Elegí una marca a la izquierda para ver sus productos.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h1 className="text-xl sm:text-2xl font-semibold text-[#1C1C1C]">{selectedBrand.name}</h1>
                                    <p className="mt-2 text-sm text-[#646464]">
                                        {products.length} {products.length === 1 ? 'producto' : 'productos'}
                                    </p>

                                    {products.length === 0 ? (
                                        <div className="mt-6 rounded-md border border-dashed p-6 text-sm text-[#7a7a7a]">
                                            No hay productos para esta marca.
                                        </div>
                                    ) : (
                                        <ul className="mt-4 space-y-3">
                                            {products.map((p) => (
                                                <ProductCardRow
                                                    key={p.id}
                                                    sku={p.sku}
                                                    name={p.name}
                                                    unit={p.unit}
                                                    priceBase={p.priceBase}   // <- ya es number
                                                    currency={p.currency}
                                                    taxRate={p.taxRate}       // <- number | null
                                                    stockQty={p.stockQty}     // <- number | null
                                                />
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}