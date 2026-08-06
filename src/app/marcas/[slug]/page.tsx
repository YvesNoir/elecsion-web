import type { Metadata } from "next";
import Link from "next/link";
import AddToCartLink from "@/components/AddToCartLink";
import { getTangoBrandNameBySlug, mapTangoProduct, TANGO_WEB_PRICE_LIST_CODE } from "@/lib/products-tango";
import { prisma } from "@/lib/db";

type RouteParams = { slug: string };

function fmtAr(n: number) {
    return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function getBrand(slug: string) {
    const name = await getTangoBrandNameBySlug(slug);
    if (!name) return null;

    const rows = await prisma.productsTango.findMany({
        where: {
            priceListCode: TANGO_WEB_PRICE_LIST_CODE,
            isActive: true,
            brandName: name,
        },
        orderBy: { articleCode: "asc" },
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

    return { name, products: rows.map(mapTangoProduct) };
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
    const { slug } = await params;
    const brand = await getBrand(slug);
    const title = brand?.name ? `${brand.name} | Marcas | Elecsion` : "Marca | Elecsion";
    const description = brand?.name
        ? `Productos de la marca ${brand.name} en Elecsion.`
        : "Productos por marca en Elecsion.";

    return {
        title,
        description,
        alternates: { canonical: `/marcas/${slug}` },
        openGraph: { title, description, url: `/marcas/${slug}` },
    };
}

export default async function BrandDetailPage({ params }: { params: Promise<RouteParams> }) {
    const { slug } = await params;
    const brand = await getBrand(slug);

    if (!brand) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <Link href="/marcas" className="text-[#384A93] hover:underline">← Todas las marcas</Link>
                <h1 className="text-2xl font-semibold text-[#1C1C1C] mt-6">Marca no encontrada</h1>
                <p className="mt-2 text-[#646464]">La marca que buscás no existe o no tiene productos disponibles.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 text-[#1C1C1C]">
            <div className="text-sm mb-6 flex items-center justify-between">
                <div className="text-[#646464]">
                    <Link href="/" className="hover:underline">Inicio</Link>
                    <span className="mx-2">/</span>
                    <Link href="/marcas" className="hover:underline">Marcas</Link>
                    <span className="mx-2">/</span>
                    <span className="text-[#1C1C1C]">{brand.name}</span>
                </div>
                <Link href="/marcas" className="text-[#384A93] hover:underline">← Todas las marcas</Link>
            </div>

            <h1 className="text-2xl font-semibold mb-4">{brand.name}</h1>

            <div className="overflow-x-auto rounded-lg border border-[#B5B5B5]/40 bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-white">
                    <tr className="border-b">
                        <th className="px-3 py-2 text-left font-semibold">SKU</th>
                        <th className="px-3 py-2 text-left font-semibold">Producto</th>
                        <th className="px-3 py-2 text-left font-semibold">Precio</th>
                        <th className="px-3 py-2 text-right font-semibold">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y">
                    {brand.products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-[#646464]">{product.sku}</td>
                            <td className="px-3 py-2">
                                <Link href={`/producto/${product.articleCode}`} className="text-[#1C1C1C] hover:underline">
                                    {product.name}
                                </Link>
                            </td>
                            <td className="px-3 py-2 text-[#1C1C1C]">
                                {product.priceBase > 0 ? `$ ${fmtAr(product.priceBase)}` : "Consultar"}
                            </td>
                            <td className="px-3 py-2">
                                <div className="flex items-center gap-2 justify-end">
                                    <Link
                                        href={`/producto/${product.articleCode}`}
                                        className="inline-flex h-8 items-center rounded-md border border-[#B5B5B5]/60 px-3 text-sm hover:bg-[#f5f5f7] whitespace-nowrap"
                                    >
                                        Ver detalle
                                    </Link>
                                    <AddToCartLink
                                        productId={product.articleCode}
                                        name={product.name}
                                        price={product.priceBase}
                                        className="inline-flex h-8 items-center rounded-md border border-[#B5B5B5]/60 px-3 text-sm hover:bg-[#f5f5f7] whitespace-nowrap"
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                    {brand.products.length === 0 && (
                        <tr><td className="px-3 py-6 text-[#646464]" colSpan={4}>No hay productos para esta marca.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
