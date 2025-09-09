// src/app/producto/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import AddToCartButton from "@/components/AddToCartButton";

type PageProps = { params: { slug: string } };

function toNumber(x: any) {
    // Prisma.Decimal -> number (o null/undefined a 0)
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
}

// ---------- SEO dinámico ----------
export async function generateMetadata(
    { params }: PageProps
): Promise<Metadata> {
    const p = await prisma.product.findUnique({
        where: { slug: params.slug },
        select: {
            name: true,
            description: true,
            brand: { select: { name: true } },
        },
    });

    if (!p) return { title: "Producto no encontrado | Elecsion" };

    const title = `${p.name} | ${p.brand?.name ?? "Elecsion"}`;
    return {
        title,
        description: p.description ?? undefined,
        alternates: { canonical: `/producto/${params.slug}` },
        openGraph: {
            title,
            description: p.description ?? undefined,
            url: `/producto/${params.slug}`,
            siteName: "Elecsion",
        },
    };
}

// ---------- Página ----------
export default async function ProductPage({ params }: PageProps) {
    const product = await prisma.product.findUnique({
        where: { slug: params.slug },
        include: {
            brand: { select: { id: true, name: true, slug: true } },
            images: { orderBy: { position: "asc" } },
        },
    });

    if (!product || !product.isActive) notFound();

    const price = toNumber(product.priceBase);
    const taxRate = toNumber(product.taxRate);
    const priceWithTax = price * (1 + taxRate);

    const mainImg =
        product.images?.[0]?.url || "/img/placeholder-product.png";

    // Otros productos de la misma marca (para la sección "Relacionados")
    const related = await prisma.product.findMany({
        where: {
            isActive: true,
            brandId: product.brandId ?? undefined,
            NOT: { id: product.id },
        },
        orderBy: { updatedAt: "desc" },
        take: 4,
        select: { id: true, name: true, slug: true, priceBase: true, images: { take: 1 } },
    });

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Breadcrumbs */}
            <nav className="text-sm mb-6 text-[#646464]">
                <Link href="/" className="hover:underline">Inicio</Link>
                <span className="mx-2">/</span>
                {product.brand?.slug ? (
                    <Link href={`/marcas/${product.brand.slug}`} className="hover:underline">
                        {product.brand?.name}
                    </Link>
                ) : (
                    <span>Producto</span>
                )}
                <span className="mx-2">/</span>
                <span className="text-[#1C1C1C]">{product.name}</span>
            </nav>

            {/* Cabecera producto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Imagen */}
                <div className="w-full rounded-lg border border-[#B5B5B5]/40 bg-white p-3">
                    {/* Si preferís <img>, podés reemplazar Image por img */}
                    <Image
                        src={mainImg}
                        alt={product.name}
                        width={900}
                        height={900}
                        className="w-full h-auto object-contain rounded"
                        priority
                    />
                </div>

                {/* Info */}
                <div className="flex flex-col gap-4">
                    <h1 className="text-2xl font-semibold text-[#1C1C1C]">{product.name}</h1>

                    <div className="text-sm text-[#646464] space-y-1">
                        {product.brand?.name && (
                            <div>Marca:{" "}
                                <Link href={`/marcas/${product.brand.slug}`} className="text-[#384A93] hover:underline">
                                    {product.brand.name}
                                </Link>
                            </div>
                        )}
                        {product.sku && <div>SKU: {product.sku}</div>}
                        {product.unit && <div>Unidad: {product.unit}</div>}
                    </div>

                    {/* Precio */}
                    <div className="mt-2">
                        <div className="text-3xl font-bold text-[#1C1C1C]">
                            {priceWithTax > 0
                                ? `$ ${priceWithTax.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                                : "Consultar"}
                        </div>
                        {taxRate > 0 && (
                            <div className="text-xs text-[#646464]">
                                Precio con impuestos incluídos ({Math.round(taxRate * 100)}%)
                            </div>
                        )}
                    </div>

                    {/* CTA */}
                    <div className="mt-4">
                        <AddToCartButton
                            productId={product.id}
                            name={product.name}
                            price={priceWithTax || price}
                            className="btn-primary"
                        />
                    </div>

                    {/* Descripción */}
                    {product.description && (
                        <div className="mt-6">
                            <h2 className="text-lg font-semibold mb-2">Descripción</h2>
                            <p className="text-[#1C1C1C]/80 leading-relaxed whitespace-pre-wrap">
                                {product.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Relacionados */}
            {related.length > 0 && (
                <section className="mt-12">
                    <h3 className="text-lg font-semibold mb-4">
                        Más de {product.brand?.name}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {related.map((r) => {
                            const img = r.images?.[0]?.url || "/img/placeholder-product.png";
                            const rp = toNumber(r.priceBase);
                            return (
                                <Link
                                    key={r.id}
                                    href={`/producto/${r.slug}`}
                                    className="block rounded-lg border border-[#B5B5B5]/40 bg-white p-3 hover:shadow-sm transition"
                                >
                                    <Image
                                        src={img}
                                        alt={r.name}
                                        width={400}
                                        height={400}
                                        className="w-full h-auto object-contain rounded mb-3"
                                    />
                                    <div className="text-sm font-medium line-clamp-2 mb-1 text-[#1C1C1C]">
                                        {r.name}
                                    </div>
                                    <div className="text-sm text-[#1C1C1C]">
                                        {rp > 0 ? `$ ${rp.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "Consultar"}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}