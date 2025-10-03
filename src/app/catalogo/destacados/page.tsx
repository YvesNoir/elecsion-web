// src/app/catalogo/destacados/page.tsx
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import CatalogClient from "@/components/catalog/CatalogClient";

export const revalidate = 30;

type Props = {
    // En Next 15 searchParams es async
    searchParams: Promise<{ page?: string; search?: string }>;
};

export default async function ProductosDestacadosPage({ searchParams }: Props) {
    const params = await searchParams;
    const session = await getSession();
    const searchTerm = (params?.search ?? "").trim();
    const currentPage = parseInt(params?.page ?? "1", 10);
    const productsPerPage = 30;
    const skip = (currentPage - 1) * productsPerPage;

    const brandsRaw = await prisma.brand.findMany({
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            slug: true,
            _count: {
                select: {
                    products: {
                        where: { isActive: true, isDeleted: false, isFeatured: true }
                    }
                }
            },
        },
    });

    // Filtrar marcas que tienen al menos 1 producto destacado activo
    const brands = brandsRaw.filter(brand => brand._count.products > 0);

    // Construir condiciones de búsqueda
    const searchConditions = searchTerm ? {
        OR: [
            { sku: { contains: searchTerm } },
            { name: { contains: searchTerm } },
            { description: { contains: searchTerm } },
        ]
    } : {};

    // Construir filtros base - solo productos destacados
    const baseFilter = {
        isActive: true,
        isDeleted: false,
        isFeatured: true, // Solo productos destacados
        ...searchConditions,
    };

    // Obtener el total de productos para la paginación
    const totalProducts = await prisma.product.count({
        where: baseFilter,
    });

    const totalPages = Math.ceil(totalProducts / productsPerPage);

    const rawProducts = await prisma.product.findMany({
        where: baseFilter,
        orderBy: [{ sku: "asc" }, { name: "asc" }],
        skip,
        take: productsPerPage,
        select: {
            id: true,
            sku: true,
            name: true,
            unit: true,
            priceBase: true,  // Prisma.Decimal
            currency: true,
            taxRate: true,    // Prisma.Decimal | null
            brand: {
                select: {
                    name: true,
                    slug: true,
                }
            },
        },
    });

    // Serializamos a number
    const products = rawProducts.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        priceBase: p.priceBase ? Number(p.priceBase) : 0,
        currency: p.currency ?? "ARS",
        taxRate: p.taxRate === null ? null : Number(p.taxRate),
        brand: p.brand,
    }));

    return (
        <>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-[#1C1C1C] mb-2">Productos Destacados</h1>
                <p className="text-[#646464]">
                    Descubre nuestra selección especial de productos destacados
                </p>
            </div>

            <CatalogClient
                brands={brands}
                products={products}
                selectedBrand={null}
                currentSlug=""
                searchTerm={searchTerm}
                totalProducts={totalProducts}
                currentPage={currentPage}
                totalPages={totalPages}
                productsPerPage={productsPerPage}
                isLoggedIn={!!session?.user}
                isFeaturedPage={true}
            />
        </>
    );
}