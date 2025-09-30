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
            select: {
                name: true
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
                            <h1 className="text-xl font-semibold text-[#1C1C1C]">Productos</h1>
                            <p className="text-sm text-[#646464] mt-1">
                                Gestión de productos - Total: {totalCount} productos (Página {page} de {totalPages})
                            </p>
                        </div>

                        <div className="p-6">
                            <ProductsPageClient
                                products={products}
                                currentPage={page}
                                totalPages={totalPages}
                                totalCount={totalCount}
                                allBrands={allBrands.map(brand => brand.name)}
                                selectedBrandSlug={brandFilter}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}