import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import AccountSidebar from '@/components/AccountSidebar';
import ProductsPageClient from '@/components/ProductsPageClient';

type SearchParams = {
    page?: string;
    marca?: string;
}

export default async function ProductosPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/');
    }

    const resolvedSearchParams = await searchParams;
    const page = Number(resolvedSearchParams.page) || 1;
    const brandFilter = resolvedSearchParams.marca;
    const limit = 30;
    const skip = (page - 1) * limit;

    // Construir filtros
    const whereCondition: any = {
        isDeleted: false
    };

    if (brandFilter) {
        whereCondition.brand = {
            slug: brandFilter
        };
    }

    // Obtener productos paginados y todas las marcas
    const [productsRaw, totalCount, allBrands] = await Promise.all([
        prisma.product.findMany({
            where: whereCondition,
            select: {
                id: true,
                sku: true,
                name: true,
                priceBase: true,
                currency: true,
                stockQty: true,
                taxRate: true,
                isActive: true,
                isFeatured: true,
                brand: {
                    select: {
                        name: true,
                        slug: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            },
            skip,
            take: limit,
        }),
        prisma.product.count({ where: whereCondition }),
        prisma.brand.findMany({
            where: {
                isActive: true
            },
            select: {
                name: true,
                slug: true
            },
            orderBy: {
                name: 'asc'
            }
        })
    ]);

    // Convertir Decimal a number para componentes cliente
    const products = productsRaw.map(product => ({
        ...product,
        priceBase: Number(product.priceBase),
        stockQty: product.stockQty ? Number(product.stockQty) : 0,
        taxRate: product.taxRate ? Number(product.taxRate) : null,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return (
        <>
            <div className="mb-4">
                <Link 
                    href="/" 
                    className="text-[#384A93] hover:underline text-sm"
                >
                    ← Catálogo
                </Link>
                <span className="mx-2 text-[#646464]">Mi Cuenta</span>
                <span className="mx-2 text-[#646464]">&gt;</span>
                <span className="mx-2 text-[#646464]">Productos</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar - 1/4 del ancho */}
                <div className="lg:col-span-1">
                    <AccountSidebar />
                </div>

                {/* Contenido principal - 3/4 del ancho */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg border border-[#B5B5B5]/40 overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#B5B5B5]/40">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-xl font-semibold text-[#1C1C1C]">Productos</h1>
                                    <p className="text-sm text-[#646464] mt-1">
                                        Gestión de productos - Total: {totalCount} productos (Página {page} de {totalPages})
                                    </p>
                                </div>
                                <Link
                                    href="/mi-cuenta/productos/subir-imagenes"
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#384A93] rounded-md hover:bg-[#2e3d7a] transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Subir Imágenes
                                </Link>
                            </div>
                        </div>

                        <div className="p-6">
                            <ProductsPageClient
                                products={products}
                                currentPage={page}
                                totalPages={totalPages}
                                totalCount={totalCount}
                                allBrands={allBrands}
                                selectedBrandSlug={brandFilter}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}