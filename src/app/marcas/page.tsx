import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import CartActionCell from "@/components/cart/CartActionCell";

type RouteParams = { slug: string };

// helpers
function toNumber(x: unknown): number {
    const n = Number(
        typeof x === "string" ? x.replace(/\./g, "").replace(",", ".") : x
    );
    return Number.isFinite(n) ? n : 0;
}
function fmtAr(n: number) {
    return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------- SEO dinámico ----------
export async function generateMetadata(
    { params }: { params: Promise<RouteParams> }
): Promise<Metadata> {
    const { slug } = await params;
    const brand = await prisma.brand.findUnique({
        where: { slug },
        select: { name: true },
    });

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

// ---------- Página ----------
export default async function BrandDetailPage(
    { params }: { params: Promise<RouteParams> }
) {
    const { slug } = await params;

    const brand = await prisma.brand.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            slug: true,
            products: {
                where: { isActive: true },
                orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
                select: {
                    id: true,
                    sku: true,
                    name: true,
                    slug: true,
                    unit: true,
                    priceBase: true,
                    currency: true,
                },
            },
        },
    });

    if (!brand) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="text-sm mb-6">
                    <Link href="/marcas" className="inline-flex items-center gap-2 text-[#384A93] hover:underline">
                        ← Todas las marcas
                    </Link>
                </div>
                <h1 className="text-2xl font-semibold text-[#1C1C1C]">Marca no encontrada</h1>
                <p className="mt-2 text-[#646464]">La marca que buscás no existe o no tiene productos disponibles.</p>
            </div>
        );
    }

    const products = brand.products;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 text-[#1C1C1C]">
            {/* Breadcrumb + Back */}
            <div className="text-sm mb-6 flex items-center justify-between">
                <div className="text-[#646464]">
                    <Link href="/" className="hover:underline">Inicio</Link>
                    <span className="mx-2">/</span>
                    <Link href="/marcas" className="hover:underline">Marcas</Link>
                    <span className="mx-2">/</span>
                    <span className="text-[#1C1C1C]">{brand.name}</span>
                </div>
                <Link href="/marcas" className="inline-flex items-center gap-2 text-[#384A93] hover:underline">
                    ← Todas las marcas
                </Link>
            </div>

            <h1 className="text-2xl font-semibold mb-4">{brand.name}</h1>

            <div className="overflow-x-auto rounded-lg border border-[#B5B5B5]/40 bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-white">
                    <tr className="border-b">
                        <th className="px-3 py-2 text-left font-semibold text-[#1C1C1C]">SKU</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#1C1C1C]">Producto</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#1C1C1C]">Unidad</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#1C1C1C]">Precio</th>
                        <th className="px-3 py-2 text-right font-semibold text-[#1C1C1C]">Acciones</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y">
                    {products.map((p) => {
                        const price = toNumber(p.priceBase);
                        return (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-[#646464]">{p.sku ?? "-"}</td>
                                <td className="px-3 py-2">
                                    <Link href={`/producto/${p.slug}`} className="text-[#1C1C1C] hover:underline">
                                        {p.name}
                                    </Link>
                                </td>
                                <td className="px-3 py-2 text-[#646464]">{p.unit ?? "unidad"}</td>
                                <td className="px-3 py-2 text-[#1C1C1C]">
                                    {price > 0 ? `$ ${fmtAr(price)}` : "Consultar"}
                                </td>

                                <CartActionCell
                                    productId={p.id}
                                    name={p.name}
                                    price={price}
                                    slug={p.slug}
                                />
                            </tr>
                        );
                    })}

                    {products.length === 0 && (
                        <tr>
                            <td className="px-3 py-6 text-[#646464]" colSpan={5}>
                                Esta marca no tiene productos disponibles por el momento.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}