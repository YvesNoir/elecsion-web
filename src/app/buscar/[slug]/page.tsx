// src/app/buscar/[slug]/page.tsx
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import { searchProducts } from "@/lib/search";
import { prisma } from "@/lib/db";
import { unslugify } from "@/lib/slug";
import type { Metadata } from "next";

type RouteParams = { slug: string };
type RouteSearchParams = { page?: string };

// ---------- util para Decimal -> number ----------
function toNumber(x: any) {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
}

// ---------- SEO dinámico ----------
export async function generateMetadata(
    { params }: { params: Promise<RouteParams> }
): Promise<Metadata> {
    const { slug } = await params;
    const q = unslugify(slug);
    const title = `${q} | Buscar en Elecsion`;
    const description = `Resultados para "${q}" en Elecsion: catálogo eléctrico y ferretería.`;
    const path = `/buscar/${slug}`;
    return {
        title,
        description,
        alternates: { canonical: path },
        openGraph: { title, description, url: path },
    };
}

// resultados siempre frescos
export const dynamic = "force-dynamic";

export default async function BuscarPage(
    { params, searchParams }: { params: Promise<RouteParams>, searchParams: Promise<RouteSearchParams> }
) {
    const [{ slug }, { page: pageStr }] = await Promise.all([params, searchParams]);

    const q = unslugify(slug);
    const page = Math.max(1, Number(pageStr ?? "1"));
    const pageSize = 24;
    const offset = (page - 1) * pageSize;

    // 1) Buscar productos
    const { items, total } = await searchProducts(q, pageSize, offset);

    // 2) Registrar/actualizar landing de búsqueda (para panel SEO)
    await prisma.searchLanding.upsert({
        where: { slug: `/buscar/${slug}` },
        update: { query: q, title: q, updatedAt: new Date() },
        create: { slug: `/buscar/${slug}`, query: q, title: q, isPublished: true },
    });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <main className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex items-baseline justify-between">
                <h1 className="text-xl font-semibold">Resultados: “{q}”</h1>
                <p className="text-sm text-gray-600">{total} productos</p>
            </div>

            {items.length === 0 && (
                <p>No se encontraron productos para “{q}”. Probá con otra palabra o marca.</p>
            )}

            <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {items.map((p: any) => {
                    const img = p.images?.[0]?.url ?? "/no-image.png";
                    const price = toNumber(p.priceBase);
                    const priceText = price > 0
                        ? `$ ${price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                        : "Consultar";

                    return (
                        <li key={p.id} className="border rounded-lg p-3 flex flex-col bg-white">
                            <div className="text-xs text-[#646464]">{p.sku}</div>

                            <Link
                                href={`/producto/${p.slug}`}
                                className="font-medium line-clamp-2 mt-0.5 hover:underline text-[#1C1C1C]"
                            >
                                {p.name}
                            </Link>

                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img}
                                alt={p.images?.[0]?.alt ?? p.name}
                                className="w-full h-36 object-cover mt-2 rounded border border-[#B5B5B5]/30"
                            />

                            <div className="mt-2 text-sm text-[#1C1C1C]">{priceText} {p.currency}</div>

                            <div className="mt-2 flex gap-2">
                                <Link
                                    href={`/producto/${p.slug}`}
                                    className="btn-outline px-3 py-2 text-sm"
                                >
                                    Ver detalle
                                </Link>

                                <AddToCartButton
                                    productId={p.id}
                                    name={p.name}
                                    price={price}
                                    className="btn-primary px-3 py-2 text-sm"
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>

            {totalPages > 1 && (
                <div className="flex items-center gap-2 mt-6">
                    {page > 1 && (
                        <a className="btn-outline px-3 py-1.5" href={`?page=${page - 1}`}>
                            Anterior
                        </a>
                    )}
                    <span className="text-sm">
            Página {page} de {totalPages}
          </span>
                    {page < totalPages && (
                        <a className="btn-outline px-3 py-1.5" href={`?page=${page + 1}`}>
                            Siguiente
                        </a>
                    )}
                </div>
            )}
        </main>
    );
}