// src/app/producto/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import AddToCartButton from "@/components/AddToCartButton";
import ProductImage from "@/components/ProductImage";
import { mapTangoProduct, TANGO_WEB_PRICE_LIST_CODE } from "@/lib/products-tango";

type PageProps = { params: Promise<{ slug: string }> };

async function getTangoProduct(slug: string) {
    const row = await prisma.productsTango.findFirst({
        where: {
            priceListCode: TANGO_WEB_PRICE_LIST_CODE,
            isActive: true,
            OR: [
                { articleCode: { equals: slug, mode: "insensitive" } },
                { synonym: { equals: slug, mode: "insensitive" } },
            ],
        },
        select: {
            articleCode: true,
            synonym: true,
            description: true,
            price: true,
            currency: true,
            stockQty: true,
            taxRate: true,
            brandName: true,
        },
    });

    return row ? mapTangoProduct(row) : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const product = await getTangoProduct(slug);

    if (!product) return { title: "Producto no encontrado | Elecsion" };

    const title = `${product.name} | ${product.brand?.name ?? "Elecsion"}`;
    return {
        title,
        description: product.name,
        alternates: { canonical: `/producto/${product.articleCode}` },
        openGraph: { title, url: `/producto/${product.articleCode}`, siteName: "Elecsion" },
    };
}

export default async function ProductPage({ params }: PageProps) {
    const { slug } = await params;
    const product = await getTangoProduct(slug);
    if (!product) notFound();

    const priceWithTax = product.priceBase * (1 + (product.taxRate ?? 0));
    const relatedRows = product.brand
        ? await prisma.productsTango.findMany({
            where: {
                priceListCode: TANGO_WEB_PRICE_LIST_CODE,
                isActive: true,
                brandName: product.brand.name,
                articleCode: { not: product.articleCode },
            },
            orderBy: { articleCode: "asc" },
            take: 4,
            select: {
                articleCode: true,
                synonym: true,
                description: true,
                price: true,
                currency: true,
                stockQty: true,
                taxRate: true,
                brandName: true,
            },
        })
        : [];
    const related = relatedRows.map(mapTangoProduct);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <nav className="text-sm mb-6 text-[#646464]">
                <Link href="/" className="hover:underline">Inicio</Link>
                <span className="mx-2">/</span>
                {product.brand ? (
                    <Link href={`/catalogo?brand=${product.brand.slug}`} className="hover:underline">
                        {product.brand.name}
                    </Link>
                ) : <span>Producto</span>}
                <span className="mx-2">/</span>
                <span className="text-[#1C1C1C]">{product.name}</span>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="w-full rounded-lg border border-[#B5B5B5]/40 bg-white p-3">
                    <ProductImage
                        sku={product.sku}
                        imageCodes={product.imageCodes}
                        alt={product.name}
                        className="aspect-square w-full"
                    />
                </div>

                <div className="flex flex-col gap-4">
                    <h1 className="text-2xl font-semibold text-[#1C1C1C]">{product.name}</h1>

                    <div className="text-sm text-[#646464] space-y-1">
                        {product.brand && (
                            <div>Marca: <Link href={`/catalogo?brand=${product.brand.slug}`} className="text-[#384A93] hover:underline">{product.brand.name}</Link></div>
                        )}
                        <div>SKU: {product.sku}</div>
                        <div>Código de artículo: {product.articleCode}</div>
                    </div>

                    <div className="mt-2">
                        <div className="text-3xl font-bold text-[#1C1C1C]">
                            {priceWithTax > 0 ? `$ ${priceWithTax.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "Consultar"}
                        </div>
                        {product.taxRate && product.taxRate > 0 && (
                            <div className="text-xs text-[#646464]">Precio con impuestos incluídos ({Math.round(product.taxRate * 100)}%)</div>
                        )}
                    </div>

                    <div className="mt-4">
                        <AddToCartButton
                            productId={product.articleCode}
                            name={product.name}
                            price={priceWithTax || product.priceBase}
                            className="btn-primary"
                        />
                    </div>

                    <div className="mt-6">
                        <h2 className="text-lg font-semibold mb-2">Descripción</h2>
                        <p className="text-[#1C1C1C]/80 leading-relaxed whitespace-pre-wrap">{product.name}</p>
                    </div>
                </div>
            </div>

            {related.length > 0 && (
                <section className="mt-12">
                    <h3 className="text-lg font-semibold mb-4">Más de {product.brand?.name}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {related.map((relatedProduct) => (
                            <Link
                                key={relatedProduct.id}
                                href={`/producto/${relatedProduct.articleCode}`}
                                className="block rounded-lg border border-[#B5B5B5]/40 bg-white p-3 hover:shadow-sm transition"
                            >
                                <ProductImage
                                    sku={relatedProduct.sku}
                                    imageCodes={relatedProduct.imageCodes}
                                    alt={relatedProduct.name}
                                    className="aspect-square w-full mb-3"
                                />
                                <div className="text-sm font-medium line-clamp-2 mb-1 text-[#1C1C1C]">{relatedProduct.name}</div>
                                <div className="text-sm text-[#1C1C1C]">
                                    {relatedProduct.priceBase > 0 ? `$ ${relatedProduct.priceBase.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "Consultar"}
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
