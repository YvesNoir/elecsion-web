// src/app/catalogo/page.tsx
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import CatalogClient from "@/components/catalog/CatalogClient";

export const revalidate = 30;

type Props = {
    // En Next 15 searchParams es async
    searchParams: Promise<{ brand?: string; page?: string; search?: string }>;
};

export default async function CatalogoPage({ searchParams }: Props) {
    const params = await searchParams;
    const session = await getSession();
    const currentSlug = (params?.brand ?? "").toLowerCase().trim();
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
                        where: { isActive: true, isDeleted: false }
                    } 
                } 
            },
        },
    });

    // Filtrar marcas que tienen al menos 1 producto activo
    const brands = brandsRaw.filter(brand => brand._count.products > 0);

    const selectedBrand = brands.find((b) => b.slug === currentSlug) ?? null;

    // Construir condiciones de búsqueda (SQLite no soporta mode: "insensitive")
    const searchConditions = searchTerm ? {
        OR: [
            { sku: { contains: searchTerm } },
            { name: { contains: searchTerm } },
            { description: { contains: searchTerm } },
        ]
    } : {};

    // Construir filtros base
    const baseFilter = {
        isActive: true,
        isDeleted: false,
        ...(selectedBrand && { brandId: selectedBrand.id }),
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
            description: true,
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

    // <<<<<<<<<< IMPORTANTÍSIMO: serializamos a number >>>>>>>>>>
    const products = rawProducts.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        unit: p.unit,
        priceBase: p.priceBase ? Number(p.priceBase) : 0,
        currency: p.currency ?? "ARS",
        taxRate: p.taxRate === null ? null : Number(p.taxRate),
        brand: p.brand,
    }));

    return (
        <CatalogClient 
            brands={brands}
            products={products}
            selectedBrand={selectedBrand}
            currentSlug={currentSlug}
            searchTerm={searchTerm}
            totalProducts={totalProducts}
            currentPage={currentPage}
            totalPages={totalPages}
            productsPerPage={productsPerPage}
            isLoggedIn={!!session?.user}
        />
    );
}